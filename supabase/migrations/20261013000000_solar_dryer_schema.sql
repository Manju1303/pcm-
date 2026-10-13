-- ==============================================================================
-- Supabase Migration: Solar Dryer with PCM Thermal Storage (Honest College Edition)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEVICES TABLE
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    location VARCHAR(128),
    firmware_version VARCHAR(32) DEFAULT 'v1.0.0',
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    buzzer1_ok BOOLEAN,
    buzzer2_ok BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. DEVICE CONFIGURATIONS & SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS device_configs (
    device_id VARCHAR(64) PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    -- Temperature Thresholds (°C)
    tray1_warn_c NUMERIC(5, 2) DEFAULT 58.0,
    tray1_crit_c NUMERIC(5, 2) DEFAULT 68.0,
    tray2_warn_c NUMERIC(5, 2) DEFAULT 58.0,
    tray2_crit_c NUMERIC(5, 2) DEFAULT 68.0,
    pcm_warn_c NUMERIC(5, 2) DEFAULT 60.0,
    pcm_crit_c NUMERIC(5, 2) DEFAULT 72.0,
    pcm_charge_trigger_c NUMERIC(5, 2) DEFAULT 45.0,
    pcm_plateau_c NUMERIC(5, 2) DEFAULT 50.0,
    pcm_discharge_delta_c NUMERIC(5, 2) DEFAULT 2.0,
    send_interval_sec INT DEFAULT 60,
    
    -- Battery Calibration
    battery_divider_ratio NUMERIC(6, 3) DEFAULT 5.545,
    battery_offset_v NUMERIC(4, 2) DEFAULT 0.0,
    
    -- Feature Flags (Hidden unless enabled)
    gsm_enabled BOOLEAN DEFAULT false,
    moisture_enabled BOOLEAN DEFAULT false,
    battery_monitor_enabled BOOLEAN DEFAULT false,
    
    -- 1-Wire 64-bit ROM Sensor Assignments
    tray1_rom VARCHAR(32) DEFAULT '',
    tray2_rom VARCHAR(32) DEFAULT '',
    pcm_rom VARCHAR(32) DEFAULT '',
    
    -- PCM Latent Model Parameters
    pcm_material_name VARCHAR(64) DEFAULT 'Paraffin RT-50',
    pcm_mass_kg NUMERIC(6, 3) DEFAULT 2.500,
    pcm_latent_heat_kj_kg NUMERIC(6, 2) DEFAULT 190.0,
    pcm_melting_min_c NUMERIC(5, 2) DEFAULT 45.0,
    pcm_melting_max_c NUMERIC(5, 2) DEFAULT 51.0,
    chamber_heat_loss_rate_w NUMERIC(6, 2) DEFAULT 0.0,
    airflow_rate_m3h NUMERIC(6, 2) DEFAULT 0.0,
    is_calibrated BOOLEAN DEFAULT false,
    
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. SENSOR READINGS TABLE (TIME-SERIES TELEMETRY)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    tray1_temp NUMERIC(5, 2),
    tray2_temp NUMERIC(5, 2),
    pcm_temp NUMERIC(5, 2),
    tray1_status VARCHAR(20) DEFAULT 'ok',
    tray2_status VARCHAR(20) DEFAULT 'ok',
    pcm_status VARCHAR(20) DEFAULT 'ok',
    tray1_rom VARCHAR(32),
    tray2_rom VARCHAR(32),
    pcm_rom VARCHAR(32),
    buzzer1_ok BOOLEAN,
    buzzer2_ok BOOLEAN,
    battery_voltage NUMERIC(4, 2),
    moisture_percent NUMERIC(4, 1),
    operating_status VARCHAR(64) DEFAULT 'Unknown/Not Configured',
    is_demo BOOLEAN DEFAULT false,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_time 
    ON sensor_readings (device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
    ON sensor_readings (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_is_demo 
    ON sensor_readings (is_demo);

-- 4. SENSOR FAULTS LOG
CREATE TABLE IF NOT EXISTS sensor_faults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    sensor VARCHAR(16) NOT NULL, -- 'tray1', 'tray2', 'pcm'
    fault_type VARCHAR(32) NOT NULL, -- 'disconnected', 'power_on_reset', 'out_of_range', 'flat_lined', 'missing_rom'
    raw_value NUMERIC(6, 2),
    rom_address VARCHAR(32),
    message TEXT NOT NULL,
    detected_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sensor_faults_device_time 
    ON sensor_faults (device_id, detected_at DESC);

-- 5. ALERT RULES TABLE
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) REFERENCES devices(id) ON DELETE CASCADE,
    sensor_name VARCHAR(32) NOT NULL,
    condition VARCHAR(16) NOT NULL,
    threshold_value NUMERIC(6, 2) NOT NULL,
    hysteresis NUMERIC(4, 2) DEFAULT 1.5,
    cooldown_seconds INT DEFAULT 60,
    severity VARCHAR(16) DEFAULT 'warning',
    message TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. ALERT EVENTS LOG
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
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_alert_events_device_status 
    ON alert_events (device_id, status, triggered_at DESC);

-- 7. PROJECT PHASES STATUS (Honesty Checklist for College Report)
CREATE TABLE IF NOT EXISTS project_status (
    id INT PRIMARY KEY,
    phase_number INT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Not started' CHECK (status IN ('Not started', 'In progress', 'Done')),
    note TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. NIGHT TEST RESULTS (Computed from real stored frames only)
CREATE TABLE IF NOT EXISTS night_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) REFERENCES devices(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes NUMERIC(7, 2) NOT NULL,
    pcm_avg_above_tray_delta_c NUMERIC(5, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- SEED DEFAULT DATA
-- ------------------------------------------------------------------------------
INSERT INTO devices (id, name, description, location)
VALUES (
    'solar-dryer-01', 
    'Pilot Solar Dryer Unit #1', 
    'ESP32 Solar Dryer with 2 Product Trays and PCM Thermal Storage',
    'Solar Testing Rig'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO device_configs (device_id)
VALUES ('solar-dryer-01')
ON CONFLICT (device_id) DO NOTHING;

INSERT INTO project_status (id, phase_number, title, status, note)
VALUES 
    (1, 1, 'Hardware identification & wiring', 'In progress', 'Pin map proposed; probe model confirmation pending.'),
    (2, 2, 'ESP32 firmware', 'In progress', 'Autonomous local buzzers and 1-Wire discovery implemented; hardware bench-test pending.'),
    (3, 3, 'Dashboard & PWA', 'Done', 'Full monitoring PWA with offline app shell, sensor diagnostics, and security controls.'),
    (4, 4, 'Database & device integration', 'In progress', 'Supabase schema and REST ingestion ready; awaiting physical telemetry stream.'),
    (5, 5, 'Solar & battery power system', 'Not started', 'Battery, charge controller, and DC-DC buck converter not yet purchased.'),
    (6, 6, 'Drying & PCM experiments', 'Not started', 'Night heat discharge target of 5 hours awaiting field validation.')
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    note = EXCLUDED.note,
    updated_at = NOW();

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Public visitors get read-only access to views/tables.
-- All writes require service-role credentials.
-- ------------------------------------------------------------------------------
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_faults ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE night_tests ENABLE ROW LEVEL SECURITY;

-- Read policies for public visitors
CREATE POLICY "Public read-only devices" ON devices FOR SELECT USING (true);
CREATE POLICY "Public read-only configs" ON device_configs FOR SELECT USING (true);
CREATE POLICY "Public read-only readings" ON sensor_readings FOR SELECT USING (true);
CREATE POLICY "Public read-only faults" ON sensor_faults FOR SELECT USING (true);
CREATE POLICY "Public read-only alert_rules" ON alert_rules FOR SELECT USING (true);
CREATE POLICY "Public read-only alert_events" ON alert_events FOR SELECT USING (true);
CREATE POLICY "Public read-only project_status" ON project_status FOR SELECT USING (true);
CREATE POLICY "Public read-only night_tests" ON night_tests FOR SELECT USING (true);

-- Insert/Update/Delete only permitted via service role (bypasses RLS)
