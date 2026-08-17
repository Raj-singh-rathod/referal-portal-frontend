const path = require('path');
const fs = require('fs');

/**
 * Pure JS File-backed Database Engine (No native C++ DLL compilation needed)
 * Handles SQL operations when native sqlite binary is blocked by Windows App Control.
 */
class PureJsFileDb {
  constructor(filepath) {
    this.filepath = filepath;
    this.data = {
      users: [],
      companies: [],
      company_ats_configs: [],
      employees: [],
      job_seekers: [],
      candidate_resumes: [],
      job_postings: [],
      referral_requests: [],
      notifications: [],
      ats_logs: []
    };
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filepath)) {
        const raw = fs.readFileSync(this.filepath, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      }
    } catch (e) {
      console.error('[PureJsFileDb] Read error, resetting store:', e.message);
    }
  }

  _save() {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('[PureJsFileDb] Save error:', e.message);
    }
  }

  exec(sql) {
    // Schema creation helper
    return true;
  }

  prepare(sql) {
    const self = this;
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    return {
      all(...params) {
        return self._executeQuery(cleanSql, params);
      },
      run(...params) {
        const changes = self._executeUpdate(cleanSql, params);
        return { changes };
      }
    };
  }

  _executeQuery(sql, params) {
    const lower = sql.toLowerCase();

    // 1. SELECT js.*, u.name, u.email, u.phone FROM job_seekers js JOIN users u ON js.user_id = u.id WHERE js.user_id = $1
    if (lower.includes('from job_seekers') && lower.includes('join users')) {
      const userId = params[0];
      const seeker = this.data.job_seekers.find(s => s.user_id === userId);
      if (!seeker) return [];
      const user = this.data.users.find(u => u.id === userId) || {};
      return [{
        ...seeker,
        name: user.name,
        email: user.email,
        user_phone: user.phone
      }];
    }

    // 2. SELECT e.*, u.name, u.email, c.name as company_name, c.domain FROM employees e JOIN users u... JOIN companies c...
    if (lower.includes('from employees') && lower.includes('join users') && lower.includes('join companies')) {
      const userId = params[0];
      const emp = this.data.employees.find(e => e.user_id === userId);
      if (!emp) return [];
      const user = this.data.users.find(u => u.id === userId) || {};
      const comp = this.data.companies.find(c => c.id === emp.company_id) || {};
      return [{
        ...emp,
        name: user.name,
        email: user.email,
        company_name: comp.name,
        domain: comp.domain
      }];
    }

    // 3. SELECT jp.*, c.name as company_name, c.domain... FROM job_postings jp JOIN companies c...
    if (lower.includes('from job_postings') && lower.includes('join companies')) {
      return this.data.job_postings.map(jp => {
        let structured = {};
        try { structured = JSON.parse(jp.structured_fields); } catch(e){}
        const comp = this.data.companies.find(c => c.id === jp.company_id) || {};
        const finalCompName = structured.company_name || comp.name || 'Company';

        return {
          ...jp,
          company_name: finalCompName,
          domain: comp.domain || 'company.com',
          portal_url: comp.portal_url || ''
        };
      });
    }

    // 4. SELECT rr.*, jp.title as job_title, js.headline... FROM referral_requests rr JOIN...
    if (lower.includes('from referral_requests') && lower.includes('join')) {
      let filtered = [...this.data.referral_requests];
      if (lower.includes('where rr.seeker_id =')) {
        filtered = filtered.filter(r => r.seeker_id === params[0]);
      } else if (lower.includes('where rr.employee_id =')) {
        filtered = filtered.filter(r => r.employee_id === params[0]);
      } else if (lower.includes('where rr.id =')) {
        filtered = filtered.filter(r => r.id === params[0]);
      }

      return filtered.map(rr => {
        const jp = this.data.job_postings.find(j => j.id === rr.job_posting_id) || {};
        const seeker = this.data.job_seekers.find(s => s.id === rr.seeker_id) || {};
        const seekerUser = this.data.users.find(u => u.id === seeker.user_id) || {};
        const comp = this.data.companies.find(c => c.id === jp.company_id) || {};

        let parsed = {};
        try { parsed = JSON.parse(seeker.parsed_profile); } catch(e){}

        let structuredJp = {};
        try { structuredJp = JSON.parse(jp.structured_fields); } catch(e){}

        const dynamicCompName = structuredJp.company_name || comp.name || 'Company';

        return {
          ...rr,
          posting_title: jp.title || 'Software Position',
          posting_location: jp.location || 'Remote',
          posting_company_name: dynamicCompName,
          company_name: dynamicCompName,
          company_domain: comp.domain || 'company.com',
          ats_type: comp.ats_type || 'none',
          ats_api_key_encrypted: comp.ats_api_key_encrypted,
          portal_url: comp.portal_url || '',
          candidate_name: seekerUser.name || 'Candidate',
          candidate_email: seekerUser.email || '',
          candidate_phone: (seekerUser.phone && seekerUser.phone.trim() && !seekerUser.phone.startsWith('user_')) ? seekerUser.phone : ((seeker.phone && seeker.phone.trim() && !seeker.phone.startsWith('user_')) ? seeker.phone : (parsed.phone || 'Not Provided')),
          candidate_avatar: seekerUser.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          candidate_headline: seeker.headline || '',
          candidate_resume: seeker.resume_url || '/demo-resumes/resume.pdf',
          resume_url: seeker.resume_url || '/demo-resumes/resume.pdf',
          parsed_profile: seeker.parsed_profile || '{}',
          candidate_skills: parsed.skills || [],
          candidate_exp_years: seeker.total_experience_years !== undefined ? seeker.total_experience_years : (parsed.experience_years || 0),
          candidate_summary: parsed.summary || seeker.bio || ''
        };
      });
    }

    // Generic Table Selects
    const tableName = this._extractTableName(sql);
    if (tableName && this.data[tableName]) {
      let rows = [...this.data[tableName]];

      if (lower.includes('where')) {
        rows = this._filterRows(tableName, sql, params, rows);
      }
      return rows;
    }

    return [];
  }

  _executeUpdate(sql, params) {
    const lower = sql.toLowerCase();
    const tableName = this._extractTableName(sql);
    if (!tableName || !this.data[tableName]) this.data[tableName] = [];

    if (lower.startsWith('insert into')) {
      // Extract columns
      const colMatch = sql.match(/\(([^)]+)\)\s*values/i);
      if (colMatch) {
        const cols = colMatch[1].split(',').map(c => c.trim());
        const row = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx] !== undefined ? params[idx] : null;
        });

        // Upsert by primary key if exists
        const existingIdx = this.data[tableName].findIndex(item => item.id === row.id);
        if (existingIdx >= 0) {
          this.data[tableName][existingIdx] = { ...this.data[tableName][existingIdx], ...row };
        } else {
          this.data[tableName].push(row);
        }
        this._save();
        return 1;
      }
    }

    if (lower.startsWith('update')) {
      const setMatch = sql.match(/set\s+(.*?)\s+where/i);
      let count = 0;
      if (setMatch) {
        const setClause = setMatch[1];
        const setAssignments = setClause.split(',').map(s => s.trim());
        const whereParam = params[params.length - 1];

        this.data[tableName].forEach(row => {
          if (row.id === whereParam || row.user_id === whereParam) {
            setAssignments.forEach((assign, i) => {
              const col = assign.split('=')[0].trim();
              if (params[i] !== undefined && params[i] !== null) {
                row[col] = params[i];
              }
            });
            count++;
          }
        });
        this._save();
        return count;
      }
    }

    if (lower.startsWith('delete from')) {
      const targetId = params[0];
      const initialLen = this.data[tableName].length;
      this.data[tableName] = this.data[tableName].filter(r => r.id !== targetId && r.user_id !== targetId);
      this._save();
      return initialLen - this.data[tableName].length;
    }

    return 0;
  }

  _extractTableName(sql) {
    const match = sql.match(/(?:from|into|update|join)\s+([a-zA-Z0-9_]+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  _filterRows(tableName, sql, params, rows) {
    const lower = sql.toLowerCase();
    if (lower.includes('email =')) {
      return rows.filter(r => r.email === params[0]);
    }
    if (lower.includes('user_id =')) {
      return rows.filter(r => r.user_id === params[0]);
    }
    if (lower.includes('id =')) {
      return rows.filter(r => r.id === params[0]);
    }
    if (lower.includes('company_id =')) {
      return rows.filter(r => r.company_id === params[0]);
    }
    return rows;
  }
}

class Database {
  constructor() {
    this.type = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres') ? 'pg' : 'sqlite';

    if (this.type === 'sqlite') {
      try {
        const DatabaseSqlite = require('better-sqlite3');
        const dbPath = path.join(__dirname, 'referal.db');
        this.sqlite = new DatabaseSqlite(dbPath);
        this.sqlite.pragma('journal_mode = WAL');
        this.sqlite.pragma('foreign_keys = ON');
      } catch (err) {
        console.warn('Native better-sqlite3 addon blocked or unavailable. Falling back to Pure JS File DB Engine:', err.message);
        this.type = 'json_file';
        this.jsonDb = new PureJsFileDb(path.join(__dirname, 'referal_store.json'));
        this.sqlite = this.jsonDb;
      }
    } else {
      const { Pool } = require('pg');
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    }
  }

  query(sql, params = []) {
    if (this.type === 'sqlite' || this.type === 'json_file') {
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
          return { rows: [], rowCount: info ? info.changes : 0 };
        }
      } catch (err) {
        console.error('Database Query Error:', err.message, 'SQL:', sqliteSql);
        return { rows: [] };
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
