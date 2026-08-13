const db = require('./db');
const bcrypt = require('bcryptjs');

const initDb = async () => {
  console.log('Initializing database schema and seed data...');

  if (db.type === 'sqlite') {
    db.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT UNIQUE NOT NULL,
        ats_type TEXT DEFAULT 'none',
        ats_api_key_encrypted TEXT,
        portal_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        job_title TEXT NOT NULL,
        department TEXT,
        verification_status TEXT DEFAULT 'pending',
        verified_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_seekers (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        headline TEXT,
        bio TEXT,
        phone TEXT,
        location TEXT,
        resume_url TEXT,
        parsed_profile TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_postings (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        location TEXT,
        employment_type TEXT,
        raw_jd_text TEXT,
        structured_fields TEXT NOT NULL,
        status TEXT DEFAULT 'published',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS referral_requests (
        id TEXT PRIMARY KEY,
        seeker_id TEXT NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
        job_posting_id TEXT NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        match_score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'applied',
        ats_referral_id TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        payload TEXT,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ats_logs (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        referral_request_id TEXT REFERENCES referral_requests(id) ON DELETE CASCADE,
        ats_type TEXT NOT NULL,
        status TEXT NOT NULL,
        response_payload TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Check if seed data exists
  const existingUsers = await db.getAll('SELECT * FROM users LIMIT 1');
  if (existingUsers.length > 0) {
    console.log('Seed data already present. Skipping seed.');
    return;
  }

  console.log('Seeding initial demo data...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Companies
  const companies = [
    {
      id: 'comp_stripe',
      name: 'Stripe',
      domain: 'stripe.com',
      ats_type: 'greenhouse',
      ats_api_key_encrypted: 'demo_encrypted_key_stripe_gh',
      portal_url: 'https://stripe.com/jobs/referral'
    },
    {
      id: 'comp_google',
      name: 'Google',
      domain: 'google.com',
      ats_type: 'lever',
      ats_api_key_encrypted: 'demo_encrypted_key_google_lever',
      portal_url: 'https://careers.google.com'
    },
    {
      id: 'comp_meta',
      name: 'Meta',
      domain: 'meta.com',
      ats_type: 'none',
      ats_api_key_encrypted: null,
      portal_url: 'https://www.metacareers.com/refer'
    }
  ];

  for (const c of companies) {
    await db.query(
      `INSERT INTO companies (id, name, domain, ats_type, ats_api_key_encrypted, portal_url) VALUES ($1, $2, $3, $4, $5, $6)`,
      [c.id, c.name, c.domain, c.ats_type, c.ats_api_key_encrypted, c.portal_url]
    );
  }

  // 2. Seed Users
  const users = [
    {
      id: 'user_admin',
      email: 'admin@referalportal.com',
      password_hash: passwordHash,
      name: 'Elena Rostova (Admin)',
      phone: '+1 555-0190',
      role: 'admin',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'user_emp1',
      email: 'alex.chen@stripe.com',
      password_hash: passwordHash,
      name: 'Alex Chen',
      phone: '+1 555-0144',
      role: 'employee',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'user_emp2',
      email: 'sarah.jenkins@google.com',
      password_hash: passwordHash,
      name: 'Sarah Jenkins',
      phone: '+1 555-0188',
      role: 'employee',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'user_emp3',
      email: 'marcus.vance@meta.com',
      password_hash: passwordHash,
      name: 'Marcus Vance',
      phone: '+1 555-0133',
      role: 'employee',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'user_seeker1',
      email: 'david.kim@gmail.com',
      password_hash: passwordHash,
      name: 'David Kim',
      phone: '+1 555-0199',
      role: 'job_seeker',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'user_seeker2',
      email: 'priya.sharma@gmail.com',
      password_hash: passwordHash,
      name: 'Priya Sharma',
      phone: '+1 555-0122',
      role: 'job_seeker',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    }
  ];

  for (const u of users) {
    await db.query(
      `INSERT INTO users (id, email, password_hash, name, phone, role, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [u.id, u.email, u.password_hash, u.name, u.phone, u.role, u.avatar_url]
    );
  }

  // 3. Seed Employees
  const employees = [
    {
      id: 'emp_stripe1',
      user_id: 'user_emp1',
      company_id: 'comp_stripe',
      job_title: 'Staff Software Engineer',
      department: 'Payments Platform',
      verification_status: 'verified',
      verified_at: new Date().toISOString()
    },
    {
      id: 'emp_google1',
      user_id: 'user_emp2',
      company_id: 'comp_google',
      job_title: 'Senior Product Manager / Technical Recruiter',
      department: 'Cloud Infrastructure & HR',
      verification_status: 'verified',
      verified_at: new Date().toISOString()
    },
    {
      id: 'emp_meta1',
      user_id: 'user_emp3',
      company_id: 'comp_meta',
      job_title: 'Lead Frontend Architect',
      department: 'Reality Labs',
      verification_status: 'verified',
      verified_at: new Date().toISOString()
    }
  ];

  for (const e of employees) {
    await db.query(
      `INSERT INTO employees (id, user_id, company_id, job_title, department, verification_status, verified_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [e.id, e.user_id, e.company_id, e.job_title, e.department, e.verification_status, e.verified_at]
    );
  }

  // 4. Seed Job Seekers
  const jobSeekers = [
    {
      id: 'seeker_1',
      user_id: 'user_seeker1',
      headline: 'Senior Full Stack Engineer | React, Node.js, TypeScript, PostgreSQL',
      bio: 'Full stack developer with 5+ years of experience building high-throughput web applications.',
      phone: '+1 555-0199',
      location: 'San Francisco, CA',
      resume_url: '/demo-resumes/david_kim_resume.pdf',
      parsed_profile: JSON.stringify({
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Express', 'Redis', 'Docker', 'GraphQL', 'AWS'],
        experience_years: 5,
        education: 'B.S. Computer Science, UC Berkeley',
        summary: 'Experienced Full Stack Engineer specialized in scalable cloud APIs, React frontends, and distributed backend systems.'
      })
    },
    {
      id: 'seeker_2',
      user_id: 'user_seeker2',
      headline: 'Product Manager | AI Products & SaaS Platforms',
      bio: 'Data-driven Product Manager with 4 years leading cross-functional teams in cloud software.',
      phone: '+1 555-0122',
      location: 'New York, NY',
      resume_url: '/demo-resumes/priya_sharma_resume.pdf',
      parsed_profile: JSON.stringify({
        skills: ['Product Strategy', 'Agile / Scrum', 'SQL', 'A/B Testing', 'User Research', 'Product Analytics', 'Roadmapping', 'Python'],
        experience_years: 4,
        education: 'M.S. Information Systems, NYU',
        summary: 'Product Leader passionate about user experience, AI product innovation, and data-backed product iteration.'
      })
    }
  ];

  for (const js of jobSeekers) {
    await db.query(
      `INSERT INTO job_seekers (id, user_id, headline, bio, phone, location, resume_url, parsed_profile) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [js.id, js.user_id, js.headline, js.bio, js.phone, js.location, js.resume_url, js.parsed_profile]
    );
  }

  // 5. Seed Job Postings
  const jobPostings = [
    {
      id: 'posting_stripe_1',
      employee_id: 'emp_stripe1',
      company_id: 'comp_stripe',
      title: 'Senior Backend Engineer - Financial Infrastructure',
      location: 'San Francisco, CA (Hybrid / Remote)',
      employment_type: 'Full-time',
      raw_jd_text: `Stripe is looking for a Senior Backend Engineer to build core ledger and payment transaction engine services.
Requirements:
- 4+ years building production backends in Node.js, Go, or Java
- Deep knowledge of SQL databases (PostgreSQL, MySQL), Redis, and distributed locking
- Experience designing RESTful and GraphQL APIs
- Familiarity with TypeScript and Docker microservices`,
      structured_fields: JSON.stringify({
        job_title: 'Senior Backend Engineer - Financial Infrastructure',
        required_skills: ['Node.js', 'PostgreSQL', 'TypeScript', 'Redis', 'Docker', 'GraphQL', 'Distributed Systems'],
        experience_min_years: 4,
        experience_max_years: 8,
        location: 'San Francisco, CA (Hybrid / Remote)',
        employment_type: 'Full-time',
        responsibilities: [
          'Design and maintain high-availability financial ledger APIs processing millions of daily requests',
          'Optimize database queries and transactional consistency across payment rails',
          'Collaborate with security and frontend engineers on payment element integrations'
        ],
        qualifications: [
          '4+ years professional software development experience',
          'Strong background in SQL databases and distributed caching',
          'Experience with backend Node.js / TypeScript microservices'
        ]
      }),
      status: 'published'
    },
    {
      id: 'posting_google_1',
      employee_id: 'emp_google1',
      company_id: 'comp_google',
      title: 'Technical Product Manager - Cloud AI Platform',
      location: 'Mountain View, CA (Hybrid)',
      employment_type: 'Full-time',
      raw_jd_text: `Google Cloud is looking for a Technical Product Manager to drive developer tools and AI API platforms.
Requirements:
- 3+ years experience in technical product management for developer tools or cloud services
- Strong proficiency with SQL, Python, and API architecture analytics
- Excellent cross-functional leadership and roadmap execution skills`,
      structured_fields: JSON.stringify({
        job_title: 'Technical Product Manager - Cloud AI Platform',
        required_skills: ['Product Strategy', 'SQL', 'Python', 'A/B Testing', 'Product Analytics', 'Cloud Architecture'],
        experience_min_years: 3,
        experience_max_years: 7,
        location: 'Mountain View, CA (Hybrid)',
        employment_type: 'Full-time',
        responsibilities: [
          'Lead product strategy and execution for developer-facing Cloud AI services',
          'Define key metrics, telemetry, and developer experience feedback loops',
          'Partner with engineering managers to deliver Quarterly AI capability roadmaps'
        ],
        qualifications: [
          '3+ years in software product management',
          'Hands-on comfort with SQL data analysis and REST API specs',
          'Track record of launching developer products at scale'
        ]
      }),
      status: 'published'
    },
    {
      id: 'posting_meta_1',
      employee_id: 'emp_meta1',
      company_id: 'comp_meta',
      title: 'Staff Frontend Engineer - Web Experience',
      location: 'Menlo Park, CA / Remote',
      employment_type: 'Full-time',
      raw_jd_text: `Meta Reality Labs is hiring a Staff Frontend Engineer to lead Web UI design systems and interactive portals.
Requirements:
- 5+ years of expert React and modern Web Development experience
- Deep proficiency with JavaScript/TypeScript, CSS, Web performance, and client-side caching
- Passion for accessibility and dynamic user interface animations`,
      structured_fields: JSON.stringify({
        job_title: 'Staff Frontend Engineer - Web Experience',
        required_skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Web Performance', 'GraphQL', 'State Management'],
        experience_min_years: 5,
        experience_max_years: 10,
        location: 'Menlo Park, CA / Remote',
        employment_type: 'Full-time',
        responsibilities: [
          'Architect enterprise React UI component libraries and design tokens',
          'Optimize web bundle sizes, rendering performance, and page load latency',
          'Mentor frontend engineers across engineering org'
        ],
        qualifications: [
          '5+ years building complex web applications with React & TypeScript',
          'Strong UI/UX design sensibility and performance profiling expertise'
        ]
      }),
      status: 'published'
    }
  ];

  for (const jp of jobPostings) {
    await db.query(
      `INSERT INTO job_postings (id, employee_id, company_id, title, location, employment_type, raw_jd_text, structured_fields, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [jp.id, jp.employee_id, jp.company_id, jp.title, jp.location, jp.employment_type, jp.raw_jd_text, jp.structured_fields, jp.status]
    );
  }

  // 6. Seed Referral Request
  const referralRequests = [
    {
      id: 'req_1',
      seeker_id: 'seeker_1',
      job_posting_id: 'posting_stripe_1',
      employee_id: 'emp_stripe1',
      match_score: 92,
      status: 'under_review',
      ats_referral_id: null,
      notes: 'Strong alignment with Node.js and PostgreSQL background.'
    }
  ];

  for (const rr of referralRequests) {
    await db.query(
      `INSERT INTO referral_requests (id, seeker_id, job_posting_id, employee_id, match_score, status, ats_referral_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [rr.id, rr.seeker_id, rr.job_posting_id, rr.employee_id, rr.match_score, rr.status, rr.ats_referral_id, rr.notes]
    );
  }

  // 7. Seed Notifications
  await db.query(
    `INSERT INTO notifications (id, user_id, type, title, message, payload) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      'notif_1',
      'user_emp1',
      'NEW_REFERRAL_REQUEST',
      'New Free Referral Request!',
      'David Kim (92% match) requested a referral for Senior Backend Engineer at Stripe.',
      JSON.stringify({ requestId: 'req_1', seekerName: 'David Kim' })
    ]
  );

  console.log('Database initialization & seeding complete!');
};

if (require.main === module) {
  initDb().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = initDb;
