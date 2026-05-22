import { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import AuthLayout from './modules/auth/AuthLayout';
import LoginPage from './modules/auth/LoginPage';
import RegisterPage from './modules/auth/RegisterPage';

import { useAuthStore } from './modules/auth/store';

import DashboardPage from './modules/dashboard/DashboardPage';
import WhiteboardPage from './modules/board/components/WhiteboardPage';

import MyTasksPage from './modules/dashboard/pages/MyTasksPage';

import CalendarPage from './modules/dashboard/pages/CalendarPage';
import TimesheetPage from './modules/dashboard/pages/TimesheetPage';
import MembersPage from './modules/dashboard/pages/MembersPage';
import ChatsPage from './modules/dashboard/pages/ChatsPage';
import SettingsPage from './modules/dashboard/pages/SettingsPage';
import { useUIStore, applyTheme } from './store/useUIStore';

/* ---------------- PROTECTED ROUTE ---------------- */

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated =
    useAuthStore(
      (state) => state.isAuthenticated
    );

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <>{children}</>;
}

/* ---------------- APP ---------------- */

function App() {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <BrowserRouter>

      <Routes>

        {/* AUTH ROUTES */}
        <Route element={<AuthLayout />}>

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />
        </Route>

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* WHITEBOARD */}
        <Route
          path="/board/:taskId"
          element={
            <ProtectedRoute>
              <WhiteboardPage />
            </ProtectedRoute>
          }
        />


        {/* MY TASKS */}
        <Route
          path="/my-tasks"
          element={
            <ProtectedRoute>
              <MyTasksPage />
            </ProtectedRoute>
          }
        />

        {/* CALENDAR */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        {/* TIMESHEET */}
        <Route
          path="/timesheet"
          element={
            <ProtectedRoute>
              <TimesheetPage />
            </ProtectedRoute>
          }
        />

        {/* MEMBERS */}
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <MembersPage />
            </ProtectedRoute>
          }
        />

        {/* CHATS */}
        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <ChatsPage />
            </ProtectedRoute>
          }
        />

        {/* SETTINGS */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* DEFAULT */}
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;