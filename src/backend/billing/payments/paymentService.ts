import { logger } from '../../logging/logger.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';
import { creditService } from '../credits/creditService.js';
import { eventPublisher } from '../../events/eventPublisher.js';
import { PlatformEvent } from '../../events/eventTypes.js';

export const paymentService = {
  /**
   * Simulates creating a Stripe Checkout Session for a plan upgrade or credit pack
   */
  async createCheckoutSession(userId: string, productId: string, _type: 'plan' | 'credits') {
    try {
      logger.info('PaymentService', `Creating checkout session for user ${userId}, product: ${productId} type: ${_type}`);
      
      const mockSessionUrl = `https://checkout.stripe.com/pay/cs_test_${Math.random().toString(36).substring(7)}`;

      return { data: { url: mockSessionUrl, session_id: 'cs_test_mock' }, error: null };
    } catch (error) {
      logger.error('PaymentService', 'Failed to create checkout session', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Upgrades a user's subscription plan directly (internal logic after successful payment)
   */
  async upgradePlan(userId: string, newPlan: string) {
    try {
      logger.info('PaymentService', `Upgrading user ${userId} to plan ${newPlan}`);
      
      const { data, error } = await supabaseClient
        .from('users')
        .update({ plan: newPlan.toLowerCase(), subscription_status: 'active' })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      await eventPublisher.publish(PlatformEvent.SUBSCRIPTION_CREATED, { userId, plan: newPlan });
      
      return { data, error: null };
    } catch (error) {
      logger.error('PaymentService', `Failed to upgrade plan for user ${userId}`, error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Handles Stripe webhooks (simulated)
   */
  async handleWebhook(eventPayload: any) {
    try {
      logger.info('PaymentService', 'Processing payment webhook', { eventType: eventPayload.type });
      
      switch (eventPayload.type) {
        case 'checkout.session.completed': {
          const session = eventPayload.data.object;
          const userId = session.metadata.user_id;
          const productType = session.metadata.type; // 'plan' or 'credits'
          
          await eventPublisher.publish(PlatformEvent.PAYMENT_RECEIVED, { userId, amount: session.amount_total, productType });
          
          if (productType === 'plan') {
            await this.upgradePlan(userId, session.metadata.plan_name);
          } else if (productType === 'credits') {
            await creditService.addCredits(userId, parseInt(session.metadata.credit_amount));
          }
          break;
        }
        case 'invoice.payment_failed': {
          const customerId = eventPayload.data.object.customer;
          logger.warn('PaymentService', `Payment failed for customer ${customerId}`);
          break;
        }
        default:
          logger.info('PaymentService', `Unhandled event type ${eventPayload.type}`);
      }

      return { success: true, error: null };
    } catch (error) {
      logger.error('PaymentService', 'Webhook processing failed', error);
      return { success: false, error: String(error) };
    }
  }
};

