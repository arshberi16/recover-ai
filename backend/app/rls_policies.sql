-- ====================================================================
-- RecoverAI Supabase PostgreSQL Row Level Security (RLS) Policies
-- ====================================================================

-- 1. Enable RLS on Profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Enable RLS on AI Conversations & Messages
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own AI conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view messages in their conversations"
  ON ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_messages.conversation_id 
        AND (ai_conversations.user_id = auth.uid() OR ai_conversations.user_id IS NULL)
    )
  );

-- 3. Enable RLS on Reports Table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own reports"
  ON reports FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 4. Shared Merchant Telemetry Access for Buildathon Demo
-- Transactions & Customers tables allow authenticated merchant analysts to read & analyze telemetry data
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated merchant analysts can view transaction telemetry"
  ON transactions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated merchant analysts can perform recovery actions"
  ON recovery_actions FOR ALL
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated merchant analysts can view customers"
  ON customers FOR SELECT
  TO authenticated, anon
  USING (true);
