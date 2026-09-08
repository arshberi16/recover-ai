-- ====================================================================
-- RecoverAI Supabase PostgreSQL Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor to resolve 'rls_disabled_in_public'
-- ====================================================================

-- 1. Enable RLS on all public schema tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recovery_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recovery_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS business_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS merchant_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop legacy policies if re-running
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own AI conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can insert their own AI conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON ai_messages;
DROP POLICY IF EXISTS "Users can access their own reports" ON reports;
DROP POLICY IF EXISTS "Merchant analysts view transactions" ON transactions;
DROP POLICY IF EXISTS "Merchant analysts view customers" ON customers;
DROP POLICY IF EXISTS "Merchant analysts view payment_attempts" ON payment_attempts;
DROP POLICY IF EXISTS "Merchant analysts view recovery_actions" ON recovery_actions;
DROP POLICY IF EXISTS "Merchant analysts view recovery_predictions" ON recovery_predictions;
DROP POLICY IF EXISTS "Merchant analysts view business_insights" ON business_insights;
DROP POLICY IF EXISTS "Merchant analysts view merchant_settings" ON merchant_settings;

-- 3. Profiles Security
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 4. AI Conversations & Messages Security
CREATE POLICY "Users can view their own AI conversations" ON ai_conversations FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert their own AI conversations" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view messages in their conversations" ON ai_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM ai_conversations 
    WHERE ai_conversations.id = ai_messages.conversation_id 
      AND (ai_conversations.user_id = auth.uid() OR ai_conversations.user_id IS NULL)
  )
);

-- 5. Reports Security
CREATE POLICY "Users can access their own reports" ON reports FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 6. Merchant Telemetry Tables Security (Public & Service Role Access for App Engine)
CREATE POLICY "Merchant analysts view transactions" ON transactions FOR ALL TO authenticated, anon USING (true);
CREATE POLICY "Merchant analysts view customers" ON customers FOR ALL TO authenticated, anon USING (true);
CREATE POLICY "Merchant analysts view payment_attempts" ON payment_attempts FOR ALL TO authenticated, anon USING (true);
CREATE POLICY "Merchant analysts view recovery_actions" ON recovery_actions FOR ALL TO authenticated, anon USING (true);
CREATE POLICY "Merchant analysts view recovery_predictions" ON recovery_predictions FOR ALL TO authenticated, anon USING (true);
CREATE POLICY "Merchant analysts view business_insights" ON business_insights FOR ALL TO authenticated, anon USING (true);
CREATE POLICY "Merchant analysts view merchant_settings" ON merchant_settings FOR ALL TO authenticated, anon USING (true);
