import { Router } from 'express';
import {
  applyToOpportunity, getMyApplications,
  getFounderApplications, getApplicationsForOpportunity,
  updateApplicationStatus,
} from '../controllers/application.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.post('/',                           verifyToken, requireRole('collaborator'), applyToOpportunity);
router.get('/mine',                        verifyToken, requireRole('collaborator'), getMyApplications);
router.get('/founder',                     verifyToken, requireRole('founder'),      getFounderApplications);
router.get('/opportunity/:oppId',          verifyToken, requireRole('founder'),      getApplicationsForOpportunity);
router.patch('/:id',                       verifyToken, requireRole('founder'),      updateApplicationStatus);

export default router;
