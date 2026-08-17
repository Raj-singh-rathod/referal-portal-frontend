const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const resumeParser = require('../services/resumeParser');

// Strict Multer setup: 5MB Max File Size & PDF Only
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF files up to 5MB are accepted.'), false);
    }
  }
});

const fs = require('fs');

// POST /api/seekers/resume (Upload PDF resume <= 5MB and parse/update profile)
router.post('/resume', requireAuth, requireRole('job_seeker'), (req, res) => {
  upload.single('resume')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds maximum limit of 5MB.' });
      }
      return res.status(400).json({ error: err.message || 'File upload error.' });
    }

    try {
      const { name, phone, location, experience_years, headline, bio, manualSkills, resumeText } = req.body;
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      let resumeUrl = '/demo-resumes/resume.pdf';
      let parsedProfile = {};

      if (req.file) {
        const safeFilename = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = path.join(uploadsDir, safeFilename);
        fs.writeFileSync(filePath, req.file.buffer);
        resumeUrl = `/uploads/${safeFilename}`;

        parsedProfile = await resumeParser.parseResumeBuffer(req.file.buffer);
      } else {
        parsedProfile = resumeParser.parseResumeText(resumeText || '');
      }

      // Override with manual inputs if provided by user
      if (experience_years !== undefined && experience_years !== '') {
        parsedProfile.experience_years = parseInt(experience_years, 10);
      }
      if (manualSkills) {
        const skillsArr = typeof manualSkills === 'string' ? manualSkills.split(',').map(s => s.trim()) : manualSkills;
        if (Array.isArray(skillsArr) && skillsArr.length > 0) {
          parsedProfile.skills = Array.from(new Set([...(parsedProfile.skills || []), ...skillsArr]));
        }
      }

      const seeker = await db.getOne('SELECT id FROM job_seekers WHERE user_id = $1', [req.user.id]);
      if (!seeker) {
        return res.status(404).json({ error: 'Job Seeker record not found.' });
      }

      const finalName = name || parsedProfile.name || null;
      const finalPhone = phone || parsedProfile.phone || null;

      // Update User table
      if (finalName || finalPhone) {
        await db.query(
          `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3`,
          [finalName, finalPhone, req.user.id]
        );
      }

      // Update Job Seeker table
      const totalExpYears = parsedProfile.experience_years !== undefined ? parsedProfile.experience_years : 0;
      await db.query(
        `UPDATE job_seekers SET headline = COALESCE($1, headline), bio = COALESCE($2, bio), phone = COALESCE($3, phone), location = COALESCE($4, location), total_experience_years = $5, resume_url = $6, parsed_profile = $7 WHERE id = $8`,
        [headline || null, bio || null, finalPhone, location || 'Remote', totalExpYears, resumeUrl, JSON.stringify(parsedProfile), seeker.id]
      );

      return res.json({
        message: 'Resume and profile updated successfully!',
        resumeUrl,
        parsedProfile
      });
    } catch (error) {
      console.error('Resume process error:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// GET /api/seekers/profile
router.get('/profile', requireAuth, requireRole('job_seeker'), async (req, res) => {
  try {
    const seeker = await db.getOne(`
      SELECT js.*, u.name, u.email, u.phone as user_phone 
      FROM job_seekers js 
      JOIN users u ON js.user_id = u.id 
      WHERE js.user_id = $1
    `, [req.user.id]);

    if (!seeker) return res.status(404).json({ error: 'Profile not found' });

    try { seeker.parsed_profile = JSON.parse(seeker.parsed_profile); } catch(e){}
    return res.json(seeker);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/seekers/profile (Manual Profile Updates)
router.put('/profile', requireAuth, requireRole('job_seeker'), async (req, res) => {
  try {
    const { name, phone, location, headline, bio, skills, experience_years, education } = req.body;
    const seeker = await db.getOne('SELECT * FROM job_seekers WHERE user_id = $1', [req.user.id]);
    if (!seeker) return res.status(404).json({ error: 'Profile not found' });

    let parsed = {};
    try { parsed = JSON.parse(seeker.parsed_profile); } catch(e){}

    if (skills) parsed.skills = skills;
    if (experience_years !== undefined) parsed.experience_years = parseInt(experience_years, 10);
    if (education) parsed.education = education;

    if (name || phone) {
      await db.query(
        `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3`,
        [name || null, phone || null, req.user.id]
      );
    }

    await db.query(
      `UPDATE job_seekers SET headline = COALESCE($1, headline), bio = COALESCE($2, bio), phone = COALESCE($3, phone), location = COALESCE($4, location), parsed_profile = $5 WHERE id = $6`,
      [headline || seeker.headline, bio || seeker.bio, phone || seeker.phone, location || seeker.location, JSON.stringify(parsed), seeker.id]
    );

    return res.json({ message: 'Profile details updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
