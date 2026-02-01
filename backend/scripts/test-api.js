/**
 * Quick API smoke test. Run from backend: node scripts/test-api.js
 * Requires: backend running on PORT (5001), MySQL with DB set up.
 */
const BASE = process.env.API_BASE || 'http://localhost:5001/api';

async function request(method, path, body = null, token = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function run() {
  const results = [];
  let ownerToken, userToken;

  try {
    // 1. Register owner
    const regOwner = await request('POST', '/auth/register', {
      name: 'Test Owner',
      email: `owner-${Date.now()}@test.com`,
      password: 'password123',
      role: 'owner',
    });
    results.push({ step: 'Register owner', status: regOwner.status, ok: regOwner.status === 201 });
    if (regOwner.status !== 201) {
      console.log('Register owner:', regOwner.data);
      throw new Error('Register owner failed');
    }
    ownerToken = regOwner.data?.token;

    // 2. Register user
    const regUser = await request('POST', '/auth/register', {
      name: 'Test User',
      email: `user-${Date.now()}@test.com`,
      password: 'password123',
      role: 'user',
    });
    results.push({ step: 'Register user', status: regUser.status, ok: regUser.status === 201 });
    if (regUser.status !== 201) throw new Error('Register user failed');
    userToken = regUser.data?.token;

    // 3. Get restaurants (public)
    const getRest = await request('GET', '/restaurants');
    results.push({ step: 'GET /restaurants', status: getRest.status, ok: getRest.status === 200 });
    if (getRest.status !== 200) console.log('GET restaurants:', getRest.data);

    // 4. Owner: get my restaurants
    const myRest = await request('GET', '/restaurants/my', null, ownerToken);
    results.push({ step: 'GET /restaurants/my (owner)', status: myRest.status, ok: myRest.status === 200 });
    if (myRest.status !== 200) console.log('GET my restaurants:', myRest.data);

    // 5. Owner: add restaurant
    const addRest = await request(
      'POST',
      '/restaurants',
      { name: 'Test Bistro', cuisine: 'Italian', location: 'Downtown', totalSeats: 20 },
      ownerToken
    );
    results.push({ step: 'POST /restaurants (add)', status: addRest.status, ok: addRest.status === 201 });
    if (addRest.status !== 201) console.log('Add restaurant:', addRest.data);
    const restaurantId = addRest.data?.id;

    // 6. Get availability (public)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    const avail = await request('GET', `/restaurants/${restaurantId}/availability?date=${dateStr}&time=12:00`);
    results.push({ step: 'GET availability', status: avail.status, ok: avail.status === 200 });
    if (avail.status !== 200) console.log('Availability:', avail.data);

    // 7. User: create reservation
    const createRes = await request(
      'POST',
      '/reservations',
      {
        restaurantId,
        date: dateStr,
        time: '12:00',
        guests: 2,
        contactNumber: '+1234567890',
      },
      userToken
    );
    results.push({ step: 'POST /reservations', status: createRes.status, ok: createRes.status === 201 });
    if (createRes.status !== 201) console.log('Create reservation:', createRes.data);

    // 8. User: my reservations
    const myRes = await request('GET', '/reservations/my', null, userToken);
    results.push({ step: 'GET /reservations/my', status: myRes.status, ok: myRes.status === 200 });
  } catch (err) {
    results.push({ step: 'Error', status: '-', ok: false, message: err.message });
  }

  // Summary
  console.log('\n--- API test results ---');
  results.forEach((r) => {
    const mark = r.ok ? '✓' : '✗';
    console.log(`${mark} ${r.step}: ${r.status}${r.message ? ' - ' + r.message : ''}`);
  });
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
