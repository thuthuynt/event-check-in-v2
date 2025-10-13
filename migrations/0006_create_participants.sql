-- Migration number: 0006    2024-12-23T18:02:00.000Z
DROP TABLE IF EXISTS participants;

CREATE TABLE participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    participant_id VARCHAR(255),
    start_time VARCHAR(50),
    bib_no VARCHAR(50) NOT NULL,
    id_card_passport VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    tshirt_size VARCHAR(10),
    birthday_year INTEGER,
    nationality VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    blood_type VARCHAR(10),
    medical_information TEXT,
    medicines_using TEXT,
    parent_full_name VARCHAR(255),
    parent_date_of_birth DATE,
    parent_email VARCHAR(255),
    parent_id_card_passport VARCHAR(255),
    parent_relationship VARCHAR(100),
    full_name VARCHAR(255),
    name_on_bib VARCHAR(255),
    signature_url TEXT,
    uploaded_image_url TEXT,
    checkin_at TIMESTAMP,
    checkin_by VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX idx_participants_event_id ON participants(event_id);
CREATE INDEX idx_participants_bib_no ON participants(bib_no);
CREATE INDEX idx_participants_name ON participants(last_name, first_name);
CREATE INDEX idx_participants_phone ON participants(phone);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_checkin_at ON participants(checkin_at);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_participants_updated_at 
    AFTER UPDATE ON participants
    BEGIN
        UPDATE participants 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END;
