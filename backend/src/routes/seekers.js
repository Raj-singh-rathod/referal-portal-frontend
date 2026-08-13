const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const resumeParser = require('../services/resumeParser');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/seekers/resume (Upload resume and parse NLP profile)
router.post('/resume', requireAuth, requireRole('job_seeker'), upload.single('resume'), async (req, res) => {
  try {
    let resumeText = req.body.resumeText || '';

    if (req.file) {
      resumeText = req.file.buffer.toString('utf8');
    }

    if (!resumeText) {
      resumeText = 'David Kim - Senior Software Engineer. 5 years experience with React, Node.js, TypeScript, PostgreSQL, AWS, Docker.';
    }

    const parsedProfile = resumeParser.parseResumeText(resumeText);
    const seeker = await db.getOne('SELECT id FROM job_seekers WHERE user_id = $1', [req.user.id]);

    if (!seeker) {
      return res.status(404).json({ error: 'Job Seeker record not found.' });
    }

    const resumeUrl = req.file ? `/uploads/${req.file.originalname}` : '/demo-resumes/resume.pdf';

    await db.query(
      `UPDATE job_seekers SET resume_url = $1, parsed_profile = $2 WHERE id = $3`,
      [resumeUrl, JSON.stringify(parsedProfile), seeker.id]
    );

    return res.json({
      message: 'Resume parsed and profile updated successfully!',
      parsedProfile
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/seekers/profile
router.get('/profile', requireAuth, requireRole('job_seeker'), async (req, res) => {
  try {
    const seeker = await db.getOne('SELECT * FROM job_seekers WHERE user_id = $1', [req.user.id]);
    if (!seeker) return res.status(404).json({ error: 'Profile not found' });

    try { seeker.parsed_profile = JSON.parse(seeker.parsed_profile); } catch(e){}
    return res.json(seeker);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/seekers/profile
router.get('/profile', requireAuth, requireRole('job_seeker'), async (req, res) => {
  try {
    const { headline, bio, skills, experience_years, education } = req.body;
    const seeker = await db.getOne('SELECT * FROM job_seekers WHERE user_id = $1', [req.user.id]);
    if (!seeker) return res.status(404).json({ error: 'Profile not found' });

    let parsed = {};
    try { parsed = JSON.parse(seeker.parsed_profile); } catch(e){}

    if (skills) parsed.skills = skills;
    if (experience_years) parsed.experience_years = experience_years;
    if (education) parsed.education = education;

    await db.query(
      `UPDATE job_seekers SET headline = $1, bio = $2, parsed_profile = $3 WHERE id = $4`,
      [headline || seeker.headline, bio || seeker.bio, JSON.stringify(parsed), seeker.id]
    );

    return res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
