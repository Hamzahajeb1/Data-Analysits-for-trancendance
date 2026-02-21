-- Copy of migration content
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  profile_picture VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score1 INT NOT NULL DEFAULT 0,
  score2 INT NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp);

-- Insert Dummy Data
INSERT INTO users (id, email, username) VALUES 
('11111111-1111-1111-1111-111111111111', 'user1@example.com', 'UserOne'),
('22222222-2222-2222-2222-222222222222', 'user2@example.com', 'UserTwo')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_stats (user_id, total_wins, total_losses) VALUES
('11111111-1111-1111-1111-111111111111', 5, 2),
('22222222-2222-2222-2222-222222222222', 2, 5)
ON CONFLICT (user_id) DO NOTHING;

-- Sample matches
INSERT INTO matches (player1_id, player2_id, score1, score2, duration, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 11, 5, 300, NOW() - INTERVAL '1 day'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 8, 11, 420, NOW() - INTERVAL '2 days'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 11, 9, 380, NOW() - INTERVAL '3 days'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 11, 7, 350, NOW() - INTERVAL '4 days'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 11, 3, 250, NOW() - INTERVAL '5 days');

-- Sample user activity
INSERT INTO user_activity (user_id, action, timestamp) VALUES
('11111111-1111-1111-1111-111111111111', 'login', NOW() - INTERVAL '1 hour'),
('11111111-1111-1111-1111-111111111111', 'match_played', NOW() - INTERVAL '1 day'),
('22222222-2222-2222-2222-222222222222', 'login', NOW() - INTERVAL '2 hours'),
('22222222-2222-2222-2222-222222222222', 'match_played', NOW() - INTERVAL '2 days'),
('11111111-1111-1111-1111-111111111111', 'login', NOW() - INTERVAL '3 days'),
('11111111-1111-1111-1111-111111111111', 'match_played', NOW() - INTERVAL '3 days'),
('22222222-2222-2222-2222-222222222222', 'login', NOW() - INTERVAL '4 days');
