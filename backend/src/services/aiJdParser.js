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
    
    // Extract Title (first line or line with "Engineer", "Manager", etc.)
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let jobTitle = lines[0] || 'Software Engineer';
    const titleMatch = lines.find(l => /engineer|manager|architect|developer|designer|lead|analyst|specialist/i.test(l));
    if (titleMatch && titleMatch.length < 80) {
      jobTitle = titleMatch;
    }

    // Extract Skills using dictionary keyword search
    const SKILL_DICT = [
      'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Docker', 'Kubernetes',
      'AWS', 'GCP', 'Azure', 'System Design', 'Distributed Systems', 'Tailwind', 'Next.js',
      'Vue', 'Angular', 'A/B Testing', 'Product Strategy', 'SQL', 'Agile', 'Scrum', 'Figma'
    ];

    const foundSkills = SKILL_DICT.filter(skill => {
      const regex = new RegExp(`\\b${skill.replace('+', '\\+')}\\b`, 'i');
      return regex.test(text);
    });

    if (foundSkills.length === 0) {
      foundSkills.push('JavaScript', 'Problem Solving', 'Teamwork');
    }

    // Extract Experience Years
    let minExp = 2;
    let maxExp = 6;
    const expMatch = text.match(/(\d+)\s*[-–to]+\s*(\d+)\s*\+?\s*years?/i) || text.match(/(\d+)\s*\+?\s*years?/i);
    if (expMatch) {
      if (expMatch[2]) {
        minExp = parseInt(expMatch[1], 10);
        maxExp = parseInt(expMatch[2], 10);
      } else {
        minExp = parseInt(expMatch[1], 10);
        maxExp = minExp + 4;
      }
    }

    // Extract Location
    let location = 'Remote / Hybrid';
    if (/san francisco|sf/i.test(text)) location = 'San Francisco, CA (Hybrid)';
    else if (/new york|nyc/i.test(text)) location = 'New York, NY (Hybrid)';
    else if (/seattle/i.test(text)) location = 'Seattle, WA (Hybrid)';
    else if (/remote/i.test(text)) location = 'Remote';

    // Responsibilities and Qualifications
    const responsibilities = lines.filter(l => l.startsWith('-') || l.startsWith('•') || l.startsWith('*')).slice(0, 4)
      .map(l => l.replace(/^[-•*]\s*/, ''));
    if (responsibilities.length === 0) {
      responsibilities.push(
        `Architect and scale systems supporting core business initiatives.`,
        `Collaborate with cross-functional teams to design high-quality software solutions.`,
        `Participate in code reviews, design docs, and operational telemetry.`
      );
    }

    return {
      job_title: jobTitle,
      required_skills: foundSkills,
      experience_min_years: minExp,
      experience_max_years: maxExp,
      location: location,
      employment_type: /contract/i.test(text) ? 'Contract' : 'Full-time',
      responsibilities: responsibilities,
      qualifications: [
        `${minExp}+ years of relevant industry experience in software or product engineering`,
        `Proficiency with ${foundSkills.slice(0, 3).join(', ')}`,
        `Strong analytical problem solving and communication skills`
      ]
    };
  }
}

module.exports = new AIJdParserService();
