import { useState } from 'react';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../../../store/authStore';

export const useLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuthData = useAuthStore((state) => state.setAuthData);

  const isValidEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  const isFormValid = isValidEmail(email) && password.length >= 4;

  const handleLogin = async () => {
    if (!isFormValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.login({
        email: email.trim(),
        password,
      });

      if (!response.accessToken) {
        throw new Error('No access token returned from backend auth service');
      }

      await setAuthData(response.user, response.accessToken, response.refreshToken);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    setError,
    isFormValid,
    handleLogin,
  };
};
