import * as SQLite from 'expo-sqlite';

let db;

export function getDb() {
  if (!db) db = SQLite.openDatabaseSync('stemmlab.db');
  return db;
}

export function initDatabase() {
  const database = getDb();
  database.execSync(`PRAGMA journal_mode = WAL`);
  database.execSync(`
    CREATE TABLE IF NOT EXISTS team (
      id TEXT PRIMARY KEY,
      teamName TEXT NOT NULL,
      members TEXT NOT NULL,
      grade TEXT NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
  database.execSync(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teamId TEXT NOT NULL,
      activityId TEXT NOT NULL,
      data TEXT NOT NULL,
      score REAL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      synced INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
}

export function saveTeamLocal(id, teamName, members, grade) {
  const database = getDb();
  database.runSync(
    `INSERT OR REPLACE INTO team (id, teamName, members, grade) VALUES (?, ?, ?, ?)`,
    [id, teamName, JSON.stringify(members), grade]
  );
}

export function getTeamLocal() {
  const database = getDb();
  const row = database.getFirstSync(`SELECT * FROM team ORDER BY createdAt DESC LIMIT 1`);
  if (!row) return null;
  return { ...row, members: JSON.parse(row.members) };
}

export function saveResultLocal(teamId, activityId, data, score, latitude, longitude) {
  const database = getDb();
  database.runSync(
    `INSERT INTO results (teamId, activityId, data, score, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)`,
    [teamId, activityId, JSON.stringify(data), score, latitude ?? null, longitude ?? null]
  );
}

export function getResultsForActivity(activityId) {
  const database = getDb();
  const rows = database.getAllSync(
    `SELECT * FROM results WHERE activityId = ? ORDER BY createdAt DESC`, [activityId]
  );
  return rows.map((r) => ({ ...r, data: JSON.parse(r.data) }));
}

export function getUnsyncedResults() {
  const database = getDb();
  return database.getAllSync(`SELECT * FROM results WHERE synced = 0`);
}

export function markResultSynced(id) {
  const database = getDb();
  database.runSync(`UPDATE results SET synced = 1 WHERE id = ?`, [id]);
}

export function clearAllLocalData() {
  const database = getDb();
  database.runSync(`DELETE FROM team`);
  database.runSync(`DELETE FROM results`);
}