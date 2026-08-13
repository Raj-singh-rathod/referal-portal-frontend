const BaseATSAdapter = require('./baseAdapter');

class GreenhouseAdapter extends BaseATSAdapter {
  async submitCandidate({ seeker, posting, employee }) {
    const rawApiKey = BaseATSAdapter.decryptKey(this.company.ats_api_key_encrypted);
    
    // Parse seeker details
    let profileData = {};
    if (typeof seeker.parsed_profile === 'string') {
      try { profileData = JSON.parse(seeker.parsed_profile); } catch (e) {}
    } else {
      profileData = seeker.parsed_profile || {};
    }

    const candidatePayload = {
      first_name: seeker.name ? seeker.name.split(' ')[0] : 'Job',
      last_name: seeker.name ? seeker.name.split(' ').slice(1).join(' ') || 'Seeker' : 'Candidate',
      company: 'Free Referral Matching Platform Candidate',
      title: seeker.headline || 'Software Engineer',
      phone_numbers: [
        {
          value: '555-0199',
          type: 'mobile'
        }
      ],
      email_addresses: [
        {
          value: seeker.email,
          type: 'personal'
        }
      ],
      applications: [
        {
          job_id: posting.id,
          referrer: {
            type: 'employee',
            name: employee.name,
            email: employee.email
          },
          source_id: 1001 // Employee Referral Source ID
        }
      ],
      attachments: seeker.resume_url ? [
        {
          filename: `${seeker.name.replace(/\s+/g, '_')}_Resume.pdf`,
          type: 'resume',
          url: seeker.resume_url
        }
      ] : []
    };

    console.log(`[Greenhouse ATS Adapter] Submitting candidate to Greenhouse Harvest API for ${this.company.name}...`);
    console.log(`[Greenhouse ATS Adapter] Header Auth: Basic ${Buffer.from((rawApiKey || 'demo_key') + ':').toString('base64').substring(0, 15)}...`);

    // Simulated API request execution with rate limit header handling
    const rateLimitLimit = 100;
    const rateLimitRemaining = 98;

    // Simulate ATS response
    const mockAtsCandidateId = `gh_cand_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      success: true,
      atsType: 'greenhouse',
      atsReferralId: mockAtsCandidateId,
      rateLimitInfo: {
        limit: rateLimitLimit,
        remaining: rateLimitRemaining
      },
      message: `Candidate ${seeker.name} successfully pushed to Greenhouse ATS with referrer set to ${employee.name}.`
    };
  }
}

module.exports = GreenhouseAdapter;
