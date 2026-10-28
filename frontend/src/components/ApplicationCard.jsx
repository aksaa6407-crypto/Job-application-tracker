export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const canDelete = (status) => !['Interview', 'Offer'].includes(status);

export default function ApplicationCard({ app, onOpen, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="card-top">
        <span className="app-id">{app.applicationId}</span>
        <span className={`badge s-${app.status}`}>{app.status}</span>
      </div>

      <h3 onClick={onOpen} className="link">{app.company}</h3>
      <p className="role">{app.role}</p>

      <div className="meta">
        <span>{app.jobType}</span>
        <span>Applied: {fmtDate(app.appliedDate)}</span>
      </div>

      {app.isOverdue && <span className="badge overdue">Follow-up Overdue</span>}

      <div className="card-actions">
        <button className="btn small" onClick={onOpen}>Details</button>
        <button className="btn small" onClick={onEdit}>Edit</button>
        <button
          className="btn small danger"
          disabled={!canDelete(app.status)}
          title={canDelete(app.status) ? 'Delete' : `Cannot delete in ${app.status} status`}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}