-- BondBox Row Level Security Policies
-- Run AFTER 001_initial_schema.sql in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appreciations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- FRIENDSHIPS
-- ============================================
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================
-- STUDY ROOMS
-- ============================================
CREATE POLICY "Active rooms are viewable by authenticated users"
  ON public.study_rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON public.study_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their rooms"
  ON public.study_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their rooms"
  ON public.study_rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

-- ============================================
-- ROOM MEMBERS
-- ============================================
CREATE POLICY "Room members are viewable by authenticated users"
  ON public.room_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join rooms"
  ON public.room_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their membership"
  ON public.room_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON public.room_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- STUDY SESSIONS
-- ============================================
CREATE POLICY "Sessions viewable by authenticated users"
  ON public.study_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sessions"
  ON public.study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sessions"
  ON public.study_sessions FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- DOUBTS
-- ============================================
CREATE POLICY "Doubts viewable by authenticated users"
  ON public.doubts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create doubts"
  ON public.doubts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update doubts they're involved in"
  ON public.doubts FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = helper_id);

-- ============================================
-- APPRECIATIONS
-- ============================================
CREATE POLICY "Appreciations are viewable by authenticated users"
  ON public.appreciations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can send appreciations"
  ON public.appreciations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- ============================================
-- GAME SESSIONS & SCORES
-- ============================================
CREATE POLICY "Game sessions viewable by authenticated users"
  ON public.game_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create game sessions"
  ON public.game_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Game creators can update sessions"
  ON public.game_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Game scores viewable by authenticated users"
  ON public.game_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their scores"
  ON public.game_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ROOM TODOS
-- ============================================
CREATE POLICY "Room todos viewable by authenticated users"
  ON public.room_todos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create todos"
  ON public.room_todos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their todos"
  ON public.room_todos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their todos"
  ON public.room_todos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
