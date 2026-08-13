const BaseATSAdapter = require('./baseAdapter');

class FallbackAdapter extends BaseATSAdapter {
  async submitCandidate({ seeker, posting, employee }) {
    let skillsList = 'React, Node.js, TypeScript';
    let expYears = 3;
    let summary = 'Full Stack Developer';

    if (seeker.parsed_profile) {
      const parsed = typeof seeker.parsed_profile === 'string' ? JSON.parse(seeker.parsed_profile) : seeker.parsed_profile;
      if (parsed.skills) skillsList = parsed.skills.join(', ');
      if (parsed.experience_years) expYears = parsed.experience_years;
      if (parsed.summary) summary = parsed.summary;
    }

    const clipboardText = `--- INTERNAL CANDIDATE REFERRAL SUMMARY ---
Candidate Name: ${seeker.name}
Email: ${seeker.email}
Target Role: ${posting.title}
Experience: ${expYears} years
Key Skills: ${skillsList}
Summary: ${summary}
Resume Download: ${seeker.resume_url || 'Available on Referal Portal'}
Referred By Insider: ${employee.name} (${employee.email})
--------------------------------------------`;

    return {
      success: true,
      atsType: 'clipboard_fallback',
      clipboardSnippet: clipboardText,
      portalUrl: this.company.portal_url || `https://www.${this.company.domain || 'google.com'}/careers`,
      message: `Candidate summary generated for clipboard copy and opening company referral portal.`
    };
  }
}

module.exports = FallbackAdapter;
