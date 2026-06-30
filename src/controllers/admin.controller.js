import User from '../models/User.js';
import Startup from '../models/Startup.js';
import Opportunity from '../models/Opportunity.js';
import Payment from '../models/Payment.js';

/* GET /api/admin/users */
export async function getAllUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* PATCH /api/admin/users/:id/block */
export async function toggleBlockUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot block an admin' });

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ isBlocked: user.isBlocked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* GET /api/admin/startups */
export async function getAllStartupsAdmin(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const startups = await Startup.find(filter).sort({ createdAt: -1 });
    res.json(startups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* PATCH /api/admin/startups/:id */
export async function updateStartupStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const startup = await Startup.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!startup) return res.status(404).json({ message: 'Startup not found' });
    res.json(startup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* DELETE /api/admin/startups/:id */
export async function removeStartup(req, res) {
  try {
    const startup = await Startup.findByIdAndDelete(req.params.id);
    if (!startup) return res.status(404).json({ message: 'Startup not found' });
    res.json({ message: 'Startup removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* GET /api/admin/transactions */
export async function getTransactions(req, res) {
  try {
    const payments = await Payment.find().populate('userId', 'name email').sort({ createdAt: -1 });
    const totalRevenue = payments
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + p.amount, 0) / 100; // cents → dollars
    res.json({ payments, totalRevenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* GET /api/admin/stats */
export async function getAdminStats(req, res) {
  try {
    const [userCount, startupCount, opportunityCount, paidPayments] = await Promise.all([
      User.countDocuments(),
      Startup.countDocuments(),
      Opportunity.countDocuments(),
      Payment.find({ status: 'paid' }),
    ]);
    const totalRevenue = paidPayments.reduce((s, p) => s + p.amount, 0) / 100;
    res.json({ userCount, startupCount, opportunityCount, totalRevenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
