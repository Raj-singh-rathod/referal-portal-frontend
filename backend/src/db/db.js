const path = require('path');
const fs = require('fs');

let dbDriver;

// Simple unified database wrapper over SQLite or PostgreSQL
class Database {
  constructor() {
    this.type = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres') ? 'pg' : 'sqlite';
    
    if (this.type === 'sqlite') {
      const DatabaseSqlite = require('better-sqlite3');
      const dbPath = path.join(__dirname, 'referal.db');
      this.sqlite = new DatabaseSqlite(dbPath);
      this.sqlite.pragma('journal_mode = WAL');
      this.sqlite.pragma('foreign_keys = ON');
    } else {
      const { Pool } = require('pg');
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    }
  }

  // Convert ? or $1 positional params to standard format
  query(sql, params = []) {
    if (this.type === 'sqlite') {
      // Replace Postgres $1, $2 with ? for SQLite compatibility
      const sqliteSql = sql.replace(/\$\d+/g, '?');
      const lowerSql = sqliteSql.trim().toLowerCase();
      
      try {
        if (lowerSql.startsWith('select') || lowerSql.includes('returning')) {
          const stmt = this.sqlite.prepare(sqliteSql);
          const rows = stmt.all(...params);
          return { rows };
        } else {
          const stmt = this.sqlite.prepare(sqliteSql);
          const info = stmt.run(...params);
          return { rows: [], rowCount: info.changes };
        }
      } catch (err) {
        console.error('SQLite Query Error:', err.message, 'SQL:', sqliteSql);
        throw err;
      }
    } else {
      return this.pool.query(sql, params);
    }
  }

  async getOne(sql, params = []) {
    const res = await this.query(sql, params);
    return res.rows[0] || null;
  }

  async getAll(sql, params = []) {
    const res = await this.query(sql, params);
    return res.rows;
  }

  async execute(sql, params = []) {
    return this.query(sql, params);
  }
}

const db = new Database();
module.exports = db;
