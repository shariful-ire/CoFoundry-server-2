import Opportunity from '../models/Opportunity.js';
import Startup from '../models/Startup.js';
import User from '../models/User.js';

const FREE_LIMIT = 3;

/* POST /api/opportunities */
export async function createOpportunity(req, res) {
  try {
    const startup = await Startup.findOne({ founderId: req.user.userId, status: 'approved' });
    if (!startup) return res.status(404).json({ message: 'Approved startup not found' });

    const founder = await User.findById(req.user.userId);
    if (!founder.isPremium) {
      const count = await Opportunity.countDocuments({ founderEmail: founder.email });
      if (count >= FREE_LIMIT)
        return res.status(403).json({ message: 'Free limit reached. Upgrade to Premium.' });
    }

    const { roleTitle, requiredSkills, workType, commitmentLevel, deadline } = req.body;
    const opp = await Opportunity.create({
      startupId:    startup._id,
      founderEmail: founder.email, // set server-side — never from body
      roleTitle, requiredSkills, workType, commitmentLevel, deadline,
    });
    res.status(201).json(opp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* GET /api/opportunities/mine — founder's opportunities */
export async function getMyOpportunities(req, res) {
  try {
    const startup = await Startup.findOne({ founderId: req.user.userId });
    if (!startup) return res.json({ data: [], totalCount: 0 });

    const data = await Opportunity.find({ startupId: startup._id }).sort({ createdAt: -1 });
    res.json({ data, totalCount: data.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* GET /api/opportunities — public browse with server-side pagination */
export async function getAllOpportunities(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 6);
    const skip  = (page - 1) * limit;

    const filter = { deadline: { $gte: new Date() } };
    if (req.query.workType)  filter.workType  = req.query.workType;
    if (req.query.startupId) filter.startupId = req.query.startupId;

    const [data, totalCount] = await Promise.all([
      Opportunity.find(filter).populate('startupId', 'startupName industry').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Opportunity.countDocuments(filter),
    ]);
    res.json({ data, totalCount, totalPages: Math.ceil(totalCount / limit), page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* GET /api/opportunities/:id */
export async function getOpportunityById(req, res) {
  try {
    const opp = await Opportunity.findById(req.params.id).populate('startupId', 'startupName industry description');
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    res.json(opp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* PUT /api/opportunities/:id */
export async function updateOpportunity(req, res) {
  try {
    const founder = await User.findById(req.user.userId);
    const opp = await Opportunity.findOne({ _id: req.params.id, founderEmail: founder.email });
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    const { roleTitle, requiredSkills, workType, commitmentLevel, deadline } = req.body;
    Object.assign(opp, { roleTitle, requiredSkills, workType, commitmentLevel, deadline });
    await opp.save();
    res.json(opp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* DELETE /api/opportunities/:id */
export async function deleteOpportunity(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    const opp  = await Opportunity.findOneAndDelete({ _id: req.params.id, founderEmail: user.email });
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
