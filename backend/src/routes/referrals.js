const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const matchingEngine = require('../services/matchingEngine');
const notificationService = require('../services/notificationService');
const GreenhouseAdapter = require('../services/ats/greenhouseAdapter');
const LeverAdapter = require('../services/ats/leverAdapter');
const FallbackAdapter = require('../services/ats/fallbackAdapter');

// GET /api/referrals/feed (Refer.me-style match feed for seekers)
router.get('/feed', async (req, res) => {
  try {
    let seekerProfile = null;
    let existingRequestsMap = {};

    if (req.headers.authorization) {
      try {
        const auth = require('../middleware/auth');
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, auth.JWT_SECRET);
        
        if (decoded.role === 'job_seeker') {
          seekerProfile = await db.getOne('SELECT * FROM job_seekers WHERE user_id = $1', [decoded.id]);
          
          if (seekerProfile) {
            const reqs = await db.getAll('SELECT job_posting_id, status FROM referral_requests WHERE seeker_id = $1', [seekerProfile.id]);
            reqs.forEach(r => { existingRequestsMap[r.job_posting_id] = r.status; });
          }
        }
      } catch (e) {}
    }

    const postings = await db.getAll(`
      SELECT jp.*, 
             c.name as company_name, c.domain as company_domain, c.ats_type, c.portal_url,
             u.name as employee_name, u.avatar_url as employee_avatar, u.email as employee_email,
             e.id as employee_id, e.job_title as employee_role
      FROM job_postings jp
      JOIN companies c ON jp.company_id = c.id
      JOIN employees e ON jp.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE jp.status = 'published'
      ORDER BY jp.created_at DESC
    `);

    const feedItems = postings.map(posting => {
      let structured = {};
      try { structured = JSON.parse(posting.structured_fields); } catch(e){}

      let matchScore = 85; // baseline demo match score
      if (seekerProfile) {
        matchScore = matchingEngine.calculateMatchScore(seekerProfile, posting);
      }

      return {
        id: posting.id,
        posting_id: posting.id,
        title: posting.title,
        location: posting.location,
        employment_type: posting.employment_type,
        company: {
          name: structured.company_name || posting.company_name,
          domain: posting.company_domain,
          ats_type: posting.ats_type,
          portal_url: posting.portal_url
        },
        insider: {
          employee_id: posting.employee_id,
          name: posting.employee_name,
          role: posting.employee_role,
          avatar_url: posting.employee_avatar
        },
        match_score: matchScore,
        required_skills: structured.required_skills || [],
        experience_min_years: structured.experience_min_years || 2,
        request_status: existingRequestsMap[posting.id] || null,
        is_free: true
      };
    });

    // Rank feed by highest match score first
    feedItems.sort((a, b) => b.match_score - a.match_score);

    return res.json(feedItems);
  } catch (err) {
    console.error('Feed error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/referrals/request (Free referral request submission)
router.post('/request', requireAuth, requireRole('job_seeker'), async (req, res) => {
  try {
    const { jobPostingId } = req.body;
    if (!jobPostingId) {
      return res.status(400).json({ error: 'Job Posting ID is required.' });
    }

    const seeker = await db.getOne('SELECT * FROM job_seekers WHERE user_id = $1', [req.user.id]);
    if (!seeker) {
      return res.status(404).json({ error: 'Job seeker profile not found.' });
    }

    const posting = await db.getOne(`
      SELECT jp.*, e.user_id as employee_user_id 
      FROM job_postings jp
      JOIN employees e ON jp.employee_id = e.id
      WHERE jp.id = $1
    `, [jobPostingId]);

    if (!posting) {
      return res.status(404).json({ error: 'Job posting not found.' });
    }

    const existing = await db.getOne(
      'SELECT * FROM referral_requests WHERE seeker_id = $1 AND job_posting_id = $2',
      [seeker.id, jobPostingId]
    );

    if (existing) {
      return res.status(400).json({ error: 'You have already requested a referral for this position.' });
    }

    const matchScore = matchingEngine.calculateMatchScore(seeker, posting);
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    await db.query(
      `INSERT INTO referral_requests (id, seeker_id, job_posting_id, employee_id, match_score, status) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [requestId, seeker.id, jobPostingId, posting.employee_id, matchScore, 'applied']
    );

    // Notify employee of new referral request
    const seekerUser = await db.getOne('SELECT name FROM users WHERE id = $1', [req.user.id]);
    await notificationService.sendNotification({
      userId: posting.employee_user_id,
      type: 'NEW_REFERRAL_REQUEST',
      title: 'New Free Referral Request!',
      message: `${seekerUser ? seekerUser.name : 'A job seeker'} (${matchScore}% match) requested a free referral for ${posting.title}.`,
      payload: { requestId, seekerId: seeker.id, postingId: jobPostingId }
    });

    return res.status(201).json({
      message: 'Free referral request submitted successfully!',
      requestId,
      matchScore
    });
  } catch (err) {
    console.error('Request Referral Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/referrals/employee-dashboard (Applicant pipeline sorted by match score)
router.get('/employee-dashboard', requireAuth, requireRole('employee', 'admin'), async (req, res) => {
  try {
    let emp = await db.getOne('SELECT * FROM employees WHERE user_id = $1', [req.user.id]);
    if (!emp) {
      emp = await db.getOne('SELECT * FROM employees LIMIT 1');
    }

    const requests = await db.getAll(`
      SELECT rr.*, 
             jp.title as posting_title, jp.location as posting_location,
             u.name as candidate_name, u.email as candidate_email, COALESCE(NULLIF(u.phone, ''), NULLIF(js.phone, ''), 'Not Provided') as candidate_phone, u.avatar_url as candidate_avatar,
             js.headline as candidate_headline, js.resume_url as candidate_resume, js.parsed_profile
      FROM referral_requests rr
      JOIN job_postings jp ON rr.job_posting_id = jp.id
      JOIN job_seekers js ON rr.seeker_id = js.id
      JOIN users u ON js.user_id = u.id
      WHERE rr.employee_id = $1
      ORDER BY rr.match_score DESC, rr.created_at DESC
    `, [emp.id]);

    const formatted = requests.map(r => {
      let parsed = {};
      try { parsed = JSON.parse(r.parsed_profile); } catch(e){}
      return {
        ...r,
        candidate_phone: r.candidate_phone || parsed.phone || 'Not Provided',
        candidate_skills: parsed.skills || [],
        candidate_exp_years: parsed.experience_years || 2,
        candidate_summary: parsed.summary || ''
      };
    });

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/referrals/:id/refer (Action: ATS Push or Clipboard + Redirect Fallback)
router.post('/:id/refer', requireAuth, requireRole('employee', 'admin'), async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await db.getOne(`
      SELECT rr.*, 
             jp.title as posting_title, jp.company_id,
             js.id as seeker_id, js.resume_url, js.parsed_profile,
             u.name as candidate_name, u.email as candidate_email,
             c.name as company_name, c.ats_type, c.ats_api_key_encrypted, c.portal_url,
             eu.name as employee_name, eu.email as employee_email
      FROM referral_requests rr
      JOIN job_postings jp ON rr.job_posting_id = jp.id
      JOIN job_seekers js ON rr.seeker_id = js.id
      JOIN users u ON js.user_id = u.id
      JOIN companies c ON jp.company_id = c.id
      JOIN employees e ON rr.employee_id = e.id
      JOIN users eu ON e.user_id = eu.id
      WHERE rr.id = $1
    `, [requestId]);

    if (!request) {
      return res.status(404).json({ error: 'Referral request not found.' });
    }

    const company = {
      name: request.company_name,
      ats_type: request.ats_type,
      ats_api_key_encrypted: request.ats_api_key_encrypted,
      portal_url: request.portal_url
    };

    const seeker = {
      name: request.candidate_name,
      email: request.candidate_email,
      resume_url: request.candidate_resume,
      parsed_profile: request.parsed_profile
    };

    const posting = { id: request.job_posting_id, title: request.posting_title };
    const employee = { name: request.employee_name, email: request.employee_email };

    let atsResult;
    if (company.ats_type === 'greenhouse') {
      const adapter = new GreenhouseAdapter(company);
      atsResult = await adapter.submitCandidate({ seeker, posting, employee });
    } else if (company.ats_type === 'lever') {
      const adapter = new LeverAdapter(company);
      atsResult = await adapter.submitCandidate({ seeker, posting, employee });
    } else {
      const adapter = new FallbackAdapter(company);
      atsResult = await adapter.submitCandidate({ seeker, posting, employee });
    }

    // Update referral status to 'referred'
    await db.query(
      `UPDATE referral_requests SET status = 'referred', ats_referral_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [atsResult.atsReferralId || 'fallback_clipboard', requestId]
    );

    // Log ATS Action
    const logId = `atslog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await db.query(
      `INSERT INTO ats_logs (id, company_id, referral_request_id, ats_type, status, response_payload) VALUES ($1, $2, $3, $4, $5, $6)`,
      [logId, request.company_id, requestId, company.ats_type || 'fallback', atsResult.success ? 'success' : 'failed', JSON.stringify(atsResult)]
    );

    // Notify Candidate
    const seekerUser = await db.getOne('SELECT user_id FROM job_seekers WHERE id = $1', [request.seeker_id]);
    if (seekerUser) {
      await notificationService.sendNotification({
        userId: seekerUser.user_id,
        type: 'REFERRAL_SUBMITTED',
        title: 'You were referred!',
        message: `Insider ${employee.name} at ${company.name} has submitted your internal referral for "${posting.title}".`,
        payload: { requestId, atsResult }
      });
    }

    return res.json({
      message: 'Referral processed successfully!',
      result: atsResult
    });
  } catch (err) {
    console.error('Refer Action Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/referrals/my-requests (Job seeker request tracking)
router.get('/my-requests', requireAuth, requireRole('job_seeker'), async (req, res) => {
  try {
    const seeker = await db.getOne('SELECT id FROM job_seekers WHERE user_id = $1', [req.user.id]);
    if (!seeker) return res.status(404).json({ error: 'Job seeker profile not found.' });

    const requests = await db.getAll(`
      SELECT rr.*, 
             jp.title as posting_title, jp.location as posting_location,
             c.name as company_name, c.domain as company_domain,
             u.name as employee_name, u.avatar_url as employee_avatar, e.job_title as employee_role
      FROM referral_requests rr
      JOIN job_postings jp ON rr.job_posting_id = jp.id
      JOIN companies c ON jp.company_id = c.id
      JOIN employees e ON rr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE rr.seeker_id = $1
      ORDER BY rr.updated_at DESC
    `, [seeker.id]);

    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/referrals/:id/status (Employee / Admin updates application status)
router.patch('/:id/status', requireAuth, requireRole('employee', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['applied', 'under_review', 'referred', 'interview', 'hired', 'rejected'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
    }

    await db.query(
      `UPDATE referral_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, req.params.id]
    );

    // Notify seeker
    const request = await db.getOne(`
      SELECT rr.*, js.user_id as seeker_user_id, jp.title as posting_title 
      FROM referral_requests rr
      JOIN job_seekers js ON rr.seeker_id = js.id
      JOIN job_postings jp ON rr.job_posting_id = jp.id
      WHERE rr.id = $1
    `, [req.params.id]);

    if (request) {
      await notificationService.sendNotification({
        userId: request.seeker_user_id,
        type: 'REFERRAL_STATUS_UPDATED',
        title: `Referral Status Updated: ${status.toUpperCase()}`,
        message: `Your referral request status for "${request.posting_title}" has been updated to "${status.replace('_', ' ')}".`,
        payload: { requestId: req.params.id, status }
      });
    }

    return res.json({ message: 'Referral status updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
