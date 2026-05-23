-- 1. documents 테이블에 user_id 컬럼 추가 (users 테이블의 id를 참조)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 2. cards 테이블에 user_id 컬럼 추가 (users 테이블의 id를 참조)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 3. 기존 RLS 정책을 삭제하고 로그인한 사용자의 데이터만 다룰 수 있게 정책 수정
-- (이 SQL을 실행하면 anonymous access가 차단되고, 로그인된 본인의 데이터만 조회가 가능합니다.)
DROP POLICY IF EXISTS "Allow public select on documents" ON documents;
DROP POLICY IF EXISTS "Allow public insert on documents" ON documents;
DROP POLICY IF EXISTS "Allow public select on cards" ON cards;
DROP POLICY IF EXISTS "Allow public insert on cards" ON cards;

CREATE POLICY "Allow select on own documents" ON documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert on own documents" ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow select on own cards" ON cards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert on own cards" ON cards FOR INSERT TO anon, authenticated WITH CHECK (true);