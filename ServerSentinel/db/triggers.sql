-- Alert Triggers


-- Main trigger function to check thresholds and create alerts
CREATE OR REPLACE FUNCTION public.check_thresholds()
RETURNS TRIGGER AS $$
DECLARE
    client_rec RECORD;
    recent_alert_count INTEGER;
    alert_id UUID;
    alert_title TEXT;
    alert_message TEXT;
    alert_severity TEXT;
BEGIN
    -- Fetch client configuration including custom thresholds
    SELECT 
        id, 
        name,
        COALESCE(threshold_cpu, 85.0) as threshold_cpu,
        COALESCE(threshold_memory, 85.0) as threshold_memory,
        COALESCE(threshold_disk, 90.0) as threshold_disk,
        is_active
    INTO client_rec
    FROM clients
    WHERE id = NEW.client_id;

    -- Only process if client is active
    IF NOT client_rec.is_active THEN
        RETURN NEW;
    END IF;

    -- Check CPU threshold
    IF NEW.cpu_percent IS NOT NULL AND NEW.cpu_percent > client_rec.threshold_cpu THEN
        -- Check for recent similar alerts (deduplication within 10 minutes)
        SELECT COUNT(*) INTO recent_alert_count
        FROM alerts
        WHERE client_id = NEW.client_id
        AND metric = 'cpu'
        AND status IN ('OPEN', 'ACKNOWLEDGED')
        AND created_at > (NOW() - INTERVAL '10 minutes');

        IF recent_alert_count = 0 THEN
            -- Determine severity based on how much threshold is exceeded
            IF NEW.cpu_percent > client_rec.threshold_cpu + 10 THEN
                alert_severity := 'CRITICAL';
            ELSIF NEW.cpu_percent > client_rec.threshold_cpu + 5 THEN
                alert_severity := 'HIGH';
            ELSE
                alert_severity := 'MEDIUM';
            END IF;

            alert_title := 'High CPU Usage on ' || client_rec.name;
            alert_message := 'CPU usage is at ' || ROUND(NEW.cpu_percent::numeric, 2) || '%, exceeding threshold of ' || client_rec.threshold_cpu || '%';

            INSERT INTO alerts(
                client_id, 
                metric, 
                value, 
                threshold, 
                severity, 
                status, 
                title, 
                message,
                metadata
            )
            VALUES (
                NEW.client_id,
                'cpu',
                NEW.cpu_percent,
                client_rec.threshold_cpu,
                alert_severity,
                'OPEN',
                alert_title,
                alert_message,
                jsonb_build_object(
                    'metric_time', NEW.metric_time,
                    'load_average', NEW.load_average,
                    'process_count', NEW.process_count
                )
            )
            RETURNING id INTO alert_id;

            -- Notify via pg_notify for real-time processing
            PERFORM pg_notify(
                'alert_created',
                json_build_object(
                    'alert_id', alert_id,
                    'client_id', NEW.client_id,
                    'metric', 'cpu',
                    'severity', alert_severity,
                    'value', NEW.cpu_percent
                )::text
            );
        END IF;
    END IF;

    -- Check Memory threshold
    IF NEW.memory_percent IS NOT NULL AND NEW.memory_percent > client_rec.threshold_memory THEN
        SELECT COUNT(*) INTO recent_alert_count
        FROM alerts
        WHERE client_id = NEW.client_id
        AND metric = 'memory'
        AND status IN ('OPEN', 'ACKNOWLEDGED')
        AND created_at > (NOW() - INTERVAL '10 minutes');

        IF recent_alert_count = 0 THEN
            IF NEW.memory_percent > client_rec.threshold_memory + 10 THEN
                alert_severity := 'CRITICAL';
            ELSIF NEW.memory_percent > client_rec.threshold_memory + 5 THEN
                alert_severity := 'HIGH';
            ELSE
                alert_severity := 'MEDIUM';
            END IF;

            alert_title := 'High Memory Usage on ' || client_rec.name;
            alert_message := 'Memory usage is at ' || ROUND(NEW.memory_percent::numeric, 2) || '%, exceeding threshold of ' || client_rec.threshold_memory || '%';

            INSERT INTO alerts(
                client_id, 
                metric, 
                value, 
                threshold, 
                severity, 
                status, 
                title, 
                message,
                metadata
            )
            VALUES (
                NEW.client_id,
                'memory',
                NEW.memory_percent,
                client_rec.threshold_memory,
                alert_severity,
                'OPEN',
                alert_title,
                alert_message,
                jsonb_build_object(
                    'metric_time', NEW.metric_time,
                    'memory_used_mb', NEW.memory_used_mb,
                    'memory_total_mb', NEW.memory_total_mb
                )
            )
            RETURNING id INTO alert_id;

            PERFORM pg_notify(
                'alert_created',
                json_build_object(
                    'alert_id', alert_id,
                    'client_id', NEW.client_id,
                    'metric', 'memory',
                    'severity', alert_severity,
                    'value', NEW.memory_percent
                )::text
            );
        END IF;
    END IF;

    -- Check Disk threshold
    IF NEW.disk_percent IS NOT NULL AND NEW.disk_percent > client_rec.threshold_disk THEN
        SELECT COUNT(*) INTO recent_alert_count
        FROM alerts
        WHERE client_id = NEW.client_id
        AND metric = 'disk'
        AND status IN ('OPEN', 'ACKNOWLEDGED')
        AND created_at > (NOW() - INTERVAL '10 minutes');

        IF recent_alert_count = 0 THEN
            IF NEW.disk_percent > client_rec.threshold_disk + 5 THEN
                alert_severity := 'CRITICAL';
            ELSIF NEW.disk_percent > client_rec.threshold_disk + 2 THEN
                alert_severity := 'HIGH';
            ELSE
                alert_severity := 'MEDIUM';
            END IF;

            alert_title := 'High Disk Usage on ' || client_rec.name;
            alert_message := 'Disk usage is at ' || ROUND(NEW.disk_percent::numeric, 2) || '%, exceeding threshold of ' || client_rec.threshold_disk || '%';

            INSERT INTO alerts(
                client_id, 
                metric, 
                value, 
                threshold, 
                severity, 
                status, 
                title, 
                message,
                metadata
            )
            VALUES (
                NEW.client_id,
                'disk',
                NEW.disk_percent,
                client_rec.threshold_disk,
                alert_severity,
                'OPEN',
                alert_title,
                alert_message,
                jsonb_build_object(
                    'metric_time', NEW.metric_time,
                    'disk_used_gb', NEW.disk_used_gb,
                    'disk_total_gb', NEW.disk_total_gb,
                    'disk_details', NEW.disk_details
                )
            )
            RETURNING id INTO alert_id;

            PERFORM pg_notify(
                'alert_created',
                json_build_object(
                    'alert_id', alert_id,
                    'client_id', NEW.client_id,
                    'metric', 'disk',
                    'severity', alert_severity,
                    'value', NEW.disk_percent
                )::text
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to metrics table
DROP TRIGGER IF EXISTS metrics_after_insert ON metrics;
CREATE TRIGGER metrics_after_insert
AFTER INSERT ON metrics
FOR EACH ROW EXECUTE FUNCTION public.check_thresholds();

-- Trigger to update client last_seen on metric insert
CREATE OR REPLACE FUNCTION update_client_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE clients
    SET last_seen = NEW.metric_time
    WHERE id = NEW.client_id
    AND (last_seen IS NULL OR last_seen < NEW.metric_time);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS metrics_update_last_seen ON metrics;
CREATE TRIGGER metrics_update_last_seen
AFTER INSERT ON metrics
FOR EACH ROW EXECUTE FUNCTION update_client_last_seen();

-- Trigger to auto-close alerts when metrics return to normal
CREATE OR REPLACE FUNCTION auto_resolve_alerts()
RETURNS TRIGGER AS $$
DECLARE
    client_rec RECORD;
BEGIN
    -- Fetch client thresholds
    SELECT 
        id,
        COALESCE(threshold_cpu, 85.0) as threshold_cpu,
        COALESCE(threshold_memory, 85.0) as threshold_memory,
        COALESCE(threshold_disk, 90.0) as threshold_disk
    INTO client_rec
    FROM clients
    WHERE id = NEW.client_id;

    -- Auto-resolve CPU alerts if back to normal
    IF NEW.cpu_percent IS NOT NULL AND NEW.cpu_percent < (client_rec.threshold_cpu - 5) THEN
        UPDATE alerts
        SET 
            status = 'CLOSED',
            resolved_at = NOW(),
            metadata = metadata || jsonb_build_object('auto_resolved', true, 'resolved_value', NEW.cpu_percent)
        WHERE client_id = NEW.client_id
        AND metric = 'cpu'
        AND status IN ('OPEN', 'ACKNOWLEDGED')
        AND created_at > (NOW() - INTERVAL '1 hour');
    END IF;

    -- Auto-resolve Memory alerts if back to normal
    IF NEW.memory_percent IS NOT NULL AND NEW.memory_percent < (client_rec.threshold_memory - 5) THEN
        UPDATE alerts
        SET 
            status = 'CLOSED',
            resolved_at = NOW(),
            metadata = metadata || jsonb_build_object('auto_resolved', true, 'resolved_value', NEW.memory_percent)
        WHERE client_id = NEW.client_id
        AND metric = 'memory'
        AND status IN ('OPEN', 'ACKNOWLEDGED')
        AND created_at > (NOW() - INTERVAL '1 hour');
    END IF;

    -- Auto-resolve Disk alerts if back to normal
    IF NEW.disk_percent IS NOT NULL AND NEW.disk_percent < (client_rec.threshold_disk - 2) THEN
        UPDATE alerts
        SET 
            status = 'CLOSED',
            resolved_at = NOW(),
            metadata = metadata || jsonb_build_object('auto_resolved', true, 'resolved_value', NEW.disk_percent)
        WHERE client_id = NEW.client_id
        AND metric = 'disk'
        AND status IN ('OPEN', 'ACKNOWLEDGED')
        AND created_at > (NOW() - INTERVAL '1 hour');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS metrics_auto_resolve ON metrics;
CREATE TRIGGER metrics_auto_resolve
AFTER INSERT ON metrics
FOR EACH ROW EXECUTE FUNCTION auto_resolve_alerts();

-- Trigger to log alert acknowledgments
CREATE OR REPLACE FUNCTION log_alert_acknowledgment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ACKNOWLEDGED' AND OLD.status = 'OPEN' THEN
        INSERT INTO events(
            user_id,
            event_type,
            entity_type,
            entity_id,
            action,
            metadata
        )
        VALUES (
            NEW.acknowledged_by,
            'alert_acknowledged',
            'alert',
            NEW.id,
            'acknowledge',
            jsonb_build_object(
                'alert_id', NEW.id,
                'client_id', NEW.client_id,
                'metric', NEW.metric,
                'severity', NEW.severity
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS alerts_log_ack ON alerts;
CREATE TRIGGER alerts_log_ack
AFTER UPDATE ON alerts
FOR EACH ROW EXECUTE FUNCTION log_alert_acknowledgment();

-- Comments
COMMENT ON FUNCTION check_thresholds() IS 'Main trigger to detect threshold breaches and create alerts with deduplication';
COMMENT ON FUNCTION update_client_last_seen() IS 'Updates client last_seen timestamp when metrics are received';
COMMENT ON FUNCTION auto_resolve_alerts() IS 'Automatically closes alerts when metrics return to normal levels';
COMMENT ON FUNCTION log_alert_acknowledgment() IS 'Logs alert acknowledgment events to audit trail';
