-- Inactivity Penalty System
-- Migration: Add inactivity penalty settings and tracking tables

-- ============================================================================
-- Table: ladder_inactivity_settings
-- Stores inactivity penalty configuration per ladder
-- ============================================================================
CREATE TABLE IF NOT EXISTS ladder_inactivity_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ladder_id UUID NOT NULL REFERENCES ladders(id) ON DELETE CASCADE,
  
  -- Master switch
  enabled BOOLEAN DEFAULT false,
  
  -- Calculation method
  calculation_method VARCHAR(20) DEFAULT 'rolling_30_days',
    -- Options: 'calendar_month', 'rolling_30_days', 'rolling_custom'
  
  -- Thresholds
  threshold_days INTEGER DEFAULT 30,
  new_member_grace_days INTEGER DEFAULT 14,
  
  -- Penalty configuration
  penalty_type VARCHAR(20) DEFAULT 'rank_drop',
    -- Options: 'rank_drop', 'percentage_drop', 'point_deduction', 'relegation', 'removal'
  penalty_severity INTEGER DEFAULT 3,
  penalty_frequency VARCHAR(20) DEFAULT 'once',
    -- Options: 'once', 'recurring_monthly', 'recurring_period'
  
  -- Protection floor
  floor_enabled BOOLEAN DEFAULT true,
  floor_type VARCHAR(20) DEFAULT 'percentage',
    -- Options: 'rank_position', 'percentage', 'division'
  floor_value INTEGER DEFAULT 50,
  
  -- Notifications
  notify_before_penalty BOOLEAN DEFAULT true,
  notification_days_before INTEGER DEFAULT 7,
  
  -- Leave system
  leave_system_enabled BOOLEAN DEFAULT true,
  max_vacation_leaves_per_year INTEGER DEFAULT 2,
  max_injury_leaves_per_year INTEGER DEFAULT 3,
  max_work_leaves_per_year INTEGER DEFAULT 2,
  max_personal_leaves_per_year INTEGER DEFAULT 2,
  
  -- Edge case handling
  penalty_exceeds_bottom_action VARCHAR(20) DEFAULT 'cap_at_bottom',
    -- Options: 'cap_at_bottom', 'remove_from_ladder'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ladder_id)
);

CREATE INDEX idx_ladder_inactivity_ladder ON ladder_inactivity_settings(ladder_id);

-- ============================================================================
-- Table: member_inactivity_tracking
-- Tracks inactivity status for each member
-- ============================================================================
CREATE TABLE IF NOT EXISTS member_inactivity_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ladder_id UUID NOT NULL REFERENCES ladders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tracking
  last_match_completed_at TIMESTAMPTZ,
  last_penalty_applied_at TIMESTAMPTZ,
  total_penalties_applied INTEGER DEFAULT 0,
  
  -- Leave of absence
  on_leave BOOLEAN DEFAULT false,
  leave_type VARCHAR(20),
    -- Options: 'vacation', 'injury', 'work_travel', 'personal'
  leave_started_at TIMESTAMPTZ,
  leave_reason TEXT,
  
  -- Penalty history
  positions_lost_to_inactivity INTEGER DEFAULT 0,
  original_rank_before_penalties INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ladder_id, user_id)
);

CREATE INDEX idx_member_inactivity_ladder_user ON member_inactivity_tracking(ladder_id, user_id);
CREATE INDEX idx_member_inactivity_last_match ON member_inactivity_tracking(last_match_completed_at);
CREATE INDEX idx_member_inactivity_on_leave ON member_inactivity_tracking(on_leave);

-- ============================================================================
-- Table: member_leave_history
-- Tracks leave usage for yearly limits
-- ============================================================================
CREATE TABLE IF NOT EXISTS member_leave_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ladder_id UUID NOT NULL REFERENCES ladders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Leave details
  leave_type VARCHAR(20) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_history_user_ladder ON member_leave_history(user_id, ladder_id);
CREATE INDEX idx_leave_history_year ON member_leave_history(EXTRACT(YEAR FROM started_at));

