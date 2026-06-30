import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  monthly: parseInt(process.env.STRIPE_PRICE_MONTHLY) || 1200, // $12.00
  annual:  parseInt(process.env.STRIPE_PRICE_ANNUAL)  || 9900, // $99.00
};

/* POST /api/payment/create-checkout */
export async function createCheckout(req, res) {
  try {
    const { plan } = req.body;
    if (!['monthly', 'annual'].includes(plan))
      return res.status(400).json({ message: 'Invalid plan' });

    const user = await User.findById(req.user.userId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode:                 'payment',
      customer_email:       user.email,
      line_items: [{
        price_data: {
          currency:     'usd',
          unit_amount:  PRICES[plan],
          product_data: {
            name: `CoFoundry Premium — ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
          },
        },
        quantity: 1,
      }],
      metadata:   { userId: req.user.userId, plan },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.CLIENT_URL}/dashboard/founder/premium`,
    });

    // Create a pending payment record
    await Payment.create({
      userId:          req.user.userId,
      userEmail:       user.email,
      stripeSessionId: session.id,
      plan,
      amount:          PRICES[plan],
      status:          'pending',
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* POST /api/payment/webhook — Stripe calls this after payment */
export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ message: 'Webhook signature invalid' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, plan } = session.metadata;

    await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      { status: 'paid', paidAt: new Date() }
    );
    await User.findByIdAndUpdate(userId, { isPremium: true });
  }

  res.json({ received: true });
}
