import { Navigate, Route, Routes } from 'react-router';
import LoginPage from '@/auth/LoginPage';
import RegisterPage from '@/auth/RegisterPage';
import RequireAuth, { RequireGuest } from '@/auth/RequireAuth';
import UserMenu from '@/auth/UserMenu';
import AppLayout from '@/components/AppLayout';
import ProjectsPage from '@/projects/ProjectsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout userMenu={<UserMenu />} />}>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/projects" element={<ProjectsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Route>
    </Routes>
  );
}
