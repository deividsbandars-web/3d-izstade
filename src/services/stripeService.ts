import { supabase } from '../core/supabase.js';

export const stripeService = {
  // Izveidot apmaksas sesiju
  async createCheckoutSession(amount: number, projectName: string) {
    try {
      // Šī ir simulācija Edge funkcijai, kas izveidotu reālu Stripe sesiju
      console.log(`Iniciē Stripe maksājumu: ${amount}€ priekš ${projectName}`);
      
      // 1. Reģistrējam rēķinu Supabase
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          amount,
          status: 'unpaid',
          project_id: null, // Šeit būtu reāls ID
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Simulējam novirzīšanu uz Stripe (reālajā dzīvē te būtu URL no Stripe API)
      return {
        url: `https://checkout.stripe.com/pay/simulated_session_${data.id}`,
        invoiceId: data.id
      };
    } catch (e) {
      console.error("Stripe Error:", e);
      throw e;
    }
  },

  // Pārbaudīt maksājuma statusu
  async checkPaymentStatus(invoiceId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single();
    
    if (error) throw error;
    return data.status === 'paid';
  }
};
