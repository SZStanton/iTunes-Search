import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import FormField from '../components/FormField';
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
    <div className="auth-page">
      <h1 className="app-title">Create an account</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {message && (
          <p className="form-message" role="alert">
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

        <p className="form-hint">At least 8 characters.</p>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Creating...' : 'Create account'}
        </button>
      </form>

      <div className="auth-alternatives">
        <p>
          Already have one? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
