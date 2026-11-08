// Frontend half of the generated application: router, session provider, API client and every screen.
import { entityMap, primaryEntity } from '@/lib/kit/model';
import { DASHBOARD, RECORD_LIST, RECORD_NEW, RECORD_DETAIL } from '@/lib/kit/pagesRecords';

const STYLES = `:root {
  color-scheme: light;
  --ink: #0f1115;
  --muted: #5b6169;
  --line: #e3e0da;
  --paper: #fbfaf7;
  --surface: #ffffff;
  --accent: #1a3c34;
  --accent-ink: #ffffff;
  --danger: #9a3b2e;
  --radius: 8px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
}

h1,
h2,
h3 {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 12px;
}

h1 {
  font-size: 32px;
  line-height: 1.15;
}

h2 {
  font-size: 21px;
}

p {
  margin: 0 0 14px;
  color: var(--muted);
}

.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.brand {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 17px;
  font-weight: 700;
  margin-right: auto;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.nav a {
  text-decoration: none;
  font-size: 14px;
  color: var(--muted);
}

.nav a:hover,
.nav a[aria-current="page"] {
  color: var(--ink);
}

.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 20px 72px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 16px;
}

.grid {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

input,
textarea,
select {
  font: inherit;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 9px 11px;
  width: 100%;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

input:focus-visible,
textarea:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn,
.btn-ghost,
.btn-link {
  font: inherit;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid transparent;
  padding: 9px 16px;
  min-height: 40px;
}

.btn {
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
}

.btn:disabled {
  opacity: 0.6;
  cursor: progress;
}

.btn-ghost {
  background: transparent;
  border-color: var(--line);
  color: var(--ink);
}

.btn-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--accent);
  text-decoration: underline;
}

.btn-danger {
  background: transparent;
  border-color: var(--danger);
  color: var(--danger);
  font-weight: 600;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.error {
  color: var(--danger);
  font-size: 14px;
  margin: 0 0 12px;
}

.hint {
  font-size: 13px;
  color: var(--muted);
}

.empty {
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  padding: 28px 20px;
  text-align: center;
}

.row {
  display: block;
  text-decoration: none;
  border-bottom: 1px solid var(--line);
  padding: 14px 4px;
}

.row:last-child {
  border-bottom: none;
}

.row:hover {
  background: #f4f2ed;
}

.row-title {
  font-weight: 600;
  color: var(--ink);
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.badge {
  display: inline-block;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 1px 9px;
  font-size: 12px;
  text-transform: capitalize;
}

.stat {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 26px;
  font-weight: 700;
}

.dl {
  display: grid;
  grid-template-columns: minmax(120px, 180px) 1fr;
  gap: 8px 16px;
  margin: 0 0 20px;
}

.dl dt {
  color: var(--muted);
  font-size: 13px;
}

.dl dd {
  margin: 0;
  word-break: break-word;
}

@media (max-width: 480px) {
  .page {
    padding: 24px 16px 56px;
  }

  h1 {
    font-size: 26px;
  }

  .dl {
    grid-template-columns: 1fr;
    gap: 2px 0;
  }

  .dl dd {
    margin-bottom: 12px;
  }
}

/* Brand kit: palette and type generated from the operator's uploaded assets. */
:root {
  --accent: __PRIMARY__;
  --accent-ink: __ON_PRIMARY__;
  --paper: __SURFACE__;
  --surface: #ffffff;
  --ink: __INK__;
  --danger: __ACCENT__;
  --font-heading: __HEADING_FONT__;
  --font-body: __BODY_FONT__;
}

body {
  font-family: var(--font-body);
}

h1,
h2,
h3,
.brand,
.stat {
  font-family: var(--font-heading);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.brand-logo {
  height: 26px;
  width: auto;
  display: block;
}

.logo {
  display: block;
  max-width: 148px;
  height: auto;
  margin-bottom: 18px;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 10px;
}

.hero {
  padding: 6px 0 10px;
}

.hero h1 {
  max-width: 24ch;
}

.footer {
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--muted);
}
`;

