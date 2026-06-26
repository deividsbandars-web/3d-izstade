import { Response } from 'express';
import { getSupabaseAdminClient } from '../../src/backend/lib/supabaseAdmin.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

function getBootstrapCompanyName(email: string) {
  const localPart = String(email || '')
    .trim()
    .split('@')[0]
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();

  return `${localPart || 'Staging User'} Org`;
}

export const bootstrapAuthenticatedProfile = async (req: AuthRequest, res: Response) => {
  const userId = String(req.user?.id || '').trim();
  const email = String(req.user?.email || '').trim();

  if (!userId || !email) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const companyName = getBootstrapCompanyName(email);

  const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, company_id, email, plan')
    .eq('id', userId)
    .maybeSingle();

  if (profileLookupError) {
    return res.status(500).json({ error: `Failed to load bootstrap profile. ${profileLookupError.message}` });
  }

  let companyId = String(existingProfile?.company_id || '').trim();
  let bootstrapStatus: 'existing' | 'created' | 'repaired' = 'existing';

  if (companyId) {
    const { data: existingCompany, error: companyLookupError } = await supabaseAdmin
      .from('companies')
      .select('id, name, slug')
      .eq('id', companyId)
      .maybeSingle();

    if (companyLookupError) {
      return res.status(500).json({ error: `Failed to load bootstrap company. ${companyLookupError.message}` });
    }

    if (!existingCompany) {
      companyId = '';
    }
  }

  if (!companyId) {
    const { data: existingCompanyByName, error: companyNameLookupError } = await supabaseAdmin
      .from('companies')
      .select('id, name, slug')
      .eq('name', companyName)
      .maybeSingle();

    if (companyNameLookupError) {
      return res.status(500).json({ error: `Failed to inspect bootstrap company. ${companyNameLookupError.message}` });
    }

    if (existingCompanyByName?.id) {
      companyId = String(existingCompanyByName.id).trim();
      bootstrapStatus = existingProfile ? 'repaired' : 'existing';
    } else {
      const insertPayload: Record<string, unknown> = {
        contact_email: email,
        is_active: true,
        name: companyName,
      };

      const { data: insertedCompany, error: companyInsertError } = await supabaseAdmin
        .from('companies')
        .insert([insertPayload])
        .select('id, name, slug')
        .single();

      if (companyInsertError || !insertedCompany?.id) {
        return res.status(500).json({ error: `Failed to create bootstrap company. ${companyInsertError?.message || 'Unknown error'}` });
      }

      companyId = String(insertedCompany.id).trim();
      bootstrapStatus = existingProfile ? 'repaired' : 'created';
    }
  }

  if (!companyId) {
    return res.status(500).json({ error: 'Bootstrap company could not be resolved.' });
  }

  if (!existingProfile) {
    const { error: profileInsertError } = await supabaseAdmin
      .from('user_profiles')
      .insert([{
        company_id: companyId,
        email,
        id: userId,
        plan: 'pro',
      }]);

    if (profileInsertError) {
      return res.status(500).json({ error: `Failed to create bootstrap profile. ${profileInsertError.message}` });
    }

    return res.json({
      bootstrapStatus: 'created',
      companyId,
      companyName,
      profileId: userId,
    });
  }

  const profileCompanyId = String(existingProfile.company_id || '').trim();
  const profileEmail = String(existingProfile.email || '').trim();
  const profilePlan = String(existingProfile.plan || 'pro').trim() || 'pro';
  const needsProfileUpdate = profileCompanyId !== companyId || profileEmail !== email;

  if (needsProfileUpdate) {
    const { error: profileUpdateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        company_id: companyId,
        email,
        plan: profilePlan,
      })
      .eq('id', userId);

    if (profileUpdateError) {
      return res.status(500).json({ error: `Failed to repair bootstrap profile. ${profileUpdateError.message}` });
    }

    bootstrapStatus = 'repaired';
  }

  return res.json({
    bootstrapStatus,
    companyId,
    companyName,
    profileId: userId,
  });
};
