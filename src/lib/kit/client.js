// Frontend half of the generated application: router, session provider, API client and every screen.
import { primaryEntity } from '@/lib/kit/model';

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
`;

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
          {user ? user.full_name : 'InvestArch'}
        </Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/app" end>
            Dashboard
          </NavLink>
          <NavLink to="/app/new">New record</NavLink>
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
  return `export const ENTITY = ${JSON.stringify(primaryEntity(seed), null, 2)};

export function fieldLabel(name) {
  const field = ENTITY.fields.find((item) => item.name === name);
  return field ? field.label : name;
}

export function titleOf(record) {
  const value = record ? record[ENTITY.titleField] : null;
  return value == null || value === '' ? 'Untitled' : String(value);
}
`;
}

function buildLanding(seed) {
  return `import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Landing() {
  const { user, loading } = useAuth();

  return (
    <main className="page">
      <h1>${(seed.title || 'Operations').replace(/'/g, '')} keeps the work in one place.</h1>
      <p>
        ${(seed.gap || 'Records scatter across tools and nobody trusts the numbers.').replace(/'/g, '').slice(0, 220)}
      </p>
      <p>
        ${(seed.solution || 'One workspace per account, with every record scoped to its owner.').replace(/'/g, '').slice(0, 220)}
      </p>
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

const DASHBOARD = `import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ENTITY, titleOf } from '../schema';
import StateBlock from '../components/StateBlock';

export default function Dashboard() {
  const [state, setState] = useState({ status: 'loading', items: [], total: 0, error: null });

  const load = useCallback(async () => {
    setState((current) => Object.assign({}, current, { status: 'loading', error: null }));
    try {
      const body = await api.list(ENTITY.key);
      setState({ status: body.items.length ? 'ready' : 'empty', items: body.items, total: body.total, error: null });
    } catch (error) {
      setState({ status: 'error', items: [], total: 0, error: error.message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>{ENTITY.label} records</h1>
          <p className="hint" style={{ margin: 0 }}>
            {state.total} stored
          </p>
        </div>
        <Link className="btn" to="/app/new">
          New {ENTITY.label.toLowerCase()}
        </Link>
      </div>

      {state.status === 'loading' || state.status === 'error' ? (
        <StateBlock status={state.status} message={state.error} onRetry={load} />
      ) : null}

      {state.status === 'empty' ? (
        <StateBlock
          status="empty"
          message={'No ' + ENTITY.label.toLowerCase() + ' records yet.'}
          action={
            <Link className="btn" to="/app/new">
              Add the first one
            </Link>
          }
        />
      ) : null}

      {state.status === 'ready' ? (
        <div className="card" style={{ padding: '4px 16px' }}>
          {state.items.map((item) => (
            <Link className="row" key={item.id} to={'/app/' + item.id}>
              <div className="row-title">{titleOf(item)}</div>
              <div className="row-meta">
                {ENTITY.fields
                  .filter((field) => field.name !== ENTITY.titleField && item[field.name] != null)
                  .slice(0, 3)
                  .map((field) => (
                    <span key={field.name}>
                      {field.label}: {String(item[field.name])}
                    </span>
                  ))}
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
`;

const RECORD_NEW = `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ENTITY } from '../schema';
import RecordForm from '../components/RecordForm';

export default function RecordNew() {
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const body = await api.create(ENTITY.key, values);
      navigate('/app/' + body.record.id, { replace: true });
    } catch (problem) {
      setError(problem.message || 'That could not be saved.');
      setBusy(false);
    }
  };

  return (
    <section>
      <h1>New {ENTITY.label.toLowerCase()}</h1>
      <RecordForm
        fields={ENTITY.fields}
        values={values}
        onChange={setValues}
        onSubmit={submit}
        submitting={busy}
        error={error}
        submitLabel="Save"
        onCancel={() => navigate('/app')}
      />
    </section>
  );
}
`;

const RECORD_DETAIL = `import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { ENTITY, titleOf } from '../schema';
import RecordForm from '../components/RecordForm';
import StateBlock from '../components/StateBlock';

function toInput(record) {
  const values = {};
  for (const field of ENTITY.fields) {
    const value = record[field.name];
    if (field.type === 'date' && value) values[field.name] = String(value).slice(0, 10);
    else values[field.name] = value == null ? '' : value;
  }
  return values;
}

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', record: null, error: null });
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState({ status: 'loading', record: null, error: null });
    try {
      const body = await api.read(ENTITY.key, id);
      setState({ status: 'ready', record: body.record, error: null });
      setValues(toInput(body.record));
    } catch (problem) {
      setState({
        status: problem.status === 404 ? 'missing' : 'error',
        record: null,
        error: problem.message
      });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setError('');
    setBusy(true);
    try {
      const body = await api.update(ENTITY.key, id, values);
      setState({ status: 'ready', record: body.record, error: null });
      setValues(toInput(body.record));
    } catch (problem) {
      setError(problem.message || 'That could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const destroy = async () => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api.remove(ENTITY.key, id);
      navigate('/app', { replace: true });
    } catch (problem) {
      setError(problem.message || 'That could not be deleted.');
      setBusy(false);
    }
  };

  if (state.status === 'loading' || state.status === 'error') {
    return <StateBlock status={state.status} message={state.error} onRetry={load} />;
  }

  if (state.status === 'missing') {
    return (
      <div className="empty">
        <p>That record does not exist, or it belongs to another account.</p>
        <Link className="btn" to="/app">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <section>
      <p className="hint" style={{ marginBottom: '6px' }}>
        <Link to="/app">Dashboard</Link> / {ENTITY.label}
      </p>
      <h1>{titleOf(state.record)}</h1>
      <p className="hint">
        Created {new Date(state.record.created_at).toLocaleString()} | Updated{' '}
        {new Date(state.record.updated_at).toLocaleString()}
      </p>

      <RecordForm
        fields={ENTITY.fields}
        values={values}
        onChange={setValues}
        onSubmit={save}
        submitting={busy}
        error={error}
        submitLabel="Save changes"
      />

      <div className="toolbar">
        <button type="button" className="btn-danger" onClick={destroy} disabled={busy}>
          Delete record
        </button>
      </div>
    </section>
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
            <Route path="/app/new" element={<RecordNew />} />
            <Route path="/app/:id" element={<RecordDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
`;

export function buildClientFiles(seed) {
  return [
    { path: 'src/index.css', content: STYLES },
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
    { path: 'src/pages/RecordNew.jsx', content: RECORD_NEW },
    { path: 'src/pages/RecordDetail.jsx', content: RECORD_DETAIL },
    { path: 'src/pages/Settings.jsx', content: SETTINGS },
    { path: 'src/pages/NotFound.jsx', content: NOT_FOUND }
  ];
}