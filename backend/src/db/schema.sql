-- Schema for Referral Matching Platform

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('job_seeker', 'employee', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    ats_type VARCHAR(50) DEFAULT 'none',
    ats_api_key_encrypted TEXT,
    portal_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id VARCHAR(36) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_seekers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(255),
    bio TEXT,
    resume_url TEXT,
    parsed_profile TEXT, -- JSON string containing skills, experience_years, education, work_summary
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_postings (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id VARCHAR(36) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    employment_type VARCHAR(100),
    raw_jd_text TEXT,
    structured_fields TEXT NOT NULL, -- JSON string containing required_skills, experience_min_years, experience_max_years, responsibilities, qualifications
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_requests (
    id VARCHAR(36) PRIMARY KEY,
    seeker_id VARCHAR(36) NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    job_posting_id VARCHAR(36) NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    employee_id VARCHAR(36) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    match_score INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'under_review', 'referred', 'interview', 'hired', 'rejected')),
    ats_referral_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    payload TEXT, -- JSON string
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ats_logs (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    referral_request_id VARCHAR(36) REFERENCES referral_requests(id) ON DELETE CASCADE,
    ats_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    response_payload TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
