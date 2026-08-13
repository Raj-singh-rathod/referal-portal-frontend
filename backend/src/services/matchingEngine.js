const db = require('../db/db');
const notificationService = require('./notificationService');

class MatchingEngine {
  /**
   * Calculate match score between a candidate profile and a job posting
   * Returns a score from 0 to 100.
   */
  calculateMatchScore(seekerProfile, jobPosting) {
    if (!seekerProfile || !jobPosting) return 50;

    let candidateSkills = [];
    if (typeof seekerProfile.parsed_profile === 'string') {
      try {
        const parsed = JSON.parse(seekerProfile.parsed_profile);
        candidateSkills = parsed.skills || [];
      } catch (e) {}
    } else if (seekerProfile.parsed_profile && seekerProfile.parsed_profile.skills) {
      candidateSkills = seekerProfile.parsed_profile.skills;
    }

    let jobSkills = [];
    let minExp = 0;
    let maxExp = 10;
    if (typeof jobPosting.structured_fields === 'string') {
      try {
        const parsed = JSON.parse(jobPosting.structured_fields);
        jobSkills = parsed.required_skills || [];
        minExp = parsed.experience_min_years || 0;
        maxExp = parsed.experience_max_years || 10;
      } catch (e) {}
    } else if (jobPosting.structured_fields) {
      jobSkills = jobPosting.structured_fields.required_skills || [];
      minExp = jobPosting.structured_fields.experience_min_years || 0;
      maxExp = jobPosting.structured_fields.experience_max_years || 10;
    }

    // 1. Skill Overlap (60% weight)
    let skillScore = 0;
    if (jobSkills.length > 0) {
      const lowerCandidateSkills = candidateSkills.map(s => s.toLowerCase().trim());
      const matches = jobSkills.filter(s => lowerCandidateSkills.includes(s.toLowerCase().trim()));
      skillScore = (matches.length / jobSkills.length) * 100;
    } else {
      skillScore = 70; // default baseline if no skills specified
    }

    // 2. Experience Level Fit (40% weight)
    let candidateExp = 3;
    if (seekerProfile.parsed_profile && seekerProfile.parsed_profile.experience_years) {
      candidateExp = seekerProfile.parsed_profile.experience_years;
    }

    let expScore = 100;
    if (candidateExp < minExp) {
      const diff = minExp - candidateExp;
      expScore = Math.max(20, 100 - diff * 20);
    } else if (candidateExp > maxExp) {
      expScore = 90; // Slightly higher exp is usually good
    }

    const finalScore = Math.round(skillScore * 0.65 + expScore * 0.35);
    return Math.min(99, Math.max(30, finalScore));
  }

  /**
   * Recompute match scores across all active job seekers when a new job posting is created
   */
  async computeMatchesForPosting(postingId) {
    try {
      const posting = await db.getOne('SELECT * FROM job_postings WHERE id = $1', [postingId]);
      if (!posting) return;

      const seekers = await db.getAll('SELECT * FROM job_seekers');
      for (const seeker of seekers) {
        const score = this.calculateMatchScore(seeker, posting);
        
        // Notify job seeker if score > 75%
        if (score >= 75) {
          const user = await db.getOne('SELECT * FROM users WHERE id = $1', [seeker.user_id]);
          if (user) {
            await notificationService.sendNotification({
              userId: user.id,
              type: 'HIGH_MATCH_POSTING',
              title: `High Match Job Opening (${score}%)!`,
              message: `A new referral opportunity "${posting.title}" matches your profile by ${score}%.`,
              payload: { postingId: posting.id, score }
            });
          }
        }
      }
    } catch (err) {
      console.error('[MatchingEngine] Error computing matches:', err);
    }
  }
}

module.exports = new MatchingEngine();
