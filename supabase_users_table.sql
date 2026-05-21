ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- documents 테이블 정책
CREATE POLICY "Allow public select on documents" ON documents FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert on documents" ON documents FOR INSERT TO anon WITH CHECK (true);

-- cards 테이블 정책
CREATE POLICY "Allow public select on cards" ON cards FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert on cards" ON cards FOR INSERT TO anon WITH CHECK (true);

-- users 테이블 정책
CREATE POLICY "Allow public select on users" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert on users" ON users FOR INSERT TO anon WITH CHECK (true);
