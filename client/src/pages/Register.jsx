import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import FormField from '../components/FormField';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/useAuth';
import { registerRules, rulesErrors } from '../validation/authRules';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();

    const parsed = registerRules.safeParse({ email, password });

    if (!parsed.success) {
      setErrors(rulesErrors(parsed.error));
      setMessage('');
      return;
    }

    setBusy(true);
    setErrors({});
    setMessage('');

    try {
      await register(parsed.data);
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(err.errors ?? {});
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-page px-4 py-12">
      <ThemeToggle className="absolute top-4 right-4" />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Create an account
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your favourites and searches are kept to your account.
        </p>
      </div>

      <form
        className="w-full max-w-sm rounded-card border border-line bg-surface p-6 card-shadow"
        onSubmit={handleSubmit}
        noValidate
      >
        {message && (
          <p
            className="mb-4 rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {message}
          </p>
        )}

        <FormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />

        <p className="-mt-2 mb-4 text-xs text-muted">At least 8 characters.</p>

        <button
          className="w-full rounded-full bg-accent-strong py-2.5 font-medium text-accent-ink transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={busy}
        >
          {busy ? 'Creating...' : 'Create account'}
        </button>

        {/* 60 matches RETENTION_DAYS in server/config/retention.js, so change
            both or the page starts lying */}
        <p className="mt-4 text-xs text-muted">
          An account that goes unused for 60 days is deleted, along with its
          favourites and searches. Using the app pushes that back out.
        </p>
      </form>

      <div className="mt-4 flex w-full max-w-sm flex-col gap-3 text-center text-sm text-muted">
        <p>
          Already have one?{' '}
          <Link
            className="font-medium text-accent-strong underline-offset-2 hover:underline active:underline"
            to="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
