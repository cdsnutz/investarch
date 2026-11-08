// The authenticated record screens of the generated application: list, create and detail.

export const DASHBOARD = `import { useCallback, useEffect, useState } from 'react';
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

export const RECORD_NEW = `import { useState } from 'react';
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

export const RECORD_DETAIL = `import { useCallback, useEffect, useState } from 'react';
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