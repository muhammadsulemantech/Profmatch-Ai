import { describe, it, expect } from 'vitest';
import {
  getAllCountries,
  getCountryByNameOrCode,
  getRegionsForCountry,
} from '@/lib/geography/global-geography';
import {
  ACADEMIC_PLANS,
  getPlanConfig,
  isCountryUnlockedForTier,
  getRequiredTierForCountry,
} from '@/lib/services/usage-service';

describe('Global Geography & Plan Entitlements', () => {
  it('indexes 200+ countries and resolves aliases like Germany and USA', () => {
    const all = getAllCountries();
    expect(all.length).toBeGreaterThan(200);

    const germany = getCountryByNameOrCode('germany');
    expect(germany?.name).toBe('Germany');
    expect(germany?.code).toBe('DEU');

    const usa = getCountryByNameOrCode('us');
    expect(usa?.name).toBe('United States');

    const regions = getRegionsForCountry('Germany');
    expect(Array.isArray(regions)).toBe(true);
  });

  it('enforces tier-based country unlocking accurately', () => {
    expect(ACADEMIC_PLANS.FREE.tier).toBe('FREE');
    expect(getPlanConfig('PRO').tier).toBe('PRO');

    expect(isCountryUnlockedForTier('FREE', 'Germany')).toBe(true);
    expect(isCountryUnlockedForTier('FREE', 'United States')).toBe(false);
    expect(isCountryUnlockedForTier('PRO', 'United States')).toBe(true);
    expect(isCountryUnlockedForTier('ELITE', 'Global (All Countries)')).toBe(true);
    expect(getRequiredTierForCountry('Global (All Countries)')).toBe('ELITE');
  });
});
