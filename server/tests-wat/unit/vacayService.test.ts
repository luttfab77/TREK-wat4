// Seeds a plan + entries in the in-memory DB and checks the per-user vacation-day calculation.
import { getOwnPlan, toggleEntry, getStats } from '../../src/services/vacayService';
import { createUser } from '../../tests/helpers/factories';
import { db } from '../helpers/db-singleton';

jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
jest.mock('../../src/config', () => require('../helpers/config-mock').CONFIG_MOCK);
jest.mock('../../src/websocket', () => ({ broadcastToUser: jest.fn(), broadcast: jest.fn() }));

const YEAR = new Date().getFullYear();

describe('vacayService stats', () => {
  it('counts used days and computes the remaining balance (default 30)', () => {
    // given -> a user with a plan and two vacation entries
    const { user } = createUser(db);
    const plan = getOwnPlan(user.id);
    toggleEntry(user.id, plan.id, `${YEAR}-07-01`, undefined);
    toggleEntry(user.id, plan.id, `${YEAR}-07-02`, undefined);

    // when
    const row = getStats(plan.id, YEAR).find((s) => s.user_id === user.id);

    // then
    expect(row).toBeDefined();
    expect(row!.vacation_days).toBe(30);
    expect(row!.used).toBe(2);
    expect(row!.remaining).toBe(28);
  });

  it('toggling the same date twice adds then removes the entry', () => {
    // given -> a user with a plan
    const { user } = createUser(db);
    const plan = getOwnPlan(user.id);

    // when
    const added = toggleEntry(user.id, plan.id, `${YEAR}-08-01`, undefined);
    const removed = toggleEntry(user.id, plan.id, `${YEAR}-08-01`, undefined);

    // then
    expect(added.action).toBe('added');
    expect(removed.action).toBe('removed');
    const row = getStats(plan.id, YEAR).find((s) => s.user_id === user.id);
    expect(row!.used).toBe(0);
  });
});
