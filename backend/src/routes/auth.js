const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, companyId, jobTitle, department, headline, bio, location } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, role.' });
    }

    if (role === 'job_seeker' && !phone) {
      return res.status(400).json({ error: 'Phone number is required for Job Seeker registration.' });
    }

    const existingUser = await db.getOne('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    await db.query(
      `INSERT INTO users (id, email, password_hash, name, phone, role, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, email, passwordHash, name, phone || '', role, avatarUrl]
    );

    let employeeId = null;
    let seekerId = null;

    if (role === 'employee') {
      if (!companyId) {
        return res.status(400).json({ error: 'Employee registration requires selecting a company.' });
      }
      employeeId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await db.query(
        `INSERT INTO employees (id, user_id, company_id, job_title, department, verification_status) VALUES ($1, $2, $3, $4, $5, $6)`,
        [employeeId, userId, companyId, jobTitle || 'Staff Member', department || 'Engineering', 'pending']
      );
    } else if (role === 'job_seeker') {
      seekerId = `seeker_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const defaultParsed = JSON.stringify({
        skills: ['React', 'Node.js', 'TypeScript'],
        experience_years: 2,
        education: 'B.S. Computer Science',
        summary: bio || 'Ambitious software professional looking for referrals.'
      });

      await db.query(
        `INSERT INTO job_seekers (id, user_id, headline, bio, phone, location, resume_url, parsed_profile) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [seekerId, userId, headline || 'Software Engineer', bio || '', phone || '', location || 'Remote', '', defaultParsed]
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
        phone: phone || '',
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
        phone: user.phone || '',
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
    const user = await db.getOne('SELECT id, email, name, phone, role, avatar_url FROM users WHERE id = $1', [req.user.id]);
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

// POST /api/auth/forgot-password (Generate 6-digit Reset OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await db.getOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Generate 6-digit OTP code & 15 min expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    await db.query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
      [otp, expiresAt, user.id]
    );

    console.log(`[AUTH] Password reset OTP generated for ${email}: ${otp}`);

    await notificationService.sendNotification({
      userId: user.id,
      type: 'PASSWORD_RESET_OTP',
      title: 'Your Password Reset OTP Code',
      message: `Your 6-digit verification code to reset your password is: ${otp}. This code is valid for 15 minutes.`,
      payload: { otp, email }
    });

    return res.json({
      message: 'Password reset OTP code generated successfully.',
      resetOtp: otp
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password (Verify OTP & Set New Password)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await db.getOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (!user.reset_token || user.reset_token !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP reset code.' });
    }

    if (user.reset_token_expires && Date.now() > parseInt(user.reset_token_expires, 10)) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
      [newPasswordHash, user.id]
    );

    return res.json({
      message: 'Password has been reset successfully! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

