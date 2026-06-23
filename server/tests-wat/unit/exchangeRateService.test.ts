import { convertWithRates } from '../../src/services/exchangeRateService';

describe('convertWithRates', () => {
  it('returns the amount unchanged for the same currency', () => {
    // given
    const rates = { EUR: 1, USD: 1.1 };

    // when
    const result = convertWithRates(100, 'EUR', 'EUR', rates);

    // then
    expect(result).toBe(100);
  });

  it('returns the amount unchanged when no rates are available', () => {
    // given
    const rates = null;

    // when
    const result = convertWithRates(100, 'USD', 'EUR', rates);

    // then
    expect(result).toBe(100);
  });

  it('divides by the rate of the source currency', () => {
    // given
    const rates = { EUR: 1, USD: 2 };

    // when
    const result = convertWithRates(100, 'USD', 'EUR', rates);

    // then
    expect(result).toBe(50);
  });

  it('falls back to identity when the source rate is missing or invalid', () => {
    // given
    const missing = { EUR: 1 };
    const zero = { EUR: 1, GBP: 0 };

    // when
    const onMissing = convertWithRates(100, 'GBP', 'EUR', missing);
    const onZero = convertWithRates(100, 'GBP', 'EUR', zero);

    // then
    expect(onMissing).toBe(100);
    expect(onZero).toBe(100);
  });
});

describe('getRates', () => {
  // getRates keeps a module-level rate cache, so reset modules + re-import before
  // each test to start from a clean cache instead of relying on unique bases.
  let getRates: typeof import('../../src/services/exchangeRateService').getRates;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    ({ getRates } = require('../../src/services/exchangeRateService'));
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null when the upstream fetch fails', async () => {
    // given
    fetchSpy.mockRejectedValue(new Error('offline'));

    // when
    const rates = await getRates('EUR');

    // then
    expect(rates).toBeNull();
  });

  it('parses the frankfurter response and seeds the base with 1', async () => {
    // given
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => [
        { quote: 'USD', rate: 1.1 },
        { quote: 'GBP', rate: 0.85 },
      ],
    } as unknown as Response);

    // when
    const rates = await getRates('EUR');

    // then
    expect(rates).toEqual({ EUR: 1, USD: 1.1, GBP: 0.85 });
  });

  it('caches the result so a second call does not fetch again', async () => {
    // given
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => [{ quote: 'USD', rate: 1.2 }],
    } as unknown as Response);

    // when
    const first = await getRates('EUR');
    const second = await getRates('EUR');

    // then
    expect(second).toEqual(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
