-- Migration number: 0005    2024-12-23T18:01:00.000Z
DROP TABLE IF EXISTS events;

CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name VARCHAR(255) NOT NULL,
    event_start_date DATE NOT NULL,
    event_end_date DATE,
    location VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_events_updated_at 
    AFTER UPDATE ON events
    BEGIN
        UPDATE events 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END;

-- Create index for faster queries
CREATE INDEX idx_events_start_date ON events(event_start_date);
CREATE INDEX idx_events_status ON events(status);
