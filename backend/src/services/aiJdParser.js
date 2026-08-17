const http = require('http');

/**
 * Service to parse raw Job Description text into structured JSON fields:
 * - job_title
 * - required_skills[]
 * - experience_min_years
 * - experience_max_years
 * - location
 * - employment_type
 * - responsibilities[]
 * - qualifications[]
 */
class AIJdParserService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.modelName = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  }

  async parseJd(rawText) {
    if (!rawText || !rawText.trim()) {
      throw new Error('Raw JD text cannot be empty');
    }

    // Try Ollama local LLM first if available
    try {
      const llmResult = await this._callOllama(rawText);
      if (llmResult && llmResult.required_skills) {
        return llmResult;
      }
    } catch (err) {
      console.log('[AIJdParser] Ollama call skipped/failed, using fallback NLP extractor:', err.message);
    }

    // Fallback NLP heuristic parser
    return this._fallbackParse(rawText);
  }

  async _callOllama(rawText) {
    const prompt = `You are an expert HR AI assistant. Parse the following raw job description text into a clean structured JSON object.
Return ONLY valid JSON matching this exact format:
{
  "job_title": "string",
  "company_name": "string",
  "required_skills": ["skill1", "skill2"],
  "experience_min_years": number,
  "experience_max_years": number,
  "location": "string",
  "employment_type": "Full-time | Part-time | Contract | Remote",
  "responsibilities": ["bullet 1", "bullet 2"],
  "qualifications": ["bullet 1", "bullet 2"]
}

JOB DESCRIPTION TEXT:
${rawText}`;

    return new Promise((resolve, reject) => {
      const url = new URL(`${this.ollamaUrl}/api/generate`);
      const postData = JSON.stringify({
        model: this.modelName,
        prompt: prompt,
        stream: false,
        format: "json"
      });

      const req = http.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 4000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            const parsedJson = JSON.parse(data.response);
            resolve(parsedJson);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Ollama request timed out'));
      });

      req.write(postData);
      req.end();
    });
  }

  _fallbackParse(rawText) {
    const text = rawText.trim();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Extract Job Title
    let jobTitle = 'Software Engineer';
    const hiringMatch = text.match(/(?:hiring|looking for|opening for)\s*[:–-]?\s*([a-zA-Z0-9\s/&-]+)/i);
    if (hiringMatch && hiringMatch[1].trim().length < 60) {
      jobTitle = hiringMatch[1].trim().split('\n')[0].trim();
    } else {
      const titleMatch = lines.find(l => /engineer|manager|architect|developer|designer|lead|analyst|specialist|consultant|associate/i.test(l));
      if (titleMatch && titleMatch.length < 80) {
        jobTitle = titleMatch.replace(/^.*?(hiring|role|position)\s*[:–-]\s*/i, '').trim().split('\n')[0].trim();
      } else if (lines[0]) {
        jobTitle = lines[0].slice(0, 60).split('\n')[0].trim();
      }
    }

    // 2. Extract Company Name
    let companyName = '';
    const compLineMatch = text.match(/(?:company|company name|organization)\s*:\s*([^\n\r]+)/i);
    const hiringCompMatch = text.match(/^([a-zA-Z0-9\s&]+?)\s+is\s+hiring/i) || text.match(/(?:at|hiring at)\s+([a-zA-Z0-9\s&]+?)(?:\s+–|\s+-|\s+is|\n|\r|$)/i);

    if (compLineMatch) {
      companyName = compLineMatch[1].trim();
    } else if (hiringCompMatch) {
      companyName = hiringCompMatch[1].trim();
    }

    // 3. Extract Location
    let location = 'Remote';
    const locMatch = text.match(/location\s*:\s*([^\n\r]+)/i);
    if (locMatch) {
      location = locMatch[1].trim();
    } else if (/remote/i.test(text)) {
      location = 'Remote';
    } else if (/hybrid/i.test(text)) {
      location = 'Hybrid';
    } else if (/san francisco|sf/i.test(text)) {
      location = 'San Francisco, CA (Hybrid)';
    } else if (/new york|nyc/i.test(text)) {
      location = 'New York, NY (Hybrid)';
    } else if (/bangalore|bengaluru|mumbai|delhi|pune|hyderabad/i.test(text)) {
      const cityMatch = text.match(/(bangalore|bengaluru|mumbai|delhi|pune|hyderabad|noida|gurugram)/i);
      location = cityMatch ? cityMatch[0] : 'India';
    }

    // 4. Extract Experience (Freshers vs Experienced)
    let minExp = 0;
    let maxExp = 2;

    const isFresher = /fresher|freshers|entry level|0\s*years?|0-1\s*years?|graduates?|202\d\s*batch/i.test(text);
    if (isFresher) {
      minExp = 0;
      maxExp = 1;
    } else {
      const expRangeMatch = text.match(/(\d+)\s*[-–to]+\s*(\d+)\s*\+?\s*years?/i);
      const expPlusMatch = text.match(/(\d+)\s*\+?\s*years?/i);
      
      if (expRangeMatch) {
        minExp = parseInt(expRangeMatch[1], 10);
        maxExp = parseInt(expRangeMatch[2], 10);
      } else if (expPlusMatch) {
        minExp = parseInt(expPlusMatch[1], 10);
        maxExp = minExp + 3;
      } else {
        minExp = 0;
        maxExp = 2;
      }
    }

    // 5. Extract Skills (Explicit Skills line + Dictionary matching)
    const extractedSkills = new Set();

    // Check for explicit "Skills:" line in text
    const skillsLineMatch = text.match(/(?:skills|key skills|required skills|technologies)\s*:\s*([^\n\r]+)/i);
    if (skillsLineMatch) {
      const rawSkillsStr = skillsLineMatch[1].replace(/\.$/, '');
      const parts = rawSkillsStr.split(/[,&/|]|\band\b/i).map(s => s.trim()).filter(Boolean);
      parts.forEach(s => {
        const cleaned = s.replace(/^[•*\-\s]+|[.\s]+$/g, '');
        if (cleaned && cleaned.length < 40) {
          extractedSkills.add(cleaned);
        }
      });
    }

    // Also match against expanded Skill Dictionary
    const SKILL_DICT = [
      'Data Analysis', 'Data Analytics', 'Excel', 'SQL', 'Data Visualization', 'Problem Solving',
      'Power BI', 'Tableau', 'Python', 'R', 'Machine Learning', 'Statistics', 'Analytical Skills',
      'Communication', 'React', 'Node.js', 'TypeScript', 'JavaScript', 'Java', 'C++', 'Go', 'Rust',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Docker', 'Kubernetes',
      'AWS', 'GCP', 'Azure', 'System Design', 'Distributed Systems', 'Tailwind', 'Next.js',
      'Vue', 'Angular', 'A/B Testing', 'Product Strategy', 'Agile', 'Scrum', 'Figma'
    ];

    SKILL_DICT.forEach(skill => {
      const regex = new RegExp(`\\b${skill.replace('+', '\\+')}\\b`, 'i');
      if (regex.test(text)) {
        extractedSkills.add(skill);
      }
    });

    const finalSkillsList = Array.from(extractedSkills);
    if (finalSkillsList.length === 0) {
      finalSkillsList.push('Problem Solving', 'Communication', 'Teamwork');
    }

    // 6. Responsibilities
    const responsibilities = lines.filter(l => l.startsWith('-') || l.startsWith('•') || l.startsWith('*')).slice(0, 4)
      .map(l => l.replace(/^[-•*]\s*/, ''));
    if (responsibilities.length === 0) {
      responsibilities.push(
        `Collaborate with team members to achieve project milestones.`,
        `Analyze data insights and streamline operational workflows.`,
        `Deliver high quality results adhering to organization guidelines.`
      );
    }

    return {
      job_title: jobTitle,
      company_name: companyName,
      required_skills: finalSkillsList,
      experience_min_years: minExp,
      experience_max_years: maxExp,
      location: location,
      employment_type: /contract/i.test(text) ? 'Contract' : 'Full-time',
      responsibilities: responsibilities,
      qualifications: [
        minExp === 0 ? 'Freshers / Graduates eligible to apply' : `${minExp}+ years of relevant industry experience`,
        `Proficiency with ${finalSkillsList.slice(0, 3).join(', ')}`,
        `Strong problem solving and team collaboration skills`
      ]
    };
  }
}

module.exports = new AIJdParserService();
