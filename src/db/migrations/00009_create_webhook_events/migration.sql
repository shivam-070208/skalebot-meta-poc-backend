-- CreateTable
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,

  event_type TEXT,

  payload JSONB,

  processed BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_events_event_type ON webhook_events (event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events (processed);
CREATE INDEX idx_webhook_events_created_at ON webhook_events (created_at);
CREATE INDEX idx_webhook_events_processed_created_at ON webhook_events (processed, created_at);
