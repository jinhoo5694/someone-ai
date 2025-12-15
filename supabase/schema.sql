-- 유저 테이블
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  email_verified boolean default false,
  nickname text,
  profile jsonb default null,
  created_at timestamptz default now(),
  last_active_at timestamptz
);

-- 프로필 컬럼 추가 (기존 테이블용)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS profile JSONB DEFAULT NULL;

-- 이메일 인증 토큰 테이블
create table if not exists email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- 대화 테이블 (JSONB로 메시지 저장)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  character_id text not null,
  messages jsonb default '[]',
  message_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 일일 사용량 테이블
create table if not exists daily_usage (
  user_id uuid references users(id) on delete cascade,
  date date default current_date,
  message_count int default 0,
  premium_clicks int default 0,
  primary key (user_id, date)
);

-- 인덱스
create index if not exists idx_users_email on users(email);
create index if not exists idx_email_verifications_token on email_verifications(token);
create index if not exists idx_email_verifications_email on email_verifications(email);
create index if not exists idx_conversations_user_character
  on conversations(user_id, character_id);
create index if not exists idx_daily_usage_date
  on daily_usage(date);
