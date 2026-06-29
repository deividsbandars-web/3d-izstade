import type { ModularHomePricingSourceType } from '../modularHomePricing';
import type {
  ModularHomeEstimateConfidence,
  ModularHomeEstimateLineItem,
  ModularHomeEstimatePriceSource,
} from './estimateTypes';

const ESTIMATE_CONFIDENCE_LABELS = {
  estimated: 'Estimate',
  packageFixed: 'Fixed package',
  requiresEngineering: 'Engineering review',
  siteDependent: 'Site-dependent',
} as const satisfies Record<ModularHomeEstimateConfidence, string>;

const ESTIMATE_PRICE_SOURCE_LABELS = {
  internalPreview: 'Internal preview',
  manualReviewRequired: 'Manual review',
  supplierPlaceholder: 'Supplier placeholder',
} as const satisfies Record<ModularHomeEstimatePriceSource, string>;

const ESTIMATE_SOURCE_TYPE_LABELS = {
  internalDatabase: 'Internal database',
  manualReview: 'Manual review',
  supplierBudgetPlaceholder: 'Supplier placeholder',
} as const satisfies Record<ModularHomePricingSourceType, string>;

export function getModularHomeEstimateConfidenceLabel(confidence: ModularHomeEstimateConfidence): string {
  return ESTIMATE_CONFIDENCE_LABELS[confidence];
}

export function getModularHomeEstimatePriceSourceLabel(priceSource: ModularHomeEstimatePriceSource): string {
  return ESTIMATE_PRICE_SOURCE_LABELS[priceSource];
}

export function getModularHomeEstimateSourceTypeLabel(sourceType: ModularHomePricingSourceType): string {
  return ESTIMATE_SOURCE_TYPE_LABELS[sourceType];
}

export function sumLineItems(items: readonly ModularHomeEstimateLineItem[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function roundToNearestFifty(amount: number): number {
  return Math.round(amount / 50) * 50;
}

export function roundToNearestEuro(amount: number): number {
  return Math.round(amount);
}

export function formatEstimateQuantity(value: number, suffix = ''): string {
  if (!Number.isFinite(value) || value <= 0) {
    return suffix ? `0${suffix}` : '1';
  }

  const rounded = Math.round(value * 10) / 10;

  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}${suffix}`;
}

export function getUnitCost(subtotal: number, quantity: number): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0 || subtotal <= 0) {
    return null;
  }

  return roundToNearestEuro(subtotal / quantity);
}

export function formatHomeEstimateEur(amount: number) {
  return new Intl.NumberFormat('en-IE', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}
