import { Request, Response } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const createCheckoutSession = async (req: Request, res: Response) => {
  const { sponsorId, priceId } = req.body;

  try {
    // 1. Get or Create Customer
    const { data: sponsor } = await supabase
      .from('sponsors')
      .select('stripe_customer_id, name')
      .eq('id', sponsorId)
      .single();

    let customerId = sponsor?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: sponsor?.name || sponsorId,
        metadata: { sponsorId },
      });
      customerId = customer.id;
      await supabase.from('sponsors').update({ stripe_customer_id: customerId }).eq('id', sponsorId);
    }

    // 2. Create Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/${sponsorId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing`,
      metadata: { sponsorId },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Note: requires express.raw() middleware for signature verification
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      const { data: sponsor } = await supabase
        .from('sponsors')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (sponsor) {
        await supabase.from('subscriptions').upsert({
          id: subscription.id,
          sponsor_id: sponsor.id,
          status: subscription.status,
          price_id: subscription.items.data[0].price.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });

        // Update tier in sponsors table based on price mapping
        const tier = mapPriceToTier(subscription.items.data[0].price.id);
        await supabase.from('sponsors').update({ subscription_tier: tier }).eq('id', sponsor.id);
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      
      const { data: sponsor } = await supabase
        .from('sponsors')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (sponsor) {
        await supabase.from('payments').insert({
          id: invoice.payment_intent as string || `inv_${invoice.id}`,
          sponsor_id: sponsor.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: 'succeeded',
          type: invoice.subscription ? 'SUBSCRIPTION' : 'OVERAGE',
        });
      }
      break;
    }
  }

  res.json({ received: true });
};

const mapPriceToTier = (priceId: string): string => {
    // Map your Stripe Price IDs to tiers
    if (priceId === process.env.STRIPE_PRICE_BASIC) return 'BASIC';
    if (priceId === process.env.STRIPE_PRICE_INTERACTIVE) return 'INTERACTIVE';
    if (priceId === process.env.STRIPE_PRICE_PREMIUM) return 'PREMIUM';
    return 'FREE';
};
