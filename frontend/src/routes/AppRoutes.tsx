import type { ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import LandingPage from "../pages/LandingPage";
import QuestionsFoldersPage from "../pages/QuestionsFoldersPage";
import FolderDetailsPage from "../pages/FolderDetailsPage";

/**
 * Higher-Order Component to protect routes that require authentication.
 */
const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

/**
 * Higher-Order Component to restrict routes (like login/register) to unauthenticated users.
 */
const PublicOnlyRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AuthPage mode="login" />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <AuthPage mode="register" />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ask"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Route for displaying the folders overview */}
      <Route
        path="/questions"
        element={
          <ProtectedRoute>
            <QuestionsFoldersPage />
          </ProtectedRoute>
        }
      />

      {/* Dynamic route for individual folder details. */}
      <Route
        path="/questions/folder/:slug"
        element={
          <ProtectedRoute>
            <FolderDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route to redirect unrecognized URLs back to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
