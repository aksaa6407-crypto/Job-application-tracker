import { useEffect, useState, useCallback } from 'react';
import api, { getErr } from './api';
import StatusCounts from './components/StatusCounts';
import Filters from './components/Filters';
import ApplicationCard from './components/ApplicationCard';
import ApplicationForm from './components/ApplicationForm';
import ApplicationDetails from './components/ApplicationDetails';

export default function App() {
  const [apps, setApps] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [list, stats] = await Promise.all([
        api.get('/applications', { params: { status, search: debouncedSearch } }),
        api.get('/applications/stats'),
      ]);
      setApps(list.data.data);
      setCounts(stats.data.data);
      setError('');
    } catch (e) {
      setError(getErr(e));
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleDelete = async (app) => {
    if (!window.confirm(`Delete application ${app.applicationId} (${app.company})?`)) return;
    try {
      const res = await api.delete(`/applications/${app._id}`);
      showToast(res.data.message);
      setSelected(null);
      load();
    } catch (e) {
      alert(getErr(e));
    }
  };

  const handleSaved = (msg) => {
    setShowForm(false);
    setEditing(null);
    showToast(msg);
    load();
  };

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Job Application Tracker</h1>
          <p className="muted">Track every application from Applied to Offer</p>
        </div>
        <button className="btn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Add Application
        </button>
      </header>

      <StatusCounts counts={counts} active={status} onSelect={setStatus} />
      <Filters
        status={status}
        setStatus={setStatus}
        search={search}
        setSearch={setSearch}
      />

      {error && <div className="alert error">{error}</div>}
      {loading && <p className="muted center">Loading...</p>}
      {!loading && !error && apps.length === 0 && (
        <div className="empty">No applications found.</div>
      )}

      <div className="grid">
        {apps.map((a) => (
          <ApplicationCard
            key={a._id}
            app={a}
            onOpen={() => setSelected(a)}
            onEdit={() => { setEditing(a); setShowForm(true); }}
            onDelete={() => handleDelete(a)}
          />
        ))}
      </div>

      {showForm && (
        <ApplicationForm
          existing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}

      {selected && (
        <ApplicationDetails
          id={selected._id}
          onClose={() => setSelected(null)}
          onChanged={() => load()}
          onDelete={handleDelete}
          showToast={showToast}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}