-- ServerSentinel Database Schema with  PostgreSQL .

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Users table with RBAC
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'operator', 'viewer')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Refresh tokens for JWT rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Monitored clients (servers/agents)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    hostname VARCHAR(255),
    ip_address INET,
    os_type VARCHAR(50),
    os_version VARCHAR(100),
    agent_version VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    threshold_cpu REAL DEFAULT 85.0,
    threshold_memory REAL DEFAULT 85.0,
    threshold_disk REAL DEFAULT 90.0,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_is_active ON clients(is_active);
CREATE INDEX idx_clients_last_seen ON clients(last_seen);

-- Metrics table with monthly partitioning
CREATE TABLE IF NOT EXISTS metrics (
    id UUID DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    metric_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    cpu_percent REAL,
    memory_percent REAL,
    memory_used_mb BIGINT,
    memory_total_mb BIGINT,
    disk_percent REAL,
    disk_used_gb BIGINT,
    disk_total_gb BIGINT,
    disk_details JSONB DEFAULT '[]',
    network_rx_bytes BIGINT,
    network_tx_bytes BIGINT,
    load_average REAL[],
    process_count INTEGER,
    top_processes JSONB DEFAULT '[]',
    additional JSONB DEFAULT '{}',
    PRIMARY KEY (id, metric_time)
) PARTITION BY RANGE (metric_time);

-- Create partitions for current and next 3 months
CREATE TABLE metrics_2025_10 PARTITION OF metrics
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE metrics_2025_11 PARTITION OF metrics
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE metrics_2025_12 PARTITION OF metrics
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE metrics_2026_01 PARTITION OF metrics
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Indexes on partitioned table
CREATE INDEX idx_metrics_client_time ON metrics(client_id, metric_time DESC);
CREATE INDEX idx_metrics_time ON metrics(metric_time DESC);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    metric VARCHAR(50) NOT NULL,
    value REAL NOT NULL,
    threshold REAL NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'CLOSED')),
    title VARCHAR(255),
    message TEXT,
    metadata JSONB DEFAULT '{}',
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_client_id ON alerts(client_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_client_status_created ON alerts(client_id, status, created_at DESC);

-- Notification deliveries tracking
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('websocket', 'fcm', 'email')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_deliveries_alert_id ON notification_deliveries(alert_id);
CREATE INDEX idx_notification_deliveries_user_id ON notification_deliveries(user_id);
CREATE INDEX idx_notification_deliveries_status ON notification_deliveries(status);

-- Push subscriptions for FCM/Web Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_is_active ON push_subscriptions(is_active);

-- Audit events log
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    action VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_entity ON events(entity_type, entity_id);

-- User favorites for quick access
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, client_id)
);

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id, sort_order);

-- Alert rules configuration
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    metric VARCHAR(50) NOT NULL,
    operator VARCHAR(20) NOT NULL CHECK (operator IN ('>', '>=', '<', '<=', '=')),
    threshold REAL NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    is_enabled BOOLEAN DEFAULT true,
    cooldown_minutes INTEGER DEFAULT 10,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_client_id ON alert_rules(client_id);
CREATE INDEX idx_alert_rules_is_enabled ON alert_rules(is_enabled);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Materialized view for dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT
    COUNT(DISTINCT c.id) as total_clients,
    COUNT(DISTINCT c.id) FILTER (WHERE c.is_active AND c.last_seen > NOW() - INTERVAL '5 minutes') as active_clients,
    COUNT(a.id) FILTER (WHERE a.status = 'OPEN') as open_alerts,
    COUNT(a.id) FILTER (WHERE a.status = 'OPEN' AND a.severity = 'CRITICAL') as critical_alerts,
    AVG(m.cpu_percent) FILTER (WHERE m.metric_time > NOW() - INTERVAL '1 hour') as avg_cpu,
    AVG(m.memory_percent) FILTER (WHERE m.metric_time > NOW() - INTERVAL '1 hour') as avg_memory,
    AVG(m.disk_percent) FILTER (WHERE m.metric_time > NOW() - INTERVAL '1 hour') as avg_disk
FROM clients c
LEFT JOIN alerts a ON c.id = a.client_id
LEFT JOIN metrics m ON c.id = m.client_id;

CREATE UNIQUE INDEX idx_dashboard_stats ON dashboard_stats ((1));

-- Function to refresh dashboard stats (call periodically)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Retention policy function to drop old partitions
CREATE OR REPLACE FUNCTION drop_old_metric_partitions(retention_months INTEGER DEFAULT 6)
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    cutoff_date DATE;
BEGIN
    cutoff_date := DATE_TRUNC('month', NOW() - (retention_months || ' months')::INTERVAL);
    
    FOR partition_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE 'metrics_%'
        AND tablename < 'metrics_' || TO_CHAR(cutoff_date, 'YYYY_MM')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || partition_name || ' CASCADE';
        RAISE NOTICE 'Dropped partition: %', partition_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'Application users with role-based access control';
COMMENT ON TABLE clients IS 'Monitored servers/agents sending metrics';
COMMENT ON TABLE metrics IS 'Time-series metrics data, partitioned by month';
COMMENT ON TABLE alerts IS 'Generated alerts when thresholds are breached';
COMMENT ON TABLE notification_deliveries IS 'Tracking of notification delivery status';
COMMENT ON TABLE push_subscriptions IS 'Web push and FCM subscription endpoints';
COMMENT ON TABLE events IS 'Audit log of all system events';
COMMENT ON TABLE alert_rules IS 'Configurable alert rules per client or global';
