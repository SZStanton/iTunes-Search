import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import FormField from '../components/FormField';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/useAuth';
import { loginRules, rulesErrors } from '../validation/authRules';
import Button from '../components/ui/Button';
import Surface from '../components/ui/Surface';

function Login() {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  // The demo button sits below the form, so its failure needs its own slot
  // beside it. Put in the form's banner it reads as a message about the fields
  const [demoMessage, setDemoMessage] = useState('');
  // Which button is waiting, not just that something is. The demo sign in can
  // take most of a minute on a cold server, so it has to say so on itself
  const [busy, setBusy] = useState('');

  const handleSubmit = async event => {
    event.preventDefault();

    // Checked here first so an obvious mistake never costs a round trip. The
    // server checks the same rules again, since this one can be skipped
    const parsed = loginRules.safeParse({ email, password });

    if (!parsed.success) {
      setErrors(rulesErrors(parsed.error));
      setMessage('');
      setDemoMessage('');
      return;
    }

    setBusy('form');
    setErrors({});
    setMessage('');
    setDemoMessage('');

    try {
      await login(parsed.data);
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(err.errors ?? {});
      setMessage(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleDemo = async () => {
    setBusy('demo');
    setErrors({});
    setMessage('');
    setDemoMessage('');

    try {
      await loginAsDemo();
      navigate('/', { replace: true });
    } catch (err) {
      setDemoMessage(err.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <ThemeToggle className="absolute top-4 right-4" />

      <div className="mb-8 text-center">
        <h1 className="type-title text-3xl">Sign in</h1>
        <p className="type-meta mt-2 text-sm">
          Search the iTunes catalogue and keep what you like.
        </p>
      </div>

      <Surface
        as="form"
        className="w-full max-w-sm p-6"
        onSubmit={handleSubmit}
        noValidate
      >
        {message && (
          <p
            className="mb-4 rounded-control bg-danger-surface px-3 py-2 text-sm text-danger"
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

        <Button
          variant="primary"
          size="lg"
          full
          type="submit"
          disabled={Boolean(busy)}
          aria-busy={busy === 'form'}
        >
          {busy === 'form' ? 'Signing in...' : 'Sign in'}
        </Button>
      </Surface>

      <div className="type-meta mt-4 flex w-full max-w-sm flex-col gap-3 text-center text-sm">
        <Button
          size="lg"
          full
          onClick={handleDemo}
          disabled={Boolean(busy)}
          aria-busy={busy === 'demo'}
        >
          {busy === 'demo' ? 'Opening the demo...' : 'Try the demo account'}
        </Button>

        {demoMessage && (
          <p
            className="rounded-control bg-danger-surface px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {demoMessage}
          </p>
        )}

        <p>
          No account yet?{' '}
          <Link
            className="type-chrome text-accent-strong underline-offset-2 hover:underline active:underline"
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
