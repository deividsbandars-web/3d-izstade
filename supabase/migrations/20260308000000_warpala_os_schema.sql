-- Warpala AI Construction OS - Database Schema & Security Audit
-- Date: 2026-03-08

-- ==========================================
-- 1. TABLES
-- ==========================================

-- Companies / Organizations
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT DEFAULT 'LV',
    vat TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Users & Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    email TEXT NOT NULL,
    plan TEXT DEFAULT 'free', -- free, pro, enterprise
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, active, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Project Tasks (Labour)
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT,
    cost_per_hour NUMERIC DEFAULT 0,
    hours_planned NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending'
);

-- Project Materials
CREATE TABLE IF NOT EXISTS project_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'pcs'
);

-- Quotes & Invoices
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    total_price NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'unpaid', -- unpaid, paid
    payment_link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. SECURITY (RLS)
-- ==========================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- POLICIES: Only access own company data
CREATE POLICY "company_access" ON companies FOR ALL USING (
    id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "user_profile_access" ON user_profiles FOR ALL USING (id = auth.uid());

CREATE POLICY "project_access" ON projects FOR ALL USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "client_access" ON clients FOR ALL USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "task_access" ON project_tasks FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

CREATE POLICY "material_access" ON project_materials FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