-- ============================================================================
-- Table: inactivity_penalty_log
-- Audit log of all penalties applied
-- ============================================================================
CREATE TABLE IF NOT EXISTS inactivity_penalty_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ladder_id UUID NOT NULL REFERENCES ladders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Penalty details
  penalty_type VARCHAR(20) NOT NULL,
  penalty_severity INTEGER NOT NULL,
  rank_before INTEGER NOT NULL,
  rank_after INTEGER NOT NULL,
  positions_dropped INTEGER NOT NULL,
  
  -- Context
  days_inactive INTEGER NOT NULL,
  last_match_date TIMESTAMPTZ,
  reason TEXT,
  capped_at_bottom BOOLEAN DEFAULT false,
  capped_at_floor BOOLEAN DEFAULT false,
  
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inactivity_log_ladder ON inactivity_penalty_log(ladder_id);
CREATE INDEX idx_inactivity_log_user ON inactivity_penalty_log(user_id);
CREATE INDEX idx_inactivity_log_applied ON inactivity_penalty_log(applied_at);

-- ============================================================================
-- Function: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_ladder_inactivity_settings_updated_at
  BEFORE UPDATE ON ladder_inactivity_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_inactivity_tracking_updated_at
  BEFORE UPDATE ON member_inactivity_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Initialize inactivity tracking for new members
-- ============================================================================
CREATE OR REPLACE FUNCTION initialize_member_inactivity_tracking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO member_inactivity_tracking (ladder_id, user_id)
  VALUES (NEW.ladder_id, NEW.user_id)
  ON CONFLICT (ladder_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create tracking when member joins ladder
CREATE TRIGGER auto_initialize_inactivity_tracking
  AFTER INSERT ON ladder_memberships
  FOR EACH ROW
  EXECUTE FUNCTION initialize_member_inactivity_tracking();

-- ============================================================================
-- Function: Update last_match_completed_at when match is confirmed
-- ============================================================================
CREATE OR REPLACE FUNCTION update_last_match_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Confirmed' AND (OLD.status IS NULL OR OLD.status != 'Confirmed') THEN
    -- Update for player1
    UPDATE member_inactivity_tracking
    SET last_match_completed_at = NEW.played_at
    WHERE ladder_id = NEW.ladder_id AND user_id = NEW.player1_id;
    
    -- Update for player2
    UPDATE member_inactivity_tracking
    SET last_match_completed_at = NEW.played_at
    WHERE ladder_id = NEW.ladder_id AND user_id = NEW.player2_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last match date
CREATE TRIGGER auto_update_last_match_completed
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_last_match_completed();

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- ladder_inactivity_settings
ALTER TABLE ladder_inactivity_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inactivity settings"
  ON ladder_inactivity_settings FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage inactivity settings"
  ON ladder_inactivity_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ladder_leaders
      WHERE ladder_leaders.ladder_id = ladder_inactivity_settings.ladder_id
      AND ladder_leaders.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- member_inactivity_tracking
ALTER TABLE member_inactivity_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inactivity tracking"
  ON member_inactivity_tracking FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own leave status"
  ON member_inactivity_tracking FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can manage inactivity tracking"
  ON member_inactivity_tracking FOR ALL
  USING (true);

-- member_leave_history
ALTER TABLE member_leave_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leave history"
  ON member_leave_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can view leave history for their ladders"
  ON member_leave_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ladder_leaders
      WHERE ladder_leaders.ladder_id = member_leave_history.ladder_id
      AND ladder_leaders.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage leave history"
  ON member_leave_history FOR ALL
  USING (true);

-- inactivity_penalty_log
ALTER TABLE inactivity_penalty_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own penalty log"
  ON inactivity_penalty_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can view penalty logs for their ladders"
  ON inactivity_penalty_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ladder_leaders
      WHERE ladder_leaders.ladder_id = inactivity_penalty_log.ladder_id
      AND ladder_leaders.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create penalty logs"
  ON inactivity_penalty_log FOR INSERT
  USING (true);
