-- email_connections 테이블 생성
CREATE TABLE IF NOT EXISTS email_connections (
  provider VARCHAR(50) PRIMARY KEY,
  email_address VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_synced_at VARCHAR(100)
);

-- Row Level Security 활성화
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;

-- 익명/퍼블릭 사용자를 위한 CRUD 정책 설정 (데모 프로젝트 목적)
CREATE POLICY "Allow public select on email_connections" ON email_connections FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert on email_connections" ON email_connections FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update on email_connections" ON email_connections FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow public delete on email_connections" ON email_connections FOR DELETE TO anon USING (true);
