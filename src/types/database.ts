export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    display_name: string;
                    avatar_url: string | null;
                    bio: string;
                    current_mood: string | null;
                    xp: number;
                    teaching_xp: number;
                    room_coins: number;
                    subject_expertise: string[];
                    expertise: string[];
                    is_online: boolean;
                    onboarding_completed: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    display_name?: string;
                    avatar_url?: string | null;
                    bio?: string;
                    current_mood?: string | null;
                    xp?: number;
                    teaching_xp?: number;
                    room_coins?: number;
                    subject_expertise?: string[];
                    expertise?: string[];
                    is_online?: boolean;
                    onboarding_completed?: boolean;
                };
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
            };
            friendships: {
                Row: {
                    id: string;
                    user_id: string;
                    friend_id: string;
                    status: 'pending' | 'accepted' | 'declined' | 'blocked';
                    kindness_score: number;
                    help_score: number;
                    collaboration_score: number;
                    friendship_score: number;
                    streak_days: number;
                    last_interaction_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    friend_id: string;
                    status?: 'pending' | 'accepted' | 'declined' | 'blocked';
                };
                Update: Partial<Database['public']['Tables']['friendships']['Insert']> & {
                    kindness_score?: number;
                    help_score?: number;
                    collaboration_score?: number;
                    streak_days?: number;
                    last_interaction_at?: string;
                };
            };
            study_rooms: {
                Row: {
                    id: string;
                    name: string;
                    room_type: 'silent' | 'doubt_solving' | 'group_revision' | 'exam_night';
                    subject: string | null;
                    topic: string | null;
                    host_id: string;
                    room_code: string;
                    max_members: number;
                    is_active: boolean;
                    timer_duration: number;
                    break_duration: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    name: string;
                    room_type?: 'silent' | 'doubt_solving' | 'group_revision' | 'exam_night';
                    subject?: string;
                    topic?: string;
                    host_id: string;
                    max_members?: number;
                    timer_duration?: number;
                    break_duration?: number;
                };
                Update: Partial<Database['public']['Tables']['study_rooms']['Insert']> & {
                    is_active?: boolean;
                };
            };
            room_members: {
                Row: {
                    id: string;
                    room_id: string;
                    user_id: string;
                    role: 'host' | 'member' | 'mentor';
                    joined_at: string;
                    left_at: string | null;
                };
                Insert: {
                    room_id: string;
                    user_id: string;
                    role?: 'host' | 'member' | 'mentor';
                };
                Update: {
                    role?: 'host' | 'member' | 'mentor';
                    left_at?: string;
                };
            };
            study_sessions: {
                Row: {
                    id: string;
                    room_id: string;
                    started_at: string;
                    ended_at: string | null;
                    session_type: 'study' | 'break' | 'game';
                    duration_minutes: number;
                };
                Insert: {
                    room_id: string;
                    session_type?: 'study' | 'break' | 'game';
                };
                Update: {
                    ended_at?: string;
                    duration_minutes?: number;
                };
            };
            doubts: {
                Row: {
                    id: string;
                    room_id: string | null;
                    requester_id: string;
                    helper_id: string | null;
                    subject: string;
                    topic: string;
                    difficulty: 'easy' | 'medium' | 'hard';
                    description: string | null;
                    status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
                    resolved_at: string | null;
                    created_at: string;
                };
                Insert: {
                    room_id?: string;
                    requester_id: string;
                    subject: string;
                    topic: string;
                    difficulty?: 'easy' | 'medium' | 'hard';
                    description?: string;
                };
                Update: {
                    helper_id?: string;
                    status?: 'open' | 'in_progress' | 'resolved' | 'cancelled';
                    resolved_at?: string;
                };
            };
            appreciations: {
                Row: {
                    id: string;
                    from_user_id: string;
                    to_user_id: string;
                    room_id: string | null;
                    message: string | null;
                    sticker_type: 'helpful' | 'patient' | 'clear_explainer' | 'motivated_me' | 'brilliant' | 'kind' | null;
                    created_at: string;
                };
                Insert: {
                    from_user_id: string;
                    to_user_id: string;
                    room_id?: string;
                    message?: string;
                    sticker_type?: 'helpful' | 'patient' | 'clear_explainer' | 'motivated_me' | 'brilliant' | 'kind';
                };
                Update: {};
            };
            game_sessions: {
                Row: {
                    id: string;
                    room_id: string | null;
                    game_type: 'quiz_battle' | 'math_duel' | 'word_chain' | 'memory_cards' | 'gk_spinner' | 'true_false';
                    created_by: string;
                    status: 'waiting' | 'playing' | 'finished';
                    started_at: string;
                    ended_at: string | null;
                };
                Insert: {
                    room_id?: string;
                    game_type: 'quiz_battle' | 'math_duel' | 'word_chain' | 'memory_cards' | 'gk_spinner' | 'true_false';
                    created_by: string;
                };
                Update: {
                    status?: 'waiting' | 'playing' | 'finished';
                    ended_at?: string;
                };
            };
            game_scores: {
                Row: {
                    id: string;
                    session_id: string;
                    user_id: string;
                    score: number;
                    is_winner: boolean;
                    coins_earned: number;
                    created_at: string;
                };
                Insert: {
                    session_id: string;
                    user_id: string;
                    score?: number;
                    is_winner?: boolean;
                    coins_earned?: number;
                };
                Update: {
                    score?: number;
                    is_winner?: boolean;
                    coins_earned?: number;
                };
            };
            room_todos: {
                Row: {
                    id: string;
                    room_id: string;
                    user_id: string;
                    text: string;
                    is_completed: boolean;
                    created_at: string;
                };
                Insert: {
                    room_id: string;
                    user_id: string;
                    text: string;
                };
                Update: {
                    text?: string;
                    is_completed?: boolean;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    type: 'friend_request' | 'doubt_help' | 'appreciation' | 'room_invite' | 'game_invite' | 'system';
                    title: string;
                    message: string | null;
                    reference_id: string | null;
                    is_read: boolean;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    type: 'friend_request' | 'doubt_help' | 'appreciation' | 'room_invite' | 'game_invite' | 'system';
                    title: string;
                    message?: string;
                    reference_id?: string;
                };
                Update: {
                    is_read?: boolean;
                };
            };
        };
    };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Friendship = Database['public']['Tables']['friendships']['Row'];
export type StudyRoom = Database['public']['Tables']['study_rooms']['Row'];
export type RoomMember = Database['public']['Tables']['room_members']['Row'];
export type StudySession = Database['public']['Tables']['study_sessions']['Row'];
export type Doubt = Database['public']['Tables']['doubts']['Row'];
export type Appreciation = Database['public']['Tables']['appreciations']['Row'];
export type GameSession = Database['public']['Tables']['game_sessions']['Row'];
export type GameScore = Database['public']['Tables']['game_scores']['Row'];
export type RoomTodo = Database['public']['Tables']['room_todos']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

export type RoomType = StudyRoom['room_type'];
export type Mood = Profile['current_mood'];
export type DoubtStatus = Doubt['status'];
export type GameType = GameSession['game_type'];
export type StickerType = NonNullable<Appreciation['sticker_type']>;
