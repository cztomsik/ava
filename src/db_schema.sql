-- 
-- IMPORTANT:
-- Table names need to be quoted in order to work with our migration tool.
--
CREATE Table "Model" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  imported INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE TABLE "Prompt" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL
) STRICT;

CREATE TABLE "Chat" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  prompt TEXT,
  sampling TEXT NOT NULL DEFAULT '{}'
) STRICT;

CREATE VIEW "ChatWithLastMessage" AS
SELECT
  Chat.*,
  (SELECT content FROM ChatMessage WHERE chat_id = Chat.id ORDER BY id DESC LIMIT 1) as last_message
FROM Chat;

CREATE TABLE "ChatMessage" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES Chat(id) ON DELETE CASCADE
) STRICT;