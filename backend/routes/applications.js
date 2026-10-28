const express = require('express');
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Counter = require('../models/Counter');
const { TRANSITIONS, FINAL } = require('../models/Application');

const router = express.Router();

const send = (res, code, success, message, data = null) =>
  res.status(code).json({ success, message, data });

const collation = { locale: 'en', strength: 2 }; // case-insensitive

const isFuture = (d) => {
  const date = new Date(d);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return date > endOfToday;
};

const validId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return send(res, 400, false, 'Invalid application id');
  next();
};

const findDuplicate = (company, role, excludeId) => {
  const q = { company, role, status: { $nin: FINAL } };
  if (excludeId) q._id = { $ne: excludeId };
  return Application.findOne(q).collation(collation);
};

// ---------- STATS (before /:id) ----------
router.get('/stats', async (req, res) => {
  try {
    const rows = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts = {
      Applied: 0, Interview: 0, Offer: 0, Accepted: 0, Rejected: 0, Declined: 0,
    };
    let total = 0;
    rows.forEach((r) => {
      counts[r._id] = r.count;
      total += r.count;
    });
    counts.Total = total;
    send(res, 200, true, 'Stats fetched', counts);
  } catch (e) {
    send(res, 500, false, e.message);
  }
});

// ---------- CREATE ----------
router.post('/', async (req, res) => {
  try {
    const { company, role, jobType, appliedDate, salary, notes } = req.body;

    if (!company?.trim() || !role?.trim() || !jobType || !appliedDate)
      return send(res, 400, false, 'Company, role, job type and applied date are required');
    if (!['Full-time', 'Internship', 'Contract'].includes(jobType))
      return send(res, 400, false, 'Invalid job type');
    if (isNaN(new Date(appliedDate)))
      return send(res, 400, false, 'Invalid applied date');
    if (isFuture(appliedDate))
      return send(res, 400, false, 'Applied date cannot be in the future');
    if (salary !== undefined && salary !== '' && (isNaN(salary) || Number(salary) < 0))
      return send(res, 400, false, 'Salary must be a positive number');

    const dup = await findDuplicate(company.trim(), role.trim());
    if (dup)
      return send(res, 409, false, 'An active application for this company and role already exists');

    const prefix = company.trim().replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const counter = await Counter.findByIdAndUpdate(
      prefix,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const applicationId = `JA-${prefix}-${String(counter.seq).padStart(3, '0')}`;

    const applied = new Date(appliedDate);
    const followUpDate = new Date(applied);
    followUpDate.setDate(followUpDate.getDate() + 7);

    const app = await Application.create({
      applicationId,
      company: company.trim(),
      role: role.trim(),
      jobType,
      appliedDate: applied,
      followUpDate,
      salary: salary === '' || salary === undefined ? undefined : Number(salary),
      notes,
      status: 'Applied',
      history: [{ status: 'Applied' }],
    });

    send(res, 201, true, 'Application created', app);
  } catch (e) {
    send(res, 500, false, e.message);
  }
});

// ---------- LIST ----------
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.company = { $regex: safe, $options: 'i' };
    }
    const apps = await Application.find(filter).sort({ createdAt: -1 });
    send(res, 200, true, 'Applications fetched', apps);
  } catch (e) {
    send(res, 500, false, e.message);
  }
});

// ---------- GET ONE ----------
router.get('/:id', validId, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return send(res, 404, false, 'Application not found');
    send(res, 200, true, 'Application fetched', app);
  } catch (e) {
    send(res, 500, false, e.message);
  }
});

// ---------- EDIT ----------
router.put('/:id', validId, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return send(res, 404, false, 'Application not found');

    const { company, role, jobType, salary, notes } = req.body;
    const newCompany = company !== undefined ? company.trim() : app.company;
    const newRole = role !== undefined ? role.trim() : app.role;

    if (!newCompany || !newRole)
      return send(res, 400, false, 'Company and role cannot be empty');
    if (jobType && !['Full-time', 'Internship', 'Contract'].includes(jobType))
      return send(res, 400, false, 'Invalid job type');
    if (salary !== undefined && salary !== '' && (isNaN(salary) || Number(salary) < 0))
      return send(res, 400, false, 'Salary must be a positive number');

    const changed =
      newCompany.toLowerCase() !== app.company.toLowerCase() ||
      newRole.toLowerCase() !== app.role.toLowerCase();
    if (changed && !FINAL.includes(app.status)) {
      const dup = await findDuplicate(newCompany, newRole, app._id);
      if (dup)
        return send(res, 409, false, 'An active application for this company and role already exists');
    }

    app.company = newCompany;
    app.role = newRole;
    if (jobType) app.jobType = jobType;
    if (salary !== undefined) app.salary = salary === '' ? undefined : Number(salary);
    if (notes !== undefined) app.notes = notes;
    // applicationId and appliedDate are intentionally never touched

    await app.save();
    send(res, 200, true, 'Application updated', app);
  } catch (e) {
    send(res, 500, false, e.message);
  }
});

// ---------- STATUS CHANGE ----------
router.patch('/:id/status', validId, async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return send(res, 404, false, 'Application not found');

    if (!status || !TRANSITIONS[status])
      return send(res, 400, false, 'Invalid status');
    if (!TRANSITIONS[app.status].includes(status))
      return send(res, 400, false, `Invalid transition: cannot move from ${app.status} to ${status}`);

    app.status = status;
    app.history.push({ status });
    await app.save();
    send(res, 200, true, `Status updated to ${status}`, app);
  } catch (e) {
    send(res, 500, false, e.message);
  }
});

// ---------- DELETE ----------
router.delete('/:id', validId, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return send(res, 404, false, 'Application not found');

    if (['Interview', 'Offer'].includes(app.status))
      return send(res, 400, false, `Cannot delete an application in ${app.status} status`);

    await app.deleteOne();
    send(res, 200, true, 'Application deleted');
  } catch (e) {
    send(res, 500, false, e.message);
  }
});

module.exports = router;