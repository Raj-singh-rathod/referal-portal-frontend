const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const aiJdParser = require('../services/aiJdParser');
const matchingEngine = require('../services/matchingEngine');

// POST /api/jobs/parse-jd (Human-in-the-loop step 1: extract raw text into structured JSON)
router.post('/parse-jd', requireAuth, requireRole('employee', 'admin'), async (req, res) => {
  try {
    const { rawJdText } = req.body;
    if (!rawJdText || !rawJdText.trim()) {
      return res.status(400).json({ error: 'Please provide raw job description text to parse.' });
    }

    const extractedFields = await aiJdParser.parseJd(rawJdText);
    return res.json({
      success: true,
      extractedFields
    });
  } catch (err) {
    console.error('Parse JD Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs (Human-in-the-loop step 2: publish reviewed posting)
router.post('/', requireAuth, requireRole('employee', 'admin'), async (req, res) => {
  try {
    const { title, location, employmentType, rawJdText, structuredFields } = req.body;

    if (!title || !structuredFields) {
      return res.status(400).json({ error: 'Title and structured fields are required.' });
    }

    // Get employee details
    let emp = await db.getOne('SELECT * FROM employees WHERE user_id = $1', [req.user.id]);
    if (!emp) {
      // Fallback if demo admin creates a posting
      const firstEmp = await db.getOne('SELECT * FROM employees LIMIT 1');
      emp = firstEmp;
    }

    const parsedFields = typeof structuredFields === 'string' ? JSON.parse(structuredFields) : structuredFields;
    let companyId = emp ? emp.company_id : 'comp_stripe';
    const customCompanyName = parsedFields.company_name;

    if (customCompanyName && customCompanyName.trim()) {
      const cleanName = customCompanyName.trim();
      const existingComp = await db.getOne('SELECT id FROM companies WHERE LOWER(name) = LOWER($1)', [cleanName]);
      if (existingComp) {
        companyId = existingComp.id;
      } else {
        const newCompId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const domain = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
        await db.query(
          `INSERT INTO companies (id, name, domain, portal_url) VALUES ($1, $2, $3, $4)`,
          [newCompId, cleanName, domain, `https://${domain}`]
        );
        companyId = newCompId;
      }
    }

    const postingId = `posting_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const fieldsJson = JSON.stringify(parsedFields);

    await db.query(
      `INSERT INTO job_postings (id, employee_id, company_id, title, location, employment_type, raw_jd_text, structured_fields, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        postingId,
        emp.id,
        companyId,
        title,
        location || 'Remote',
        employmentType || 'Full-time',
        rawJdText || '',
        fieldsJson,
        'published'
      ]
    );

    // Trigger async matching engine in background
    setTimeout(() => {
      matchingEngine.computeMatchesForPosting(postingId);
    }, 100);

    return res.status(201).json({
      message: 'Job posting published successfully!',
      postingId
    });
  } catch (err) {
    console.error('Create Job Posting Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await db.getAll(`
      SELECT jp.*, c.name as company_name, c.domain as company_domain, c.ats_type,
             u.name as employee_name, u.avatar_url as employee_avatar, e.job_title as employee_role
      FROM job_postings jp
      JOIN companies c ON jp.company_id = c.id
      JOIN employees e ON jp.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE jp.status = 'published'
      ORDER BY jp.created_at DESC
    `);

    const formatted = jobs.map(j => {
      let structured = {};
      try { structured = JSON.parse(j.structured_fields); } catch(e){}
      return {
        ...j,
        structured_fields: structured
      };
    });

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await db.getOne(`
      SELECT jp.*, c.name as company_name, c.domain as company_domain, c.ats_type,
             u.name as employee_name, u.avatar_url as employee_avatar, e.job_title as employee_role
      FROM job_postings jp
      JOIN companies c ON jp.company_id = c.id
      JOIN employees e ON jp.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE jp.id = $1
    `, [req.params.id]);

    if (!job) return res.status(404).json({ error: 'Job posting not found.' });

    try { job.structured_fields = JSON.parse(job.structured_fields); } catch(e){}
    return res.json(job);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
