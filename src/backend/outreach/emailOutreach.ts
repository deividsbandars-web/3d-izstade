import { createSystemLlmMetering, llmService } from '../ai/llmService.js';
import { logger } from '../logging/logger.js';
import { Resend } from 'resend';
import { supabaseClient } from '../../lib/supabaseClient.js';

// Helper to get environment variables in both Vite and Node.js environments
const getEnv = (name: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${name}`]) {
    return import.meta.env[`VITE_${name}`];
  }
  return '';
};

const resendApiKey = getEnv('RESEND_API_KEY');
let resend: Resend | null = null;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  logger.warn('EmailOutreach', 'RESEND_API_KEY is missing. Email sending will be disabled.');
}

export const emailOutreach = {
  /**
   * Generates a personalized email pitch using LLM based on lead data
   */
  async generateEmailPitch(lead: any, productContext: string) {
    try {
      logger.info('EmailOutreach', `Generating pitch for ${lead.company_name || 'Unknown Company'}`);
      
      const prompt = `You are a top-performing Sales Executive. 
      Write a highly personalized, compelling, and concise cold email pitch for the company "${lead.company_name}".
      Here is the product/service we are selling: ${productContext}
      
      Keep it professional but human. Include a clear Call to Action.
      Format the output as a valid JSON object with "subject" and "body" fields.`;
      
      const { text, error } = await llmService.generateText(prompt, {
        metering: createSystemLlmMetering('email-outreach', 'generate-email-pitch'),
        temperature: 0.7,
      });
      if (error) throw new Error(error);

      // Simple JSON extraction logic
      try {
        const jsonMatch = text?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return { data: JSON.parse(jsonMatch[0]), error: null };
        }
      } catch (e) {
        logger.warn('EmailOutreach', 'Failed to parse AI output as JSON, falling back to raw text');
      }

      return { 
        data: { 
          subject: `Partnership opportunity for ${lead.company_name}`, 
          body: text 
        }, 
        error: null 
      };
    } catch (error) {
      logger.error('EmailOutreach', 'Failed to generate pitch', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Sends a real email via Resend and logs the transaction to Supabase
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    leadId?: string;
    userId?: string;
    from?: string;
  }) {
    const { to, subject, body, leadId, userId, from } = params;

    try {
      logger.info('EmailOutreach', `Sending REAL email to ${to}`);

      if (!resend) {
        throw new Error('Resend client not initialized. Check RESEND_API_KEY.');
      }

      // 1. Log as 'pending' in database
      const { data: logEntry, error: logError } = await supabaseClient
        .from('outreach_logs')
        .insert([{
          lead_id: leadId,
          user_id: userId,
          recipient_email: to,
          subject: subject,
          body_html: body,
          status: 'pending'
        }])
        .select()
        .single();

      if (logError) {
        logger.warn('EmailOutreach', `DB logging failed: ${logError.message}`);
      }

      // 2. Perform the actual send
      const sender = from || 'Warpala OS <outreach@warpala.com>';
      const { data: resendData, error: resendError } = await resend.emails.send({
        from: sender,
        to: [to],
        subject: subject,
        html: body,
      });

      if (resendError) {
        // Update log as failed
        if (logEntry) {
          await supabaseClient
            .from('outreach_logs')
            .update({ status: 'failed', error_message: resendError.message })
            .eq('id', logEntry.id);
        }
        throw resendError;
      }

      // 3. Update log as sent
      if (logEntry) {
        await supabaseClient
          .from('outreach_logs')
          .update({ 
            status: 'sent', 
            provider_message_id: resendData?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', logEntry.id);
      }

      // 4. Update the lead status
      if (leadId) {
        await supabaseClient
          .from('leads')
          .update({ contacted: true, status: 'contacted' })
          .eq('id', leadId);
      }

      return { success: true, messageId: resendData?.id, error: null };
    } catch (error) {
      logger.error('EmailOutreach', 'Failed to send email', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Tracks delivery status (Placeholder for webhook integration)
   */
  async trackDelivery(messageId: string, status: string) {
    try {
      logger.info('EmailOutreach', `Tracking delivery for ${messageId}: ${status}`);
      
      const { error } = await supabaseClient
        .from('outreach_logs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('provider_message_id', messageId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('EmailOutreach', 'Failed to track delivery', error);
      return { success: false, error: String(error) };
    }
  }
};
