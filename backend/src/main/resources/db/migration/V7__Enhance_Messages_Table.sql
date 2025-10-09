-- Enhance messages table with new real-time features
ALTER TABLE messages 
ADD COLUMN delivered_at TIMESTAMP NULL AFTER read_at,
ADD COLUMN edited_at TIMESTAMP NULL AFTER delivered_at,
ADD COLUMN file_name VARCHAR(255) NULL AFTER edited_at,
ADD COLUMN file_url TEXT NULL AFTER file_name,
ADD COLUMN file_type VARCHAR(100) NULL AFTER file_url,
ADD COLUMN file_size BIGINT NULL AFTER file_type,
ADD COLUMN reply_to_message_id BIGINT NULL AFTER file_size;

-- Add foreign key for reply functionality
ALTER TABLE messages 
ADD CONSTRAINT fk_message_reply_to 
FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Create message_reactions table for emoji reactions
CREATE TABLE message_reactions (
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reaction VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (message_id, user_id),
    CONSTRAINT fk_message_reactions_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_reactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_message_reactions_message (message_id),
    INDEX idx_message_reactions_user (user_id)
);

-- Create message_mentions table for user mentions
CREATE TABLE message_mentions (
    message_id BIGINT NOT NULL,
    mentioned_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (message_id, mentioned_user_id),
    CONSTRAINT fk_message_mentions_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_mentions_user FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_message_mentions_message (message_id),
    INDEX idx_message_mentions_user (mentioned_user_id)
);

-- Update message status enum to include new statuses
ALTER TABLE messages 
MODIFY COLUMN status ENUM('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'EDITED', 'DELETED') 
NOT NULL DEFAULT 'SENT';

-- Update message type enum to include new types
ALTER TABLE messages 
MODIFY COLUMN type ENUM('TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'FILE', 'SYSTEM', 'APPOINTMENT', 'PRESCRIPTION', 'URGENT', 'EMOJI', 'LOCATION', 'CONTACT', 'VOICE_CALL', 'VIDEO_CALL') 
NOT NULL DEFAULT 'TEXT';

-- Add indexes for better performance
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_message_id);
CREATE INDEX idx_messages_file_type ON messages(file_type);

-- Add comments for documentation
ALTER TABLE messages 
MODIFY COLUMN delivered_at TIMESTAMP NULL 
COMMENT 'When message was delivered to recipient';

ALTER TABLE messages 
MODIFY COLUMN edited_at TIMESTAMP NULL 
COMMENT 'When message was last edited';

ALTER TABLE messages 
MODIFY COLUMN file_name VARCHAR(255) NULL 
COMMENT 'Original filename for attachments';

ALTER TABLE messages 
MODIFY COLUMN file_url TEXT NULL 
COMMENT 'URL/path to uploaded file';

ALTER TABLE messages 
MODIFY COLUMN file_size BIGINT NULL 
COMMENT 'File size in bytes';

ALTER TABLE message_reactions 
COMMENT = 'Stores emoji reactions to messages';

ALTER TABLE message_mentions 
COMMENT = 'Stores user mentions in messages';
