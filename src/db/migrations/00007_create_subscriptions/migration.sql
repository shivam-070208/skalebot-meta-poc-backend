-- CreateTable
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,

  contact_id UUID REFERENCES contacts (id),

  topic TEXT,

  notification_token TEXT,

  subscribed BOOLEAN DEFAULT true,

  subscribed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_contact_id ON subscriptions (contact_id);
CREATE INDEX idx_subscriptions_topic ON subscriptions (topic);
CREATE INDEX idx_subscriptions_contact_id_topic ON subscriptions (contact_id, topic);
CREATE INDEX idx_subscriptions_subscribed ON subscriptions (subscribed);
