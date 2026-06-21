// Pure, date-based. The clock is frozen at 2026-06-15 so "today" is deterministic.
import { computeJourneyLifecycle, type JourneyLifecycle } from '../../src/utils/journeyLifecycle';

describe('computeJourneyLifecycle', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it.each<[string, string, string | null, string | null, JourneyLifecycle]>([
    ['archived wins even inside a live window', 'archived', '2026-06-01', '2026-06-30', 'archived'],
    ['today inside the window is live', 'active', '2026-06-01', '2026-06-30', 'live'],
    ['a future window is upcoming', 'active', '2026-07-01', '2026-07-10', 'upcoming'],
    ['a past window is completed', 'active', '2026-01-01', '2026-01-31', 'completed'],
    ['no dates is draft', 'active', null, null, 'draft'],
    ['start only, in the future, is upcoming', 'active', '2026-07-01', null, 'upcoming'],
  ])('%s', (_label, status, tripDateMin, tripDateMax, expected) => {
    // when
    const lifecycle = computeJourneyLifecycle(status, tripDateMin, tripDateMax);

    // then
    expect(lifecycle).toBe(expected);
  });
});
