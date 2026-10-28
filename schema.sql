-- Run once:  npx wrangler d1 execute profile-inbox --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  topic      TEXT NOT NULL,
  message    TEXT NOT NULL
);

-- Short-lived spam counters. "h" is a one-way hash that is only valid for one hour
-- and is deleted automatically. It is never linked to a message.
CREATE TABLE IF NOT EXISTS rl (
  h TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  b INTEGER NOT NULL
);