function buildStyles(brand) {
  return STYLES.replace('__PRIMARY__', brand.primary)
    .replace('__ON_PRIMARY__', brand.onPrimary)
    .replace('__SURFACE__', brand.surface)
    .replace('__INK__', brand.ink)
    .replace('__ACCENT__', brand.accent)
    .replace('__HEADING_FONT__', brand.headingFont)
    .replace('__BODY_FONT__', brand.bodyFont);
}

const API = `const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options) {
  const config = Object.assign({ credentials: 'include', headers: { 'content-type': 'application/json' } }, options || {});
  const response = await fetch(BASE + path, config);
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!response.ok) {
    const error = new Error((body && body.error) || 'The request failed.');
    error.status = response.status;
    error.fields = (body && body.fields) || null;
    throw error;
  }
  return body;
}

const send = (method, path, payload) => request(path, { method, body: JSON.stringify(payload || {}) });

export const api = {
  me: () => request('/api/auth/me'),
  login: (payload) => send('POST', '/api/auth/login', payload),
  register: (payload) => send('POST', '/api/auth/register', payload),
  logout: () => send('POST', '/api/auth/logout'),
  updateProfile: (payload) => send('PATCH', '/api/auth/me', payload),
  resetRequest: (payload) => send('POST', '/api/auth/reset-request', payload),
  reset: (payload) => send('POST', '/api/auth/reset', payload),
  list: (entity) => request('/api/records/' + entity),
  create: (entity, payload) => send('POST', '/api/records/' + entity, payload),
  read: (entity, id) => request('/api/records/' + entity + '/' + id),
  update: (entity, id, payload) => send('PATCH', '/api/records/' + entity + '/' + id, payload),
  remove: (entity, id) => request('/api/records/' + entity + '/' + id, { method: 'DELETE' })
};
`;

const AUTH = `import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    api
      .me()
      .then((body) => {
        if (live) setUser(body.user);
      })
      .catch((error) => {
        if (live && error.status !== 401) setUser(null);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const signIn = useCallback(async (payload) => {
    const body = await api.login(payload);
    setUser(body.user);
  }, []);

  const signUp = useCallback(async (payload) => {
    const body = await api.register(payload);
    setUser(body.user);
  }, []);

  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = { user, loading, setUser, signIn, signUp, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
`;

const SHELL = `import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { BRAND } from '../brand';
import { entityList } from '../schema';

const COLLECTIONS = entityList();

export default function Shell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const leave = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div>
      <header className="topbar">
        <Link className="brand" to="/app">
          {BRAND.logo ? <img className="brand-logo" src={BRAND.logo} alt={BRAND.name} /> : null}
          <span>{BRAND.name}</span>
        </Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/app" end>
            Workspace
          </NavLink>
          {COLLECTIONS.map((entity) => (
            <NavLink key={entity.key} to={'/app/' + entity.key}>
              {entity.label}
            </NavLink>
          ))}
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <button type="button" className="btn-ghost" onClick={leave}>
          Sign out
        </button>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
`;

const STATE = `export default function StateBlock({ status, message, onRetry, action, children }) {
  if (status === 'loading') {
    return (
      <div className="card" role="status" aria-live="polite">
        <p className="hint">Loading</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="card" role="alert">
        <p className="error">{message || 'That did not load.'}</p>
        {onRetry ? (
          <button type="button" className="btn-ghost" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="empty">
        <p>{message || 'Nothing here yet.'}</p>
        {action || null}
      </div>
    );
  }

  return children || null;
}
`;

const FORM = `export default function RecordForm({ fields, values, onChange, onSubmit, submitting, error, submitLabel, onCancel }) {
  const set = (name, value) => onChange(Object.assign({}, values, { [name]: value }));

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {fields.map((field) => (
        <div className="field" key={field.name}>
          <label htmlFor={field.name}>
            {field.label}
            {field.required ? ' (required)' : ''}
          </label>
          {field.type === 'boolean' ? (
            <input
              id={field.name}
              name={field.name}
              type="checkbox"
              checked={Boolean(values[field.name])}
              onChange={(event) => set(field.name, event.target.checked)}
            />
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              step={field.type === 'number' ? 'any' : undefined}
              value={values[field.name] == null ? '' : values[field.name]}
              onChange={(event) => set(field.name, event.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="toolbar">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Saving' : submitLabel}
        </button>
        {onCancel ? (
          <button className="btn-ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
`;

