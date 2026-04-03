import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { register as registerService } from '../api/services';
import { useAuth } from '../context/useAuth';

interface AuthPageProps {
  mode: 'login' | 'register';
}

const AuthPage = ({ mode }: AuthPageProps) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const validate = (): string | null => {
    if (!username.trim()) {
      return 'Username is required.';
    }

    if (isRegister && !email.trim()) {
      return 'Email is required.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await registerService({ username: username.trim(), email: email.trim(), password });
      }

      await login({ username: username.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 text-white">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/30">
        <h1 className="text-2xl font-bold">{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {isRegister ? 'Register to start classifying algorithmic questions.' : 'Log in to continue.'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="username" className="mb-1 block text-sm text-gray-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 outline-none ring-indigo-500 transition focus:ring-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {isRegister && (
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 outline-none ring-indigo-500 transition focus:ring-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 outline-none ring-indigo-500 transition focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>

          {error && <p className="rounded-md border border-red-700 bg-red-950/40 p-2 text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-400">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link
            to={isRegister ? '/login' : '/register'}
            className="font-medium text-indigo-300 hover:text-indigo-200"
          >
            {isRegister ? 'Login' : 'Register'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
