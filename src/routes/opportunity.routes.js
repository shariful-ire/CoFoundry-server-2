import { Router } from 'express';
import {
  createOpportunity, getMyOpportunities, getAllOpportunities,
  getOpportunityById, updateOpportunity, deleteOpportunity,
} from '../controllers/opportunity.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.get('/',       getAllOpportunities);
router.get('/mine',   verifyToken, requireRole('founder'), getMyOpportunities);
router.get('/:id',    getOpportunityById);
router.post('/',      verifyToken, requireRole('founder'), createOpportunity);
router.put('/:id',    verifyToken, requireRole('founder'), updateOpportunity);
router.delete('/:id', verifyToken, requireRole('founder'), deleteOpportunity);

export default router;
