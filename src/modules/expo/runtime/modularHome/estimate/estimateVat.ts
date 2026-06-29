import { createVatPricingBreakdown } from '../modularHomePricing';
import { MODULAR_HOME_ESTIMATE_CONFIG, type ModularHomeEstimateLineItem } from './estimateTypes';
import { roundToNearestFifty } from './estimateFormatting';
import { createEstimateMetadata } from './estimateMetadata';

export function createVatEstimate(taxableAmount: number): ModularHomeEstimateLineItem {
  const amount = roundToNearestFifty(taxableAmount * MODULAR_HOME_ESTIMATE_CONFIG.vatRate);
  const label = 'VAT placeholder';
  const note = `${Math.round(MODULAR_HOME_ESTIMATE_CONFIG.vatRate * 100)}% placeholder for review estimates only.`;

  return {
    amount,
    category: 'vat',
    id: 'vat-placeholder',
    isPlaceholder: true,
    label,
    note,
    pricingBreakdown: createVatPricingBreakdown(amount),
    ...createEstimateMetadata({
      confidence: 'estimated',
      isPlaceholder: true,
      label,
      note,
      priceSource: 'internalPreview',
      sectionId: 'vatMarginContingency',
      sourceCategory: 'vat',
    }),
  };
}
