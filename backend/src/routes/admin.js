const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const BaseATSAdapter = require('../services/ats/baseAdapter');

// GET /api/admin/employees (List employee verification status)
router.get('/employees', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const list = await db.getAll(`
      SELECT e.*, u.name, u.email, u.avatar_url, c.name as company_name, c.domain as company_domain
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN companies c ON e.company_id = c.id
      ORDER BY e.created_at DESC
    `);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/employees/:id/verify (Verify or reject employee)
router.post('/employees/:id/verify', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be verified or rejected.' });
    }

    const verifiedAt = status === 'verified' ? new Date().toISOString() : null;
    await db.query(
      `UPDATE employees SET verification_status = $1, verified_at = $2 WHERE id = $3`,
      [status, verifiedAt, req.params.id]
    );

    return res.json({ message: `Employee verification status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/companies (Get list of companies)
router.get('/companies', async (req, res) => {
  try {
    const companies = await db.getAll('SELECT id, name, domain, ats_type, portal_url, created_at FROM companies');
    return res.json(companies);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/companies/:id/ats (Configure encrypted ATS key)
router.put('/companies/:id/ats', requireAuth, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const { atsType, apiKey, portalUrl } = req.body;
    const companyId = req.params.id;

    const encryptedKey = apiKey ? BaseATSAdapter.encryptKey(apiKey) : null;

    await db.query(
      `UPDATE companies SET ats_type = $1, ats_api_key_encrypted = COALESCE($2, ats_api_key_encrypted), portal_url = COALESCE($3, portal_url) WHERE id = $4`,
      [atsType || 'none', encryptedKey, portalUrl, companyId]
    );

    return res.json({
      message: 'Company ATS settings updated and API key encrypted at rest (AES-256).'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
