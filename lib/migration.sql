-- Migration: Fix badges RPC, add missing columns, assign admin roles
-- Run this in Supabase SQL Editor

-- 1. Add missing columns
ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Drop broken RPC and recreate it with community_posts -> posts fix
DROP FUNCTION IF EXISTS check_and_award_badges;

CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  badge_record RECORD;
  already_earned BOOLEAN;
  new_badges JSONB := '[]'::JSONB;
  v_trade_count INT;
  v_checkin_streak INT;
  v_win_rate NUMERIC;
  v_post_count INT;
  v_checkin_count INT;
  v_total_trades INT;
  v_wins INT;
BEGIN
  -- Get user stats
  SELECT COUNT(*) INTO v_trade_count FROM trades WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_checkin_count FROM checkins WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_post_count FROM posts WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_total_trades FROM trades WHERE user_id = p_user_id AND pnl IS NOT NULL;
  SELECT COUNT(*) INTO v_wins FROM trades WHERE user_id = p_user_id AND pnl > 0;
  IF v_total_trades > 0 THEN
    v_win_rate := (v_wins::NUMERIC / v_total_trades) * 100;
  ELSE
    v_win_rate := 0;
  END IF;

  -- Get current streak
  WITH streaks AS (
    SELECT checked_in_at::DATE,
           checked_in_at::DATE - ROW_NUMBER() OVER (ORDER BY checked_in_at::DATE)::INT AS grp
    FROM checkins
    WHERE user_id = p_user_id
    GROUP BY checked_in_at::DATE
  )
  SELECT COUNT(*) INTO v_checkin_streak
  FROM (
    SELECT grp, COUNT(*)
    FROM streaks
    GROUP BY grp
    ORDER BY MAX(checked_in_at::DATE) DESC
    LIMIT 1
  ) latest_streak;

  -- Iterate all badges and award if eligible
  FOR badge_record IN SELECT * FROM badges LOOP
    SELECT EXISTS(
      SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = badge_record.id
    ) INTO already_earned;

    IF NOT already_earned THEN
      CASE badge_record.requirement_type
        WHEN 'trade_count' THEN
          IF v_trade_count >= badge_record.requirement_value THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
            new_badges := new_badges || jsonb_build_object('id', badge_record.id, 'name', badge_record.name, 'icon', badge_record.icon, 'description', badge_record.description);
          END IF;
        WHEN 'checkin_streak' THEN
          IF v_checkin_streak >= badge_record.requirement_value THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
            new_badges := new_badges || jsonb_build_object('id', badge_record.id, 'name', badge_record.name, 'icon', badge_record.icon, 'description', badge_record.description);
          END IF;
        WHEN 'win_rate' THEN
          IF v_win_rate >= badge_record.requirement_value THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
            new_badges := new_badges || jsonb_build_object('id', badge_record.id, 'name', badge_record.name, 'icon', badge_record.icon, 'description', badge_record.description);
          END IF;
        WHEN 'post_count' THEN
          IF v_post_count >= badge_record.requirement_value THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
            new_badges := new_badges || jsonb_build_object('id', badge_record.id, 'name', badge_record.name, 'icon', badge_record.icon, 'description', badge_record.description);
          END IF;
        WHEN 'psych_score' THEN
          IF v_checkin_count >= badge_record.requirement_value THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
            new_badges := new_badges || jsonb_build_object('id', badge_record.id, 'name', badge_record.name, 'icon', badge_record.icon, 'description', badge_record.description);
          END IF;
        ELSE
          NULL;
      END CASE;
    END IF;
  END LOOP;

  RETURN new_badges;
END;
$$;

-- 3. Create get_user_badges RPC
DROP FUNCTION IF EXISTS get_user_badges;
CREATE OR REPLACE FUNCTION get_user_badges(p_user_id UUID)
RETURNS TABLE (
  id INT,
  badge_id INT,
  name TEXT,
  description TEXT,
  icon TEXT,
  category TEXT,
  earned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ub.id,
    ub.badge_id,
    b.name,
    b.description,
    b.icon,
    b.category,
    ub.earned_at
  FROM user_badges ub
  JOIN badges b ON b.id = ub.badge_id
  WHERE ub.user_id = p_user_id
  ORDER BY ub.created_at DESC;
END;
$$;

-- 4. Assign admin roles
UPDATE profiles SET role = 'admin' WHERE username IN ('Sage', 'Joseph');

-- 5. Add guardrails column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guardrails JSONB DEFAULT '{"enabled": false, "maxDailyLoss": 0, "maxTradesPerDay": 0, "maxConsecutiveLosses": 0}';

-- 6. Create trade_plans table
CREATE TABLE IF NOT EXISTS trade_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  pair TEXT,
  direction TEXT,
  entry_criteria TEXT,
  stop_loss_plan TEXT,
  take_profit_plan TEXT,
  invalidation TEXT,
  management_notes TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
