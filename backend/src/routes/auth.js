const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, companyId, jobTitle, department, headline, bio } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, role.' });
    }

    const existingUser = await db.getOne('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    await db.query(
      `INSERT INTO users (id, email, password_hash, name, role, avatar_url) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, email, passwordHash, name, role, avatarUrl]
    );

    let employeeId = null;
    let seekerId = null;

    if (role === 'employee') {
      if (!companyId) {
        return res.status(400).json({ error: 'Employee registration requires selecting a company.' });
      }
      employeeId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      // Check company verification status (manual approval needed)
      await db.query(
        `INSERT INTO employees (id, user_id, company_id, job_title, department, verification_status) VALUES ($1, $2, $3, $4, $5, $6)`,
        [employeeId, userId, companyId, jobTitle || 'Staff Member', department || 'Engineering', 'pending']
      );
    } else if (role === 'job_seeker') {
      seekerId = `seeker_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const defaultParsed = JSON.stringify({
        skills: ['JavaScript', 'React', 'Node.js'],
        experience_years: 2,
        education: 'B.S. Computer Science',
        summary: bio || 'Ambitious developer looking for referrals.'
      });

      await db.query(
        `INSERT INTO job_seekers (id, user_id, headline, bio, resume_url, parsed_profile) VALUES ($1, $2, $3, $4, $5, $6)`,
        [seekerId, userId, headline || 'Software Engineer', bio || '', '', defaultParsed]
      );
    }

    const token = jwt.sign(
      { id: userId, email, role, name, employeeId, seekerId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        name,
        role,
        avatar_url: avatarUrl,
        employeeId,
        seekerId
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.getOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let employeeId = null;
    let seekerId = null;

    if (user.role === 'employee') {
      const emp = await db.getOne('SELECT id FROM employees WHERE user_id = $1', [user.id]);
      if (emp) employeeId = emp.id;
    } else if (user.role === 'job_seeker') {
      const seeker = await db.getOne('SELECT id FROM job_seekers WHERE user_id = $1', [user.id]);
      if (seeker) seekerId = seeker.id;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, employeeId, seekerId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
        employeeId,
        seekerId
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await db.getOne('SELECT id, email, name, role, avatar_url FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let employeeData = null;
    let seekerData = null;

    if (user.role === 'employee') {
      employeeData = await db.getOne(
        `SELECT e.*, c.name as company_name, c.ats_type 
         FROM employees e 
         JOIN companies c ON e.company_id = c.id 
         WHERE e.user_id = $1`,
        [user.id]
      );
    } else if (user.role === 'job_seeker') {
      seekerData = await db.getOne('SELECT * FROM job_seekers WHERE user_id = $1', [user.id]);
      if (seekerData && seekerData.parsed_profile) {
        try { seekerData.parsed_profile = JSON.parse(seekerData.parsed_profile); } catch(e){}
      }
    }

    return res.json({
      user,
      employee: employeeData,
      seeker: seekerData
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
