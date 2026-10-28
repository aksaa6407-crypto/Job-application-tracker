import { useEffect, useState } from 'react';
import api, { getErr } from '../api';
import { fmtDate, canDelete } from './ApplicationCard';

export default function ApplicationDetails({ id, onClose, onChanged, onDelete, showToast }) {
  const [app, setApp] = useState(null);
  const [next, setNext] = useState('');
  const [error, setError] = useState('');

  const fetchOne = async () => {
    try {
      const res = await api.get(`/applications/${id}`);
      setApp(res.data.data);
      setNext('');
    } catch (e) {
      setError(getErr(e));
    }
  };

  useEffect(() => {
    fetchOne();
    // eslint-disable-next-line
  }, [id]);

  const updateStatus = async () => {
    if (!next) return;
    try {
      const res = await api.patch(`/applications/${id}/status`, { status: next });
      showToast(res.data.message);
      await fetchOne();
      onChanged();
    } catch (e) {
      setError(getErr(e));
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Application Details</h2>
          <button className="close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert error">{error}</div>}
        {!app && !error && <p className="muted">Loading...</p>}

        {app && (
          <>
            <div className="card-top">
              <span className="app-id">{app.applicationId}</span>
              <span className={`badge s-${app.status}`}>{app.status}</span>
            </div>
            <h3>{app.company}</h3>
            <p className="role">{app.role}</p>
            {app.isOverdue && <span className="badge overdue">Follow-up Overdue</span>}

            <dl className="details">
              <dt>Job Type</dt><dd>{app.jobType}</dd>
              <dt>Applied Date</dt><dd>{fmtDate(app.appliedDate)}</dd>
              <dt>Follow-up Date</dt><dd>{fmtDate(app.followUpDate)}</dd>
              <dt>Expected Salary</dt><dd>{app.salary ? `₹${app.salary.toLocaleString('en-IN')}` : '—'}</dd>
              <dt>Notes</dt><dd>{app.notes || '—'}</dd>
            </dl>

            {app.nextStatuses.length > 0 ? (
              <div className="status-change">
                <select value={next} onChange={(e) => setNext(e.target.value)}>
                  <option value="">Change status...</option>
                  {app.nextStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button className="btn primary" disabled={!next} onClick={updateStatus}>
                  Update
                </button>
              </div>
            ) : (
              <p className="muted">This is a final status and cannot be changed.</p>
            )}

            <h4>Status History</h4>
            <ul className="timeline">
              {app.history.map((h) => (
                <li key={h._id}>
                  <span className={`dot s-${h.status}`} />
                  <div>
                    <strong>{h.status}</strong>
                    <small>{new Date(h.changedAt).toLocaleString()}</small>
                  </div>
                </li>
              ))}
            </ul>

            <div className="modal-actions">
              <button
                className="btn danger"
                disabled={!canDelete(app.status)}
                title={canDelete(app.status) ? '' : `Cannot delete in ${app.status} status`}
                onClick={() => onDelete(app)}
              >
                Delete
              </button>
              <button className="btn" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}