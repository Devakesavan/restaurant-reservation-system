import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRestaurants, createReservation, getMyReservations, getSeatsAvailability } from '../services/api';

// Build time options: 9:00 AM to 10:00 PM, 30-min steps. value = 24h "HH:mm", label = "h:mm AM/PM"
function buildTimeOptions() {
  const options = [];
  for (let h = 9; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break;
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      const label = `${h12}:${m === 0 ? '00' : '30'} ${ampm}`;
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push({ value, label });
    }
  }
  return options;
}
const TIME_OPTIONS = buildTimeOptions();

function timeTo12h(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m || 0).padStart(2, '0')} ${ampm}`;
}

export default function BookReservation() {
  const { restaurantId } = useParams();
  const [restaurants, setRestaurants] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [form, setForm] = useState({
    restaurantId: restaurantId ? Number(restaurantId) : '',
    date: '',
    time: '',
    guests: 1,
    contactNumber: '',
  });
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('book');

  useEffect(() => {
    getRestaurants().then(({ data }) => setRestaurants(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (restaurantId) setForm((f) => ({ ...f, restaurantId: Number(restaurantId) }));
  }, [restaurantId]);

  useEffect(() => {
    if (!form.restaurantId || !form.date || !form.time) {
      setAvailability(null);
      return;
    }
    getSeatsAvailability(form.restaurantId, form.date, form.time)
      .then(({ data }) => setAvailability(data))
      .catch(() => setAvailability(null));
  }, [form.restaurantId, form.date, form.time]);

  const loadMyReservations = async () => {
    try {
      const { data } = await getMyReservations();
      setMyReservations(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations');
    }
  };

  useEffect(() => {
    if (tab === 'my') loadMyReservations();
  }, [tab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'restaurantId' || name === 'guests' ? Number(value) || value : value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await createReservation({
        restaurantId: form.restaurantId,
        date: form.date,
        time: form.time,
        guests: form.guests,
        contactNumber: form.contactNumber,
      });
      setSuccess('Reservation created successfully.');
      setForm({ ...form, date: '', time: '', guests: 1, contactNumber: '' });
      if (tab === 'my') loadMyReservations();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwner = user.role === 'owner';
  const isAdmin = user.role === 'admin';

  return (
    <>
      <nav>
        <Link to="/">Restaurants</Link>
        <Link to="/book" style={{ fontWeight: 'bold' }}>Book Reservation</Link>
        {isOwner && <Link to="/owner">My Restaurants</Link>}
        {isAdmin && <Link to="/admin">Admin Dashboard</Link>}
      </nav>
      <div className="container">
        <div style={{ marginBottom: 16 }}>
          <button type="button" className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => setTab('book')}>Book a Table</button>
          <button type="button" className="btn btn-secondary" onClick={() => setTab('my')}>My Reservations</button>
        </div>

        {tab === 'book' && (
          <div className="card">
            <h2>Book a Reservation</h2>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Restaurant</label>
                <select name="restaurantId" value={form.restaurantId} onChange={handleChange} required>
                  <option value="">Select restaurant</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} — {r.cuisine}, {r.location}{r.totalSeats != null ? ` · ${r.totalSeats} seats` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Time</label>
                <select name="time" value={form.time} onChange={handleChange} required>
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {availability != null && (
                <p className={availability.available === 0 ? 'error' : 'success'} style={{ marginBottom: 8 }}>
                  {availability.available === 0
                    ? 'This slot is fully booked. Please choose another date or time.'
                    : `${availability.available} seat(s) available for this slot (total capacity: ${availability.totalSeats})`}
                </p>
              )}
              <div className="form-group">
                <label>Number of guests</label>
                <input
                  type="number"
                  name="guests"
                  min={1}
                  max={availability?.available ?? 999}
                  value={form.guests}
                  onChange={handleChange}
                  required
                  disabled={availability != null && availability.available === 0}
                />
              </div>
              <div className="form-group">
                <label>Contact number</label>
                <input type="tel" name="contactNumber" value={form.contactNumber} onChange={handleChange} required placeholder="e.g. +1234567890" />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (availability != null && availability.available === 0)}
              >
                {loading ? 'Booking...' : availability?.available === 0 ? 'Slot fully booked' : 'Confirm Reservation'}
              </button>
            </form>
          </div>
        )}

        {tab === 'my' && (
          <div className="card">
            <h2>My Reservations</h2>
            {error && <p className="error">{error}</p>}
            {myReservations.length === 0 ? (
              <p>You have no reservations.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {myReservations.map((res) => (
                  <li key={res.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                    <strong>{res.Restaurant?.name}</strong> — {res.Restaurant?.cuisine}, {res.Restaurant?.location}<br />
                    {res.date} at {timeTo12h(res.time)} · {res.guests} guest(s) · Contact: {res.contactNumber}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
