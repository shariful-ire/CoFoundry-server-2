import { Router } from 'express';
import { register, login, me, signout, googleRedirect, googleCallback } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register',        register);
router.post('/login',           login);
router.get('/me',               me);
router.post('/signout',         signout);
router.get('/google',           googleRedirect);
router.get('/google/callback',  googleCallback);

export default router;
