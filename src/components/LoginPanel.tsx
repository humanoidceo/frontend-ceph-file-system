import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../services/apiClient';
import { getCurrentUser, getToken, login } from '../services/authService';
import type { CurrentUser } from '../types/auth';
import type { ApiValidationErrors } from '../types/file';

interface LoginPanelProps {
  onUserChange: (user: CurrentUser | null) => void;
}

const flattenValidationErrors = (errors?: ApiValidationErrors) => {
  if (!errors) {
    return [];
  }

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

    if (!token) {
      return;
    }

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
    <section className="panel auth-panel login-card">
      <div className="panel-heading">
        <div>
          <h2>Login</h2>
          <p>Use Sanctum Bearer token auth for local API testing.</p>
        </div>
      </div>

      <form onSubmit={handleLogin}>
        <div className="form-grid auth-grid">
          <label>
            <span>Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        </div>

        <button className="primary-button" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {error && <div className="alert error">{error}</div>}
    </section>
  );
}
