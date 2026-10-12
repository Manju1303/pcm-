-- ==============================================================================
-- Supabase / PostgreSQL Schema for IoT Solar Dryer with PCM Thermal Storage
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. DEVICES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'solar-dryer-01'
    name VARCHAR(128) NOT NULL,
    description TEXT,
    location VARCHAR(128),
    firmware_version VARCHAR(32) DEFAULT 'v1.0.0',
    api_key_hash VARCHAR(256), -- hashed API ingestion key
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. SENSOR READINGS TABLE (TIME-SERIES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL, -- UTC ISO-8601 from ESP32 or server ingress
    tray1_temp NUMERIC(5, 2), -- Temperature in °C (NULL if disconnected)
    tray2_temp NUMERIC(5, 2), -- Temperature in °C (NULL if disconnected)
    pcm_temp NUMERIC(5, 2),   -- PCM Temperature in °C
    tray1_status VARCHAR(20) DEFAULT 'ok', -- 'ok', 'disconnected', 'faulty'
    tray2_status VARCHAR(20) DEFAULT 'ok',
    pcm_status VARCHAR(20) DEFAULT 'ok',
    battery_voltage NUMERIC(4, 2), -- e.g. 12.60 V
    operating_status VARCHAR(64) DEFAULT 'Unknown/Not Configured', -- Daytime Drying, PCM Charging, Nighttime Heat Release, Idle
    is_demo BOOLEAN DEFAULT false,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- High-performance indexes for time-series aggregation and queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_time 
    ON sensor_readings (device_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
    ON sensor_readings (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_is_demo 
    ON sensor_readings (is_demo);

-- ------------------------------------------------------------------------------
-- 3. ALERT RULES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) REFERENCES devices(id) ON DELETE CASCADE,
    sensor_name VARCHAR(32) NOT NULL, -- 'tray1', 'tray2', 'pcm', 'battery'
    condition VARCHAR(16) NOT NULL, -- 'gt', 'lt', 'disconnected'
    threshold_value NUMERIC(6, 2),
    hysteresis NUMERIC(4, 2) DEFAULT 1.5,
    cooldown_seconds INT DEFAULT 60,
    severity VARCHAR(16) DEFAULT 'warning', -- 'warning', 'critical'
    notification_channel VARCHAR(32) DEFAULT 'all', -- 'browser', 'buzzer', 'sms', 'all'
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. ALERT EVENTS LOG TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    sensor_name VARCHAR(32) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    trigger_value NUMERIC(6, 2),
    threshold_value NUMERIC(6, 2),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
    triggered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolved_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_alert_events_device_status 
    ON alert_events (device_id, status, triggered_at DESC);

-- ------------------------------------------------------------------------------
-- 5. DEVICE CONFIGURATION & PCM CALIBRATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_configs (
    device_id VARCHAR(64) PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    pcm_material_type VARCHAR(64) DEFAULT 'Paraffin RT-50',
    pcm_mass_kg NUMERIC(6, 3) DEFAULT 2.500,
    pcm_latent_heat_kj_kg NUMERIC(6, 2) DEFAULT 190.0,
    pcm_phase_change_temp_c NUMERIC(5, 2) DEFAULT 50.0,
    pcm_charge_threshold_c NUMERIC(5, 2) DEFAULT 45.0,
    pcm_discharge_threshold_c NUMERIC(5, 2) DEFAULT 38.0,
    tray1_warning_high_c NUMERIC(5, 2) DEFAULT 55.0,
    tray1_critical_high_c NUMERIC(5, 2) DEFAULT 65.0,
    tray2_warning_high_c NUMERIC(5, 2) DEFAULT 55.0,
    tray2_critical_high_c NUMERIC(5, 2) DEFAULT 65.0,
    pcm_warning_high_c NUMERIC(5, 2) DEFAULT 60.0,
    pcm_critical_high_c NUMERIC(5, 2) DEFAULT 70.0,
    reporting_interval_sec INT DEFAULT 10,
    is_calibrated BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. DEFAULT SEED DATA
-- ------------------------------------------------------------------------------
INSERT INTO devices (id, name, description, location)
VALUES (
    'solar-dryer-01', 
    'Pilot Solar Dryer Unit #1', 
    'College Engineering Department Solar Dryer with 2 Product Trays and Paraffin PCM Storage',
    'Solar Testing Facility, Rooftop Lab'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO device_configs (device_id, pcm_material_type, pcm_mass_kg, pcm_latent_heat_kj_kg, pcm_phase_change_temp_c)
VALUES ('solar-dryer-01', 'Paraffin RT-50', 2.5, 190.0, 50.0)
ON CONFLICT (device_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_configs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access for public dashboard monitoring (configurable)
CREATE POLICY "Public read-only for sensor readings"
    ON sensor_readings FOR SELECT USING (true);

CREATE POLICY "Public read-only for devices"
    ON devices FOR SELECT USING (true);

CREATE POLICY "Public read-only for device configs"
    ON device_configs FOR SELECT USING (true);

CREATE POLICY "Public read-only for alert events"
    ON alert_events FOR SELECT USING (true);

-- Ingestion service role or authenticated insert
CREATE POLICY "Service role can insert readings"
    ON sensor_readings FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. AUTOMATIC CLEANUP / RETENTION POLICY (OPTIONAL FUNCTION)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION purge_old_sensor_readings(days_retention INT) 
RETURNS INT AS $$
DECLARE
    deleted_rows INT;
BEGIN
    DELETE FROM sensor_readings
    WHERE timestamp < NOW() - (days_retention || ' days')::INTERVAL
      AND is_demo = false;
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    RETURN deleted_rows;
END;
$$ LANGUAGE plpgsql;
