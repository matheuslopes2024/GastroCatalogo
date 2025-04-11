-- Adicionar novas colunas à tabela de conversas de chat
ALTER TABLE chat_conversations 
  ADD COLUMN IF NOT EXISTS participant_id INTEGER,
  ADD COLUMN IF NOT EXISTS participant_name TEXT,
  ADD COLUMN IF NOT EXISTS participant_role TEXT,
  ADD COLUMN IF NOT EXISTS last_message_text TEXT,
  ADD COLUMN IF NOT EXISTS last_message_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0;

-- Adicionar novas colunas à tabela de mensagens de chat
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS text TEXT,
  ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS attachments JSONB;