// The authenticated screens of the generated application: a workspace overview, then list,
// create and detail for every collection the model declares.

export const DASHBOARD = `import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { entityList, titleOf } from '../schema';
import StateBlock from '../components/StateBlock';

const COLLECTIONS = entityList();

export default function Dashboard() {
  const [state, setState] = useState({ status: 'loading', cards: [], stored: 0, error: null });

  const load = useCallback(async () => {
    setState({ status: 'loading', cards: [], stored: 0, error: null });
    try {
      const cards = await Promise.all(
        COLLECTIONS.map(async (entity) => {
          const body = await api.list(entity.key);
          return {
            key: entity.key,
            label: entity.label,
            entity,
            total: body.total,
            items: body.items.slice(0, 3)
          };
        })
      );
      const stored = cards.reduce((sum, card) => sum + card.total, 0);
      setState({ status: stored ? 'ready' : 'empty', cards, stored, error: null });
    } catch (error) {
      setState({ status: 'error', cards: [], stored: 0, error: error.message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Workspace</h1>
          <p className="hint" style={{ margin: 0 }}>
            {state.status === 'loading'
              ? 'Loading your records'
              : state.stored + ' records across ' + COLLECTIONS.length + ' collections'}
          </p>
        </div>
      </div>

      {state.status === 'loading' || state.status === 'error' ? (
        <StateBlock status={state.status} message={state.error} onRetry={load} />
      ) : null}

      {state.status === 'ready' || state.status === 'empty' ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {state.cards.map((card) => (
            <div className="card" key={card.key}>
              <div className="toolbar" style={{ justifyContent: 'space-between', marginTop: 0 }}>
                <h2 style={{ margin: 0 }}>{card.label}</h2>
                <span className="stat">{card.total}</span>
              </div>
              {card.items.length ? (
                <div style={{ marginTop: '10px' }}>
                  {card.items.map((item) => (
                    <Link className="row" key={item.id} to={'/app/' + card.key + '/' + item.id}>
                      <div className="row-title">{titleOf(card.entity, item)}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="hint" style={{ marginTop: '10px' }}>
                  No {card.label.toLowerCase()} yet.
                </p>
              )}
              <div className="toolbar">
                <Link className="btn-ghost" to={'/app/' + card.key}>
                  Open {card.label.toLowerCase()}
                </Link>
                <Link className="btn-link" to={'/app/' + card.key + '/new'}>
                  Add one
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
`;

export const RECORD_LIST = `import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { entityOf, titleOf } from '../schema';
import StateBlock from '../components/StateBlock';

function CollectionList({ entity }) {
  const [state, setState] = useState({ status: 'loading', items: [], total: 0, error: null });

  const load = useCallback(async () => {
    setState((current) => Object.assign({}, current, { status: 'loading', error: null }));
    try {
      const body = await api.list(entity.key);
      setState({
        status: body.items.length ? 'ready' : 'empty',
        items: body.items,
        total: body.total,
        error: null
      });
    } catch (error) {
      setState({ status: 'error', items: [], total: 0, error: error.message });
    }
  }, [entity.key]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>{entity.label} records</h1>
          <p className="hint" style={{ margin: 0 }}>
            {state.total} stored
          </p>
        </div>
        <Link className="btn" to={'/app/' + entity.key + '/new'}>
          New {entity.label.toLowerCase()}
        </Link>
      </div>

      {state.status === 'loading' || state.status === 'error' ? (
        <StateBlock status={state.status} message={state.error} onRetry={load} />
      ) : null}

      {state.status === 'empty' ? (
        <StateBlock
          status="empty"
          message={'No ' + entity.label.toLowerCase() + ' records yet.'}
          action={
            <Link className="btn" to={'/app/' + entity.key + '/new'}>
              Add the first one
            </Link>
          }
        />
      ) : null}

      {state.status === 'ready' ? (
        <div className="card" style={{ padding: '4px 16px' }}>
          {state.items.map((item) => (
            <Link className="row" key={item.id} to={'/app/' + entity.key + '/' + item.id}>
              <div className="row-title">{titleOf(entity, item)}</div>
              <div className="row-meta">
                {entity.fields
                  .filter((field) => field.name !== entity.titleField && item[field.name] != null)
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

export default function RecordList() {
  const params = useParams();
  const entity = entityOf(params.entity);

  if (!entity) {
    return (
      <div className="empty">
        <p>That collection is not part of this application.</p>
        <Link className="btn" to="/app">
          Back to the workspace
        </Link>
      </div>
    );
  }

  return <CollectionList key={entity.key} entity={entity} />;
}
`;

