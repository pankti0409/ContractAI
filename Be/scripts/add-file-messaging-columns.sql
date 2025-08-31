-- Database migration to add file messaging support
-- Add message type column and file extracted text column

-- Add type column to messages table to support text and file messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'file'));

-- Add extracted_text column to files table for chat preview
ALTER TABLE files ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Update existing messages to have 'text' type
UPDATE messages SET type = 'text' WHERE type IS NULL;

-- Add index for better performance on message type queries
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);

-- Add index for files with extracted text
CREATE INDEX IF NOT EXISTS idx_files_extracted_text ON files(extracted_text) WHERE extracted_text IS NOT NULL;

COMMIT;