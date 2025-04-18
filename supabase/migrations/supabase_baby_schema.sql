
-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: baby_profiles
CREATE TABLE IF NOT EXISTS baby_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_date DATE,
    birth_weight FLOAT,
    birth_height FLOAT,
    gender TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: baby_logs
CREATE TABLE IF NOT EXISTS baby_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID REFERENCES baby_profiles(id) ON DELETE CASCADE,
    log_type TEXT NOT NULL CHECK (log_type IN ('feeding', 'diaper', 'sleep', 'cry', 'bowel')),
    log_data JSONB NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: reminders
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID REFERENCES baby_profiles(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('feeding', 'diaper', 'sleep')),
    reminder_time TIMESTAMPTZ NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: health_predictions
CREATE TABLE IF NOT EXISTS health_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID REFERENCES baby_profiles(id) ON DELETE CASCADE,
    prediction_type TEXT NOT NULL,
    description TEXT,
    recommended_action JSONB,
    predicted_on TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: events_history
CREATE TABLE IF NOT EXISTS events_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID REFERENCES baby_profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