function buildSchemaModule(seed) {
  return `export const ENTITIES = ${JSON.stringify(entityMap(seed), null, 2)};

export const PRIMARY_KEY = ${JSON.stringify(primaryEntity(seed).key)};

export function entityOf(key) {
  return Object.prototype.hasOwnProperty.call(ENTITIES, key) ? ENTITIES[key] : null;
}

export function entityList() {
  return Object.keys(ENTITIES).map((key) => ENTITIES[key]);
}

export function fieldLabel(entity, name) {
  const field = entity ? entity.fields.find((item) => item.name === name) : null;
  return field ? field.label : name;
}

export function titleOf(entity, record) {
  const field = entity ? entity.titleField : null;
  const value = field && record ? record[field] : null;
  return value == null || value === '' ? 'Untitled' : String(value);
}
`;
}

const safeCopy = (value, max) =>
  String(value || '')
    .replace(/[`\\]/g, '')
    .replace(/\$\{/g, '')
    .replace(/'/g, '’')
    .trim()
    .slice(0, max);

function buildLanding(seed) {
  const headline = safeCopy(`${seed.title || 'Operations'} in one workspace.`, 90);
  const gap = safeCopy(seed.gap, 260) || 'Records scatter across tools and nobody trusts the numbers.';
  const solution = safeCopy(seed.solution, 260) || 'One workspace per account, with every record scoped to its owner.';

  return `import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { BRAND } from '../brand';

export default function Landing() {
  const { user, loading } = useAuth();

  return (
    <main className="page">
      <section className="hero">
        {BRAND.logo ? <img className="logo" src={BRAND.logo} alt={BRAND.name} /> : null}
        <p className="eyebrow">{BRAND.name}</p>
        <h1>{BRAND.tagline || '${headline}'}</h1>
        <p>${gap}</p>
        <div className="toolbar">
          {loading ? null : user ? (
            <Link className="btn" to="/app">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link className="btn" to="/register">
                Create an account
              </Link>
              <Link className="btn-ghost" to="/login">
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: '28px' }}>
        <div className="card">
          <h2>What is broken</h2>
          <p>${gap}</p>
        </div>
        <div className="card">
          <h2>What this does</h2>
          <p>${solution}</p>
        </div>
      </div>

      {BRAND.supportEmail ? <p className="footer">Questions go to {BRAND.supportEmail}.</p> : null}
    </main>
  );
}
`;
}

const LOGIN = `import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(form);
      navigate('/app', { replace: true });
    } catch (problem) {
      setError(problem.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <h1>Sign in</h1>
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm(Object.assign({}, form, { email: event.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm(Object.assign({}, form, { password: event.target.value }))}
            required
          />
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="toolbar">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Signing in' : 'Sign in'}
          </button>
          <Link className="btn-link" to="/reset">
            Forgot your password?
          </Link>
          <Link className="btn-link" to="/register">
            Need an account?
          </Link>
        </div>
      </form>
    </main>
  );
}
`;

const REGISTER = `import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Register() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signUp(form);
      navigate('/app', { replace: true });
    } catch (problem) {
      setError(problem.message || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <h1>Create your account</h1>
      <p>Every record you add stays scoped to your account.</p>
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            value={form.fullName}
            autoComplete="name"
            onChange={(event) => setForm(Object.assign({}, form, { fullName: event.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm(Object.assign({}, form, { email: event.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password (8 characters minimum)</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={(event) => setForm(Object.assign({}, form, { password: event.target.value }))}
            required
          />
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="toolbar">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Creating account' : 'Create account'}
          </button>
          <Link className="btn-link" to="/login">
            Already registered?
          </Link>
        </div>
      </form>
    </main>
  );
}
`;

const RESET = `import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Reset() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [issued, setIssued] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const requestToken = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const body = await api.resetRequest({ email });
      setMessage('If that email has an account, a single-use reset token has been issued.');
      if (body && body.token) setIssued(body.token);
    } catch (problem) {
      setError(problem.message || 'That request failed.');
    } finally {
      setBusy(false);
    }
  };

  const applyPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await api.reset({ token, password });
      setPassword('');
      setMessage('Password changed. You can sign in with it now.');
    } catch (problem) {
      setError(problem.message || 'That reset failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <h1>{token ? 'Choose a new password' : 'Reset your password'}</h1>
      {token ? (
        <form className="card" onSubmit={applyPassword}>
          <div className="field">
            <label htmlFor="password">New password (8 characters minimum)</label>
            <input
              id="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {message ? <p className="hint">{message}</p> : null}
          <div className="toolbar">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Saving' : 'Save password'}
            </button>
            <Link className="btn-link" to="/login">
              Back to sign in
            </Link>
          </div>
        </form>
      ) : (
        <form className="card" onSubmit={requestToken}>
          <p>Enter the email on the account. The reset token is valid for one hour and can be used once.</p>
          <div className="field">
            <label htmlFor="resetEmail">Email</label>
            <input
              id="resetEmail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {message ? <p className="hint">{message}</p> : null}
          {issued ? (
            <p className="hint">
              Development token: <code>{issued}</code>
            </p>
          ) : null}
          <div className="toolbar">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Requesting' : 'Request a reset'}
            </button>
            <Link className="btn-link" to="/login">
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
`;

const SETTINGS = `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

export default function Settings() {
  const { user, setUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user ? user.full_name : '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setNote('');
    setBusy(true);
    try {
      const body = await api.updateProfile({ fullName });
      setUser(body.user);
      setNote('Saved.');
    } catch (problem) {
      setError(problem.message || 'That could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <section>
      <h1>Settings</h1>
      <form className="card" onSubmit={save}>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" value={user ? user.email : ''} disabled />
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {note ? <p className="hint">{note}</p> : null}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Saving' : 'Save changes'}
        </button>
      </form>

      <div className="card">
        <h2>Session</h2>
        <p className="hint">Signing out clears the session cookie on this device.</p>
        <button type="button" className="btn-ghost" onClick={leave}>
          Sign out
        </button>
      </div>
    </section>
  );
}
`;

const NOT_FOUND = `import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p>That address does not match a screen in this application.</p>
      <Link className="btn" to="/app">
        Go to dashboard
      </Link>
    </main>
  );
}
`;

const APP = `import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Shell from './components/Shell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Reset from './pages/Reset';
import Dashboard from './pages/Dashboard';
import RecordList from './pages/RecordList';
import RecordNew from './pages/RecordNew';
import RecordDetail from './pages/RecordDetail';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function Gate({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <main className="page" role="status">
        <p className="hint">Checking your session</p>
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset" element={<Reset />} />
          <Route
            element={
              <Gate>
                <Shell />
              </Gate>
            }
          >
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/:entity" element={<RecordList />} />
            <Route path="/app/:entity/new" element={<RecordNew />} />
            <Route path="/app/:entity/:id" element={<RecordDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
`;

export function buildClientFiles(seed, brand) {
  return [
    { path: 'src/index.css', content: buildStyles(brand) },
    { path: 'src/schema.js', content: buildSchemaModule(seed) },
    { path: 'src/api.js', content: API },
    { path: 'src/auth.jsx', content: AUTH },
    { path: 'src/App.jsx', content: APP },
    { path: 'src/components/Shell.jsx', content: SHELL },
    { path: 'src/components/StateBlock.jsx', content: STATE },
    { path: 'src/components/RecordForm.jsx', content: FORM },
    { path: 'src/pages/Landing.jsx', content: buildLanding(seed) },
    { path: 'src/pages/Login.jsx', content: LOGIN },
    { path: 'src/pages/Register.jsx', content: REGISTER },
    { path: 'src/pages/Reset.jsx', content: RESET },
    { path: 'src/pages/Dashboard.jsx', content: DASHBOARD },
    { path: 'src/pages/RecordList.jsx', content: RECORD_LIST },
    { path: 'src/pages/RecordNew.jsx', content: RECORD_NEW },
    { path: 'src/pages/RecordDetail.jsx', content: RECORD_DETAIL },
    { path: 'src/pages/Settings.jsx', content: SETTINGS },
    { path: 'src/pages/NotFound.jsx', content: NOT_FOUND }
  ];
}