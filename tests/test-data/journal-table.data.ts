export const journalCreateTableQueries = [`
  CREATE TABLE IF NOT EXISTS journal (
    journal_id TEXT PRIMARY KEY, -- Use short ID to avoid collisions
    journal_name TEXT NOT NULL,
    journal_created TIMESTAMP DEFAULT(STRFTIME('%Y-%m-%dT%H:%M:%f','NOW'))
  );`,
  `
  CREATE TABLE IF NOT EXISTS entry (
    entry_id TEXT PRIMARY KEY, -- Use short ID to avoid collisions
    entry_journal_id INTEGER,
    entry_title TEXT NOT NULL,
    entry_content TEXT NOT NULL,
    entry_date DATE NOT NULL,
    entry_created TIMESTAMP DEFAULT(STRFTIME('%Y-%m-%dT%H:%M:%f','NOW')),
    entry_updated TIMESTAMP NULL,
    FOREIGN KEY (entry_journal_id) REFERENCES journal(journal_id) ON DELETE CASCADE
  );`
];