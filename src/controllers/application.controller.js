import Application from '../models/Application.js';
import Opportunity from '../models/Opportunity.js';
import Startup from '../models/Startup.js';
import User from '../models/User.js';

/* POST /api/applications — collaborator applies */
export async function applyToOpportunity(req, res) {
  try {
    const { opportunityId, portfolioLink, motivationMessage } = req.body;

    const opp = await Opportunity.findById(opportunityId);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });

    if (new Date(opp.deadline) < new Date())
      return res.status(400).json({ message: 'This opportunity has closed' });

    const applicant = await User.findById(req.user.userId);

    const app = await Application.create({
      opportunityId,
      startupId:      opp.startupId,
      applicantId:    req.user.userId,
      applicantEmail: applicant.email, // set server-side — never from body
      portfolioLink,
      motivationMessage,
    });

    await Opportunity.findByIdAndUpdate(opportunityId, { $inc: { applicantCount: 1 } });
    res.status(201).json(app);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You have already applied' });
    res.status(500).json({ message: err.message });
  }
}

/* GET /api/applications/mine — collaborator's own applications */
export async function getMyApplications(req, res) {
  try {
    const applicant = await User.findById(req.user.userId);
    const apps = await Application.find({ applicantEmail: applicant.email })
      .populate('opportunityId', 'roleTitle')
      .populate('startupId',     'startupName')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* GET /api/applications/opportunity/:oppId — founder sees apps for their opportunity */
export async function getApplicationsForOpportunity(req, res) {
  try {
    const opp = await Opportunity.findById(req.params.oppId);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });

    const founder = await User.findById(req.user.userId);
    if (opp.founderEmail !== founder.email)
      return res.status(403).json({ message: 'Forbidden' });

    const apps = await Application.find({ opportunityId: req.params.oppId }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* GET /api/applications/founder — all apps across founder's opportunities */
export async function getFounderApplications(req, res) {
  try {
    const startup = await Startup.findOne({ founderId: req.user.userId });
    if (!startup) return res.json([]);

    const opps   = await Opportunity.find({ startupId: startup._id }).select('_id');
    const oppIds = opps.map((o) => o._id);

    const apps = await Application.find({ opportunityId: { $in: oppIds } })
      .populate('opportunityId', 'roleTitle')
      .populate('applicantId',   'name email image')
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* PATCH /api/applications/:id — founder accepts or rejects */
export async function updateApplicationStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Status must be accepted or rejected' });

    const app    = await Application.findById(req.params.id).populate('opportunityId');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const founder = await User.findById(req.user.userId);
    if (app.opportunityId.founderEmail !== founder.email)
      return res.status(403).json({ message: 'Forbidden' });

    app.status = status;
    await app.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
