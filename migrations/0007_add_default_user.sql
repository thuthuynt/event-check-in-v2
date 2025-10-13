-- Add default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT OR IGNORE INTO users (user_name, password_hash) VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