export const RECORD_NEW = `import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { entityOf } from '../schema';
import RecordForm from '../components/RecordForm';

function NewRecord({ entity }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const body = await api.create(entity.key, values);
      navigate('/app/' + entity.key + '/' + body.record.id, { replace: true });
    } catch (problem) {
      setError(problem.message || 'That could not be saved.');
      setBusy(false);
    }
  };

  return (
    <section>
      <h1>New {entity.label.toLowerCase()}</h1>
      <RecordForm
        fields={entity.fields}
        values={values}
        onChange={setValues}
        onSubmit={submit}
        submitting={busy}
        error={error}
        submitLabel="Save"
        onCancel={() => navigate('/app/' + entity.key)}
      />
    </section>
  );
}

export default function RecordNew() {
  const params = useParams();
  const entity = entityOf(params.entity);

  if (!entity) {
    return (
      <div className="empty">
        <p>That collection is not part of this application.</p>
        <Link className="btn" to="/app">
          Back to the workspace
        </Link>
      </div>
    );
  }

  return <NewRecord key={entity.key} entity={entity} />;
}
`;

export const RECORD_DETAIL = `import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { entityOf, titleOf } from '../schema';
import RecordForm from '../components/RecordForm';
import StateBlock from '../components/StateBlock';

function toInput(entity, record) {
  const values = {};
  for (const field of entity.fields) {
    const value = record[field.name];
    if (field.type === 'date' && value) values[field.name] = String(value).slice(0, 10);
    else values[field.name] = value == null ? '' : value;
  }
  return values;
}

function RecordView({ entity, id }) {
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', record: null, error: null });
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState({ status: 'loading', record: null, error: null });
    try {
      const body = await api.read(entity.key, id);
      setState({ status: 'ready', record: body.record, error: null });
      setValues(toInput(entity, body.record));
    } catch (problem) {
      setState({
        status: problem.status === 404 ? 'missing' : 'error',
        record: null,
        error: problem.message
      });
    }
  }, [entity.key, id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setError('');
    setBusy(true);
    try {
      const body = await api.update(entity.key, id, values);
      setState({ status: 'ready', record: body.record, error: null });
      setValues(toInput(entity, body.record));
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
      await api.remove(entity.key, id);
      navigate('/app/' + entity.key, { replace: true });
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
        <Link className="btn" to={'/app/' + entity.key}>
          Back to {entity.label.toLowerCase()}
        </Link>
      </div>
    );
  }

  return (
    <section>
      <p className="hint" style={{ marginBottom: '6px' }}>
        <Link to="/app">Workspace</Link> / <Link to={'/app/' + entity.key}>{entity.label}</Link>
      </p>
      <h1>{titleOf(entity, state.record)}</h1>
      <p className="hint">
        Created {new Date(state.record.created_at).toLocaleString()} | Updated{' '}
        {new Date(state.record.updated_at).toLocaleString()}
      </p>

      <RecordForm
        fields={entity.fields}
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

export default function RecordDetail() {
  const params = useParams();
  const entity = entityOf(params.entity);

  if (!entity) {
    return (
      <div className="empty">
        <p>That collection is not part of this application.</p>
        <Link className="btn" to="/app">
          Back to the workspace
        </Link>
      </div>
    );
  }

  return <RecordView key={entity.key + params.id} entity={entity} id={params.id} />;
}
`;