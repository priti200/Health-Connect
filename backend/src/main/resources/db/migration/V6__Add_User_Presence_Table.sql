-- Create user_presence table for real-time presence tracking
CREATE TABLE user_presence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    status_message VARCHAR(255),
    last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP,
    device_info TEXT,
    ip_address VARCHAR(45),
    is_typing BOOLEAN NOT NULL DEFAULT FALSE,
    typing_in_chat_id BIGINT,
    typing_started_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_presence_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_presence_chat FOREIGN KEY (typing_in_chat_id) REFERENCES chats(id) ON DELETE SET NULL,
    CONSTRAINT uk_user_presence_user UNIQUE (user_id),
    
    INDEX idx_user_presence_status (status),
    INDEX idx_user_presence_last_activity (last_activity),
    INDEX idx_user_presence_typing (is_typing, typing_in_chat_id)
);

-- Add comments for documentation
ALTER TABLE user_presence 
COMMENT = 'Tracks real-time user presence and activity status';

ALTER TABLE user_presence 
MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE' 
COMMENT 'User presence status: ONLINE, AWAY, BUSY, OFFLINE, INVISIBLE';

ALTER TABLE user_presence 
MODIFY COLUMN is_typing BOOLEAN NOT NULL DEFAULT FALSE 
COMMENT 'Whether user is currently typing in a chat';
