import { Router } from 'express';
import express from 'express';
import { createCheckout, stripeWebhook } from '../controllers/payment.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = Router();

router.post('/create-checkout', verifyToken, createCheckout);

// Stripe sends raw body — must bypass express.json() for this route
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
