import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import FormField from '../components/FormField';
import { useAuth } from '../context/useAuth';
import { loginRules, rulesErrors } from '../validation/authRules';

function Login() {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();

    // Checked here first so an obvious mistake never costs a round trip. The
    // server checks the same rules again, since this one can be skipped
    const parsed = loginRules.safeParse({ email, password });

    if (!parsed.success) {
      setErrors(rulesErrors(parsed.error));
      setMessage('');
      return;
    }

    setBusy(true);
    setErrors({});
    setMessage('');

    try {
      await login(parsed.data);
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(err.errors ?? {});
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async () => {
    setBusy(true);
    setErrors({});
    setMessage('');

    try {
      await loginAsDemo();
      navigate('/', { replace: true });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted">
          Search the iTunes catalogue and keep what you like.
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
          autoComplete="current-password"
        />

        <button
          className="w-full rounded-full bg-accent-strong py-2.5 font-medium text-accent-ink transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={busy}
        >
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 flex w-full max-w-sm flex-col gap-3 text-center text-sm text-muted">
        <button
          className="w-full rounded-full border border-line bg-surface py-2.5 font-medium text-ink transition hover:bg-raised hover:border-accent-strong active:bg-raised disabled:opacity-60"
          type="button"
          onClick={handleDemo}
          disabled={busy}
        >
          Try the demo account
        </button>

        <p>
          No account yet?{' '}
          <Link
            className="font-medium text-accent-strong underline-offset-2 hover:underline active:underline"
            to="/register"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
