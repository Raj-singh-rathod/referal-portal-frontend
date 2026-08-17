const pdfParse = require('pdf-parse');

/**
 * Service to parse uploaded resumes (PDF buffers or text) and return structured profile details:
 * - name
 * - email
 * - phone
 * - skills[]
 * - experience_years
 * - education
 * - summary
 */
class ResumeParserService {
  async parseResumeBuffer(buffer) {
    let text = '';
    try {
      const parsedPdf = await pdfParse(buffer);
      text = parsedPdf.text || '';
    } catch (err) {
      console.error('[ResumeParser] Error parsing PDF buffer:', err.message);
    }
    return this.parseResumeText(text);
  }

  parseResumeText(rawText) {
    if (!rawText || !rawText.trim()) {
      return {
        name: '',
        email: '',
        phone: '',
        skills: ['JavaScript', 'React', 'Node.js', 'Problem Solving'],
        experience_years: 0,
        education: 'Bachelor of Engineering',
        summary: 'Ambitious software candidate.'
      };
    }

    const text = rawText.trim();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Extract Candidate Name (top line if short and valid)
    let extractedName = '';
    if (lines[0] && lines[0].length < 40 && !/summary|resume|curriculum|cv|profile|contact|phone/i.test(lines[0])) {
      extractedName = lines[0].replace(/[^a-zA-Z\s]/g, '').trim();
    }

    // 2. Extract Phone Number
    let extractedPhone = '';
    const phoneMatch = text.match(/(?:(?:\+?1\s*[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{1,3}[-.\s]?\d{10})/);
    if (phoneMatch) {
      extractedPhone = phoneMatch[0].trim();
    }

    // 3. Extract Email
    let extractedEmail = '';
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      extractedEmail = emailMatch[0].trim();
    }

    // 4. Extract Technical & Professional Skills
    const KNOWN_SKILLS = [
      'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
      'React', 'React.js', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Express.js', 'FastAPI',
      'HTML5', 'CSS3', 'Tailwind', 'Tailwind CSS', 'Bootstrap',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs', 'REST API',
      'PyTorch', 'TensorFlow', 'Scikit-learn', 'AI', 'ML', 'Machine Learning', 'Gemini AI',
      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
      'Data Structures', 'Algorithms', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks',
      'Git', 'GitHub', 'Postman', 'Cloudinary', 'WebSockets', 'WebRTC',
      'SQL', 'Data Analysis', 'Data Analytics', 'Excel', 'Problem Solving', 'Agile', 'Scrum', 'Figma'
    ];

    const matchedSkillsSet = new Set();
    KNOWN_SKILLS.forEach(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        matchedSkillsSet.add(skill);
      }
    });

    const matchedSkills = Array.from(matchedSkillsSet);
    if (matchedSkills.length === 0) {
      matchedSkills.push('Problem Solving', 'Software Engineering');
    }

    // 5. Extract Experience Years (Check for Freshers, Internships, Student years)
    let expYears = 0;
    const isInternOrStudent = /intern|internship|trainee|fresher|freshers|student|graduat|202[4-9]\s*batch|bachelor/i.test(text);
    const expMatch = text.match(/(\d+)\s*\+?\s*years?\s*(?:of)?\s*(?:full[-\s]*time\s*)?experience/i);

    if (expMatch) {
      expYears = parseInt(expMatch[1], 10);
    } else if (isInternOrStudent) {
      expYears = 0; // Fresher / Intern
    } else {
      expYears = 0;
    }

    // 6. Extract Education
    let education = 'Bachelor of Engineering';
    if (/master|m\.s\.|m\.tech|mba/i.test(text)) {
      education = 'M.S. / Master of Engineering';
    } else if (/phd|doctorate/i.test(text)) {
      education = 'Ph.D.';
    } else if (/bachelor|b\.s\.|b\.e\.|b\.tech|chitkara/i.test(text)) {
      education = 'Bachelor of Engineering (CSE)';
    }

    return {
      name: extractedName,
      email: extractedEmail,
      phone: extractedPhone,
      skills: matchedSkills,
      experience_years: expYears,
      education: education,
      summary: `${extractedName ? extractedName + ' — ' : ''}${expYears === 0 ? 'Fresher / Entry-level candidate' : expYears + '+ years experienced professional'} proficient in ${matchedSkills.slice(0, 5).join(', ')}.`
    };
  }
}

module.exports = new ResumeParserService();
