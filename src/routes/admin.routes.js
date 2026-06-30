import { Router } from 'express';
import {
  getAllUsers, toggleBlockUser,
  getAllStartupsAdmin, updateStartupStatus, removeStartup,
  getTransactions, getAdminStats,
} from '../controllers/admin.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

const admin = [verifyToken, requireRole('admin')];

router.get('/users',           ...admin, getAllUsers);
router.patch('/users/:id/block',...admin, toggleBlockUser);
router.get('/startups',        ...admin, getAllStartupsAdmin);
router.patch('/startups/:id',  ...admin, updateStartupStatus);
router.delete('/startups/:id', ...admin, removeStartup);
router.get('/transactions',    ...admin, getTransactions);
router.get('/stats',           ...admin, getAdminStats);

export default router;
