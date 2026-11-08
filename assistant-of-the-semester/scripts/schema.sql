-- Assistant of the Semester DSP — schema aman untuk database baru dan migrasi dari versi kelas.
-- Data voting lama dipertahankan. Baris kelas lama tanpa program_name tidak tampil dalam pilihan DSP.
CREATE TABLE IF NOT EXISTS classes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS program_name VARCHAR(100);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS group_number INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS uq_classes_program_group
  ON classes (LOWER(program_name), group_number) WHERE program_name IS NOT NULL;
ALTER TABLE classes DROP CONSTRAINT IF EXISTS ck_positive_group;
ALTER TABLE classes ADD CONSTRAINT ck_positive_group CHECK (group_number IS NULL OR group_number BETWEEN 1 AND 999);

CREATE TABLE IF NOT EXISTS voters (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  name VARCHAR(180) NOT NULL,
  nim VARCHAR(32),
  pin_hash TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_voter_per_class UNIQUE (class_id, name)
);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS nim VARCHAR(32);
CREATE UNIQUE INDEX IF NOT EXISTS uq_voters_nim ON voters(nim) WHERE nim IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_voters_class_name_ci ON voters(class_id, LOWER(name));
CREATE INDEX IF NOT EXISTS ix_voters_class_id ON voters(class_id);

CREATE TABLE IF NOT EXISTS assistants (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  photo_url TEXT NOT NULL DEFAULT '',
  description VARCHAR(280) NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ballots (
  id BIGSERIAL PRIMARY KEY,
  voter_id BIGINT NOT NULL UNIQUE REFERENCES voters(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ballot_choices (
  ballot_id BIGINT NOT NULL REFERENCES ballots(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL CHECK (category IN ('terfavorit','terkagum','terasik','terdingin')),
  assistant_id BIGINT NOT NULL REFERENCES assistants(id) ON DELETE RESTRICT,
  PRIMARY KEY (ballot_id, category)
);
CREATE INDEX IF NOT EXISTS ix_choices_category_assistant ON ballot_choices(category,assistant_id);
CREATE TABLE IF NOT EXISTS settings (key VARCHAR(100) PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO settings(key,value) VALUES('voting_open','false') ON CONFLICT(key) DO NOTHING;
