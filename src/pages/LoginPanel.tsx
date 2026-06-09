import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../services/apiClient';
import { getCurrentUser, getToken, login } from '../services/authService';
import type { CurrentUser } from '../types/auth';
import type { ApiValidationErrors } from '../types/file';

interface LoginPanelProps {
  onUserChange: (user: CurrentUser | null) => void;
}

const flattenValidationErrors = (errors?: ApiValidationErrors) => {
  if (!errors) return [];

  return Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((message) => `${field}: ${message}`),
  );
};

const formatError = (error: unknown) => {
  if (error instanceof ApiError) {
    const validationMessages = flattenValidationErrors(error.errors);

    return validationMessages.length > 0
      ? `${error.message}: ${validationMessages.join(' ')}`
      : error.message;
  }

  return 'Something went wrong. Please try again.';
};

export function LoginPanel({ onUserChange }: LoginPanelProps) {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();

    if (!token) return;

    setIsLoading(true);

    getCurrentUser()
      .then(onUserChange)
      .catch(() => onUserChange(null))
      .finally(() => setIsLoading(false));
  }, [onUserChange]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      onUserChange(response.user);
    } catch (loginError) {
      onUserChange(null);
      setError(formatError(loginError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#4338ca_0%,transparent_30%),radial-gradient(circle_at_bottom_right,#0891b2_0%,transparent_30%)]" />

      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4s-3 1.567-3 3.5S10.343 11 12 11zm0 2c-2.761 0-5 2.239-5 5v1h10v-1c0-2.761-2.239-5-5-5z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in to continue to your account
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email Address
            </label>

            <input
              type="email"
              required
              value={email}
              placeholder="you@example.com"
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              placeholder="••••••••"
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}

            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-slate-400">
            Secure authentication powered by your API
          </p>
        </div>
      </section>
    </div>
  );
}