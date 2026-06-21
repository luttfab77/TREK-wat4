// Uses the in-memory DB to seed flights and their endpoints, then checks the summed great-circle distance.
import { getFlightDistanceKm } from '../../src/services/distanceService';
import { createUser, createTrip, createReservation } from '../../tests/helpers/factories';
import { db } from '../helpers/db-singleton';

jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
jest.mock('../../src/config', () => require('../helpers/config-mock').CONFIG_MOCK);

// Adds a flight reservation owned via the given trip, with ordered endpoints.
function seedFlight(tripId: number, points: Array<[number, number]>, status = 'confirmed'): void {
  const res = createReservation(db, tripId, { type: 'flight' });
  db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, res.id);
  points.forEach(([lat, lng], i) => {
    db.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, lat, lng) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(res.id, i === 0 ? 'from' : 'to', i, `P${i}`, lat, lng);
  });
}

describe('getFlightDistanceKm', () => {
  it('sums the great-circle distance between consecutive endpoints', () => {
    // given -> a flight spanning one degree of longitude on the equator (roughly 111 km)
    const { user } = createUser(db);
    const trip = createTrip(db, user.id);
    seedFlight(trip.id, [
      [0, 0],
      [0, 1],
    ]);

    // when
    const distance = getFlightDistanceKm(user.id);

    // then
    expect(distance).toBe(111);
  });

  it('ignores cancelled flights', () => {
    // given -> the only flight is cancelled
    const { user } = createUser(db);
    const trip = createTrip(db, user.id);
    seedFlight(
      trip.id,
      [
        [0, 0],
        [0, 1],
      ],
      'cancelled',
    );

    // when
    const distance = getFlightDistanceKm(user.id);

    // then
    expect(distance).toBe(0);
  });

  it('returns 0 for a user with no flights', () => {
    // given
    const { user } = createUser(db);

    // when
    const distance = getFlightDistanceKm(user.id);

    // then
    expect(distance).toBe(0);
  });
});
