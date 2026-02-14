import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/AuthProvider';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import OnboardingPage from './features/auth/OnboardingPage';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import RoomListPage from './features/rooms/RoomListPage';
import RoomPage from './features/rooms/RoomPage';
import GamesPage from './features/games/GamesPage';
import FriendsPage from './features/friends/FriendsPage';
import AppreciationPage from './features/appreciation/AppreciationPage';
import LeaderboardPage from './features/leaderboard/LeaderboardPage';
import ActivityPage from './features/activity/ActivityPage';
import RoomHistoryPage from './features/rooms/RoomHistoryPage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/rooms" element={<RoomListPage />} />
              <Route path="/rooms/:id" element={<RoomPage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/appreciation" element={<AppreciationPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/room-history" element={<RoomHistoryPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
