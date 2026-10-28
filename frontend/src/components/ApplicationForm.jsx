import { useState } from 'react';
import api, { getErr } from '../api';

const today = () => new Date().toISOString().split('T')[0];

export default function ApplicationForm({ existing, onClose, onSaved }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    company: existing?.company || '',
    role: existing?.role || '',
    jobType: existing?.jobType || 'Full-time',
    appliedDate: existing ? existing.appliedDate.split('T')[0] : '',
    salary: existing?.salary ?? '',
    notes: existing?.notes || '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const er = {};
    if (!form.company.trim()) er.company = 'Company name is required';
    if (!form.role.trim()) er.role = 'Job role is required';
    if (!form.jobType) er.jobType = 'Job type is required';
    if (!isEdit) {
      if (!form.appliedDate) er.appliedDate = 'Applied date is required';
      else if (form.appliedDate > today()) er.appliedDate = 'Applied date cannot be in the future';
    }
    if (form.salary !== '' && Number(form.salary) < 0) er.salary = 'Salary must be positive';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        company: form.company,
        role: form.role,
        jobType: form.jobType,
        salary: form.salary,
        notes: form.notes,
      };
      if (!isEdit) payload.appliedDate = form.appliedDate;

      const res = isEdit
        ? await api.put(`/applications/${existing._id}`, payload)
        : await api.post('/applications', payload);
      onSaved(res.data.message);
    } catch (err) {
      setServerError(getErr(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <div className="modal-head">
          <h2>{isEdit ? `Edit ${existing.applicationId}` : 'Add Application'}</h2>
          <button type="button" className="close" onClick={onClose}>×</button>
        </div>

        {serverError && <div className="alert error">{serverError}</div>}

        <label>Company Name *
          <input name="company" value={form.company} onChange={change} />
          {errors.company && <small className="err">{errors.company}</small>}
        </label>

        <label>Job Role *
          <input name="role" value={form.role} onChange={change} />
          {errors.role && <small className="err">{errors.role}</small>}
        </label>

        <div className="row">
          <label>Job Type *
            <select name="jobType" value={form.jobType} onChange={change}>
              <option>Full-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </label>

          <label>Applied Date *
            <input
              type="date"
              name="appliedDate"
              value={form.appliedDate}
              max={today()}
              onChange={change}
              disabled={isEdit}
            />
            {errors.appliedDate && <small className="err">{errors.appliedDate}</small>}
          </label>
        </div>

        <label>Expected Salary (optional)
          <input type="number" name="salary" min="0" value={form.salary} onChange={change} />
          {errors.salary && <small className="err">{errors.salary}</small>}
        </label>

        <label>Notes (optional)
          <textarea name="notes" rows="3" value={form.notes} onChange={change} />
        </label>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}