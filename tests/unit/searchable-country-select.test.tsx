import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchableCountrySelect } from '@/components/ui/searchable-country-select';

const SAMPLE_COUNTRIES = [
  { name: 'Gabon', code: 'GAB', flag: '🇬🇦' },
  { name: 'Georgia', code: 'GEO', flag: '🇬🇪' },
  { name: 'Germany', code: 'DEU', flag: '🇩🇪' },
  { name: 'Ghana', code: 'GHA', flag: '🇬🇭' },
  { name: 'Pakistan', code: 'PAK', flag: '🇵🇰' },
  { name: 'United States', code: 'USA', flag: '🇺🇸' },
];

describe('SearchableCountrySelect', () => {
  it('shows Germany first (and hides Global) when typing "g"', () => {
    const onCountryChange = vi.fn();
    render(
      <SearchableCountrySelect
        country="Global (All Countries)"
        onCountryChange={onCountryChange}
        countries={SAMPLE_COUNTRIES}
        userTier="ELITE"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'g' });

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('Germany');
    expect(options.some((opt) => opt.textContent?.includes('Global (All 250'))).toBe(false);
  });

  it('filters countries via A-Z jump strip and selects on click', () => {
    const onCountryChange = vi.fn();
    render(
      <SearchableCountrySelect
        country="Global (All Countries)"
        onCountryChange={onCountryChange}
        countries={SAMPLE_COUNTRIES}
        userTier="ELITE"
      />
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'G' }));

    const germanyOption = screen.getByRole('option', { name: /Germany/i });
    fireEvent.click(germanyOption);

    expect(onCountryChange).toHaveBeenCalledWith('Germany');
  });
});

