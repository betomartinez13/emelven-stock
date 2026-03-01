import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';

export function useAuth() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión cerrada');
  };

  return { user, logout: handleLogout, isAuthenticated: isAuthenticated() };
}
