-- Points summary view
CREATE MATERIALIZED VIEW points_summary AS
SELECT 
  student_id,
  type,
  SUM(amount) as total_points,
  COUNT(*) as total_activities,
  MAX(created_at) as last_activity
FROM points
GROUP BY student_id, type;

-- Achievement progress view
CREATE MATERIALIZED VIEW achievement_progress AS
SELECT 
  u.id as user_id,
  a.id as achievement_id,
  a.type,
  a.criteria->>'metric' as metric,
  a.criteria->>'threshold' as threshold,
  CASE 
    WHEN p.total_points >= (a.criteria->>'threshold')::int THEN true 
    ELSE false 
  END as completed
FROM users u
CROSS JOIN achievements a
LEFT JOIN points_summary p ON p.student_id = u.id;

-- Leaderboard cache view
CREATE MATERIALIZED VIEW leaderboard_cache AS
SELECT 
  l.id as leaderboard_id,
  u.id as user_id,
  u.name,
  COALESCE(p.total_points, 0) as points,
  COALESCE(a.completed_count, 0) as achievements,
  ROW_NUMBER() OVER (
    PARTITION BY l.id 
    ORDER BY 
      CASE l.type 
        WHEN 'points' THEN p.total_points 
        WHEN 'achievements' THEN a.completed_count
      END DESC
  ) as rank
FROM leaderboards l
CROSS JOIN users u
LEFT JOIN points_summary p ON p.student_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as completed_count
  FROM achievement_progress
  WHERE completed = true
  GROUP BY user_id
) a ON a.user_id = u.id;

-- Create indexes
CREATE UNIQUE INDEX idx_points_summary_student_type 
ON points_summary(student_id, type);

CREATE UNIQUE INDEX idx_achievement_progress_user_achievement 
ON achievement_progress(user_id, achievement_id);

CREATE UNIQUE INDEX idx_leaderboard_cache_board_user 
ON leaderboard_cache(leaderboard_id, user_id);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_gamification_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY points_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY achievement_progress;
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh
SELECT cron.schedule(
  'refresh-gamification-views',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT refresh_gamification_views()'
); 