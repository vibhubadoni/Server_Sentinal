-- ServerSentinel Seed Data
-- Sample users, clients, metrics, and alerts for testing

-- Insert sample users (passwords are 'password123' hashed with bcrypt, 12 rounds)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@serversentinel.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'superadmin', 'Admin', 'User', true),
('22222222-2222-2222-2222-222222222222', 'operator@serversentinel.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'operator', 'Operator', 'User', true),
('33333333-3333-3333-3333-333333333333', 'viewer@serversentinel.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'viewer', 'Viewer', 'User', true),
('44444444-4444-4444-4444-444444444444', 'john.doe@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'admin', 'John', 'Doe', true),
('55555555-5555-5555-5555-555555555555', 'jane.smith@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'operator', 'Jane', 'Smith', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample monitored clients
INSERT INTO clients (id, name, token_hash, hostname, ip_address, os_type, os_version, agent_version, threshold_cpu, threshold_memory, threshold_disk, is_active, last_seen) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Production Web Server 1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'web-prod-01', '10.0.1.10', 'Linux', 'Ubuntu 22.04', '1.0.0', 80.0, 85.0, 90.0, true, NOW() - INTERVAL '30 seconds'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Production Web Server 2', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'web-prod-02', '10.0.1.11', 'Linux', 'Ubuntu 22.04', '1.0.0', 80.0, 85.0, 90.0, true, NOW() - INTERVAL '1 minute'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Database Server Primary', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'db-primary', '10.0.2.10', 'Linux', 'Ubuntu 22.04', '1.0.0', 75.0, 80.0, 85.0, true, NOW() - INTERVAL '45 seconds'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Database Server Replica', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'db-replica', '10.0.2.11', 'Linux', 'Ubuntu 22.04', '1.0.0', 75.0, 80.0, 85.0, true, NOW() - INTERVAL '2 minutes'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Application Server 1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'app-01', '10.0.3.10', 'Linux', 'CentOS 8', '1.0.0', 85.0, 85.0, 90.0, true, NOW() - INTERVAL '15 seconds'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Cache Server Redis', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'cache-redis', '10.0.4.10', 'Linux', 'Debian 11', '1.0.0', 70.0, 90.0, 80.0, true, NOW() - INTERVAL '20 seconds'),
('10101010-1010-1010-1010-101010101010', 'Windows File Server', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'fileserver-win', '10.0.5.10', 'Windows', 'Windows Server 2022', '1.0.0', 85.0, 85.0, 95.0, true, NOW() - INTERVAL '1 minute'),
('20202020-2020-2020-2020-202020202020', 'Staging Environment', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'staging-01', '10.0.6.10', 'Linux', 'Ubuntu 20.04', '1.0.0', 90.0, 90.0, 95.0, true, NOW() - INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

-- Insert sample metrics for the last hour (one per client, varying values)
DO $$
DECLARE
    client_ids UUID[] := ARRAY[
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
        'cccccccc-cccc-cccc-cccc-cccccccccccc'::UUID,
        'dddddddd-dddd-dddd-dddd-dddddddddddd'::UUID,
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::UUID,
        'ffffffff-ffff-ffff-ffff-ffffffffffff'::UUID,
        '10101010-1010-1010-1010-101010101010'::UUID,
        '20202020-2020-2020-2020-202020202020'::UUID
    ];
    client_id UUID;
    i INTEGER;
    base_cpu REAL;
    base_mem REAL;
    base_disk REAL;
BEGIN
    FOREACH client_id IN ARRAY client_ids
    LOOP
        -- Set base values for each client
        base_cpu := 40 + (random() * 30);
        base_mem := 50 + (random() * 25);
        base_disk := 60 + (random() * 20);
        
        -- Insert metrics for last hour (every 5 seconds = 720 records per client)
        FOR i IN 0..719 LOOP
            INSERT INTO metrics (
                client_id,
                metric_time,
                cpu_percent,
                memory_percent,
                memory_used_mb,
                memory_total_mb,
                disk_percent,
                disk_used_gb,
                disk_total_gb,
                network_rx_bytes,
                network_tx_bytes,
                load_average,
                process_count,
                top_processes
            ) VALUES (
                client_id,
                NOW() - (i * INTERVAL '5 seconds'),
                base_cpu + (random() * 20 - 10),
                base_mem + (random() * 15 - 7.5),
                (base_mem + (random() * 15 - 7.5)) * 160,
                16000,
                base_disk + (random() * 5 - 2.5),
                (base_disk + (random() * 5 - 2.5)) * 5,
                500,
                1000000 + (random() * 500000)::BIGINT,
                500000 + (random() * 250000)::BIGINT,
                ARRAY[random() * 2, random() * 2, random() * 2],
                150 + (random() * 50)::INTEGER,
                jsonb_build_array(
                    jsonb_build_object('pid', 1234, 'name', 'java', 'cpu', random() * 30, 'mem', random() * 20),
                    jsonb_build_object('pid', 5678, 'name', 'postgres', 'cpu', random() * 25, 'mem', random() * 15),
                    jsonb_build_object('pid', 9012, 'name', 'nginx', 'cpu', random() * 10, 'mem', random() * 5)
                )
            );
        END LOOP;
    END LOOP;
END $$;

-- Insert some high-value metrics to trigger alerts
INSERT INTO metrics (client_id, metric_time, cpu_percent, memory_percent, disk_percent, memory_used_mb, memory_total_mb, disk_used_gb, disk_total_gb) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '5 minutes', 92.5, 78.3, 85.2, 12544, 16000, 426, 500),
('cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '10 minutes', 88.7, 91.2, 78.5, 14592, 16000, 392.5, 500),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW() - INTERVAL '3 minutes', 78.2, 88.9, 93.1, 14224, 16000, 465.5, 500);

-- Insert sample alerts (some will be auto-created by triggers, these are manual examples)
INSERT INTO alerts (id, client_id, metric, value, threshold, severity, status, title, message, created_at) VALUES
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cpu', 92.5, 80.0, 'CRITICAL', 'OPEN', 'High CPU Usage on Production Web Server 1', 'CPU usage is at 92.5%, exceeding threshold of 80.0%', NOW() - INTERVAL '5 minutes'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'memory', 91.2, 80.0, 'CRITICAL', 'ACKNOWLEDGED', 'High Memory Usage on Database Server Primary', 'Memory usage is at 91.2%, exceeding threshold of 80.0%', NOW() - INTERVAL '10 minutes'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'disk', 93.1, 90.0, 'HIGH', 'OPEN', 'High Disk Usage on Application Server 1', 'Disk usage is at 93.1%, exceeding threshold of 90.0%', NOW() - INTERVAL '3 minutes'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cpu', 86.3, 80.0, 'MEDIUM', 'CLOSED', 'High CPU Usage on Production Web Server 2', 'CPU usage is at 86.3%, exceeding threshold of 80.0%', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- Update acknowledged alert
UPDATE alerts 
SET acknowledged_by = '22222222-2222-2222-2222-222222222222', 
    acknowledged_at = NOW() - INTERVAL '8 minutes'
WHERE id = 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';

-- Update closed alert
UPDATE alerts 
SET resolved_at = NOW() - INTERVAL '1 hour 45 minutes'
WHERE id = 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4';

-- Insert user favorites
INSERT INTO user_favorites (user_id, client_id, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1),
('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2),
('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3),
('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1),
('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2)
ON CONFLICT (user_id, client_id) DO NOTHING;

-- Insert sample alert rules
INSERT INTO alert_rules (client_id, name, metric, operator, threshold, severity, is_enabled, cooldown_minutes) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Critical CPU Alert', 'cpu', '>', 95.0, 'CRITICAL', true, 5),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Database Memory Warning', 'memory', '>', 85.0, 'HIGH', true, 10),
(NULL, 'Global Disk Critical', 'disk', '>', 95.0, 'CRITICAL', true, 15);

-- Insert sample audit events
INSERT INTO events (user_id, event_type, entity_type, entity_id, action, metadata) VALUES
('11111111-1111-1111-1111-111111111111', 'user_login', 'user', '11111111-1111-1111-1111-111111111111', 'login', '{"ip": "192.168.1.100", "user_agent": "Mozilla/5.0"}'),
('22222222-2222-2222-2222-222222222222', 'alert_acknowledged', 'alert', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'acknowledge', '{"alert_id": "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2", "severity": "CRITICAL"}'),
('11111111-1111-1111-1111-111111111111', 'client_created', 'client', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'create', '{"client_name": "Production Web Server 1"}');

-- Refresh materialized view
REFRESH MATERIALIZED VIEW dashboard_stats;

-- Display summary
DO $$
DECLARE
    user_count INTEGER;
    client_count INTEGER;
    metric_count INTEGER;
    alert_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO client_count FROM clients;
    SELECT COUNT(*) INTO metric_count FROM metrics;
    SELECT COUNT(*) INTO alert_count FROM alerts;
    
    RAISE NOTICE '=== ServerSentinel Database Seeded Successfully ===';
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'Clients: %', client_count;
    RAISE NOTICE 'Metrics: %', metric_count;
    RAISE NOTICE 'Alerts: %', alert_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Test Credentials:';
    RAISE NOTICE '  Admin: admin@serversentinel.io / password123';
    RAISE NOTICE '  Operator: operator@serversentinel.io / password123';
    RAISE NOTICE '  Viewer: viewer@serversentinel.io / password123';
END $$;
