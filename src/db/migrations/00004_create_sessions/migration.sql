-- CreateTable
CREATE TABLE sessions (
  id UUID PRIMARY KEY,

  contact_id UUID REFERENCES contacts (id),

  opened_at TIMESTAMP,
  expires_at TIMESTAMP,

  status TEXT DEFAULT 'active',

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_contact_id ON sessions (contact_id);
CREATE INDEX idx_sessions_status ON sessions (status);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX idx_sessions_contact_id_status ON sessions (contact_id, status);
