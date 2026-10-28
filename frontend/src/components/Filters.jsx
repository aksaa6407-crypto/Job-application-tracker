const STATUSES = ['Applied', 'Interview', 'Offer', 'Accepted', 'Rejected', 'Declined'];

export default function Filters({ status, setStatus, search, setSearch }) {
  return (
    <div className="filters">
      <input
        type="text"
        placeholder="Search by company..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}