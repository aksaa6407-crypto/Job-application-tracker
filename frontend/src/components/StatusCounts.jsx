const ORDER = ['Applied', 'Interview', 'Offer', 'Accepted', 'Rejected', 'Declined'];

export default function StatusCounts({ counts, active, onSelect }) {
  return (
    <div className="counts">
      <div
        className={`count-box ${active === '' ? 'active' : ''}`}
        onClick={() => onSelect('')}
      >
        <span className="count-num">{counts.Total ?? 0}</span>
        <span className="count-label">Total</span>
      </div>
      {ORDER.map((s) => (
        <div
          key={s}
          className={`count-box s-${s} ${active === s ? 'active' : ''}`}
          onClick={() => onSelect(s)}
        >
          <span className="count-num">{counts[s] ?? 0}</span>
          <span className="count-label">{s}</span>
        </div>
      ))}
    </div>
  );
}