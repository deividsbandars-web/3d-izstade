import type { Response } from 'express';
import { billingApplicationService } from '../../src/backend/billing/billingApplicationService.js';
import { configureBoothSlotCheckoutHandlers } from '../../src/backend/billing/payments/paymentService.js';
import {
  cancelBoothSlotReservation,
  createBoothSlotReservation,
  finalizePaidBoothSlotReservation,
  getBoothSlotCheckoutProduct,
  listBoothSlotAvailability,
  markBoothSlotCheckoutStarted,
  type BoothSlotMarketplaceError,
} from '../../src/backend/expo/boothSlots/boothSlotMarketplaceService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

configureBoothSlotCheckoutHandlers({
  finalizePaidBoothSlotReservation,
  getBoothSlotCheckoutProduct,
  markBoothSlotCheckoutStarted,
});

type ReserveBoothSlotBody = {
  companyName?: unknown;
  contactEmail?: unknown;
  metadata?: unknown;
  website?: unknown;
};

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getErrorStatus(error: unknown) {
  const candidate = error as Partial<BoothSlotMarketplaceError> | null;
  const status = Number(candidate?.status);
  return Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
}

function getErrorCode(error: unknown) {
  const candidate = error as Partial<BoothSlotMarketplaceError> | null;
  return candidate?.code || 'BOOTH_SLOT_MARKETPLACE_ERROR';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Booth slot marketplace request failed.');
}

function getMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function listBoothSlots(_req: AuthRequest, res: Response) {
  try {
    const slots = await listBoothSlotAvailability();
    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      slots,
    });
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      code: getErrorCode(error),
      error: getErrorMessage(error),
    });
  }
}

export async function reserveBoothSlot(req: AuthRequest, res: Response) {
  const userId = normalizeString(req.user?.id);
  if (!userId) {
    return res.status(401).json({ code: 'BOOTH_SLOT_AUTH_REQUIRED', error: 'Authentication required.' });
  }

  const slotId = normalizeString(req.params.slotId);
  const body = (req.body ?? {}) as ReserveBoothSlotBody;

  try {
    const { reservation, slot } = await createBoothSlotReservation({
      companyName: body.companyName,
      contactEmail: body.contactEmail,
      metadata: {
        ...getMetadata(body.metadata),
        source: 'booth-marketplace',
      },
      slotId,
      userEmail: req.user?.email ?? null,
      userId,
      website: body.website,
    });
    const checkout = await billingApplicationService.createCheckoutSession(userId, reservation.id, 'booth-slot');

    if (checkout.error || !checkout.data) {
      await cancelBoothSlotReservation(reservation.id).catch(() => undefined);
      return res.status(checkout.error?.status ?? 500).json({
        code: checkout.error?.code ?? 'BOOTH_SLOT_CHECKOUT_FAILED',
        error: checkout.error?.message ?? 'Could not create checkout session for this booth slot.',
      });
    }

    return res.status(201).json({
      checkout: checkout.data,
      reservation: {
        amountCents: reservation.amount_cents,
        companyName: reservation.company_name,
        currency: reservation.currency,
        expiresAt: reservation.expires_at,
        id: reservation.id,
        slotId: reservation.slot_id,
        status: reservation.status,
      },
      slot,
    });
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      code: getErrorCode(error),
      error: getErrorMessage(error),
    });
  }
}
