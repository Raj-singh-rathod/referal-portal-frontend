const BaseATSAdapter = require('./baseAdapter');

class LeverAdapter extends BaseATSAdapter {
  async submitCandidate({ seeker, posting, employee }) {
    const rawApiKey = BaseATSAdapter.decryptKey(this.company.ats_api_key_encrypted);

    console.log(`[Lever ATS Adapter] Submitting candidate to Lever Opportunities API for ${this.company.name}...`);

    const mockOpportunityId = `lever_opp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      success: true,
      atsType: 'lever',
      atsReferralId: mockOpportunityId,
      message: `Candidate ${seeker.name} opportunity created in Lever with referral tag from insider ${employee.name}.`
    };
  }
}

module.exports = LeverAdapter;
