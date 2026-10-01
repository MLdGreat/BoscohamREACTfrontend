import test from 'node:test';
import assert from 'node:assert/strict';

import { matchesIdempotentRoute, withIdempotencyHeader, createIdempotencyKey } from './idempotency.js';

test('matches the documented create routes', () => {
  assert.equal(matchesIdempotentRoute('/viewings', 'POST'), true);
  assert.equal(matchesIdempotentRoute('/bookings', 'POST'), true);
  assert.equal(matchesIdempotentRoute('/auth/login', 'POST'), false);
});

test('reuses the same key for the same request payload', () => {
  const body = { property_id: 'abc', email: 'user@example.com' };
  const keyA = createIdempotencyKey('/viewings', body);
  const keyB = createIdempotencyKey('/viewings', body);

  assert.equal(keyA, keyB);
  assert.equal(typeof keyA, 'string');
  assert.ok(keyA.startsWith('boscoham-'));
});

test('adds an idempotency header to the request when needed', () => {
  const options = withIdempotencyHeader('/viewings', {
    method: 'POST',
    headers: { Authorization: 'Bearer demo' },
  }, { property_id: 'abc', email: 'user@example.com' });

  assert.equal(options.headers['Authorization'], 'Bearer demo');
  assert.equal(typeof options.headers['Idempotency-Key'], 'string');
  assert.ok(options.headers['Idempotency-Key'].startsWith('boscoham-'));
});
