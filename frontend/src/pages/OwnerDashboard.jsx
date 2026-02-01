import { useState, useEffect } from 'react';
import AppNav from '../components/AppNav';
import {
  getMyRestaurants,
  getRestaurantBookings,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '../services/api';

export default function OwnerDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [bookingsView, setBookingsView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addForm, setAddForm] = useState({ name: '', cuisine: '', location: '', rating: '', totalSeats: '20' });
  const [editForm, setEditForm] = useState({ name: '', cuisine: '', location: '', rating: '', totalSeats: '' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadMyRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getMyRestaurants();
      setRestaurants(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRestaurants();
  }, []);

  const loadBookings = async (id) => {
    try {
      const { data } = await getRestaurantBookings(id);
      setBookingsView(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    }
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await addRestaurant({
        name: addForm.name,
        cuisine: addForm.cuisine,
        location: addForm.location,
        rating: addForm.rating || undefined,
        totalSeats: Number(addForm.totalSeats) || 1,
      });
      setRestaurants((prev) => [data, ...prev]);
      setAddForm({ name: '', cuisine: '', location: '', rating: '', totalSeats: '20' });
      setShowAddForm(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Add failed');
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditForm({
      name: r.name,
      cuisine: r.cuisine,
      location: r.location,
      rating: r.rating ?? '',
      totalSeats: String(r.totalSeats ?? 1),
    });
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await updateRestaurant(editingId, {
        name: editForm.name,
        cuisine: editForm.cuisine,
        location: editForm.location,
        rating: editForm.rating || undefined,
        totalSeats: Number(editForm.totalSeats) || 1,
      });
      setRestaurants((prev) => prev.map((x) => (x.id === data.id ? data : x)));
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete restaurant "${name}"? This will remove all its reservations.`)) return;
    try {
      await deleteRestaurant(id);
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
      if (bookingsView?.restaurant?.id === id) setBookingsView(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <>
      <AppNav user={user} />
      <div className="app-container">
        <h1>My Restaurants</h1>
        <p className="text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
          Manage your restaurants and total seats. Seat availability updates automatically when users book.
        </p>

        {showAddForm && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 className="card-title">Add Restaurant</h3>
            <form onSubmit={handleAddRestaurant}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required placeholder="Restaurant name" />
              </div>
              <div className="form-group">
                <label>Cuisine</label>
                <input type="text" value={addForm.cuisine} onChange={(e) => setAddForm({ ...addForm, cuisine: e.target.value })} required placeholder="e.g. Italian" />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} required placeholder="Address or area" />
              </div>
              <div className="form-group">
                <label>Rating (0–5, optional)</label>
                <input type="number" min={0} max={5} step={0.1} value={addForm.rating} onChange={(e) => setAddForm({ ...addForm, rating: e.target.value })} placeholder="—" />
              </div>
              <div className="form-group">
                <label>Total seats per restaurant</label>
                <input type="number" min={1} value={addForm.totalSeats} onChange={(e) => setAddForm({ ...addForm, totalSeats: e.target.value })} required placeholder="e.g. 50" />
              </div>
              <button type="submit" className="btn btn-primary">Add Restaurant</button>
              <button type="button" className="btn btn-secondary" style={{ marginLeft: 'var(--space-sm)' }} onClick={() => setShowAddForm(false)}>Cancel</button>
            </form>
          </div>
        )}

        {!showAddForm && (
          <button type="button" className="btn btn-primary" style={{ marginBottom: 'var(--space-lg)' }} onClick={() => setShowAddForm(true)}>
            + Add Restaurant
          </button>
        )}

        {error && <p className="error" style={{ marginBottom: 'var(--space-md)' }}>{error}</p>}
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : restaurants.length === 0 ? (
          <div className="card">
            <p className="text-muted" style={{ margin: 0 }}>You have no restaurants yet. Add one to start receiving seat bookings.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {restaurants.map((r) => (
              <li key={r.id} className="card" style={{ marginBottom: 0 }}>
                {editingId === r.id ? (
                  <form onSubmit={handleUpdateRestaurant}>
                    <div className="form-group">
                      <label>Name</label>
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Total seats</label>
                      <input type="number" min={1} value={editForm.totalSeats} onChange={(e) => setEditForm({ ...editForm, totalSeats: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary">Save</button>
                    <button type="button" className="btn btn-secondary" style={{ marginLeft: 'var(--space-sm)' }} onClick={() => setEditingId(null)}>Cancel</button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                    <div>
                      <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>{r.name}</strong>
                      <span className="text-muted"> — {r.cuisine} · {r.location}</span>
                      <br />
                      <span className="text-muted" style={{ fontSize: '0.875rem' }}>Total seats: {r.totalSeats}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-primary" onClick={() => loadBookings(r.id)}>View Bookings</button>
                      <button type="button" className="btn btn-secondary" onClick={() => startEdit(r)}>Edit</button>
                      <button type="button" className="btn btn-danger" onClick={() => handleDelete(r.id, r.name)}>Delete</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {bookingsView && (
          <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
            <h3 className="card-title">Booking status — {bookingsView.restaurant?.name}</h3>
            <p className="text-muted" style={{ marginBottom: 'var(--space-md)' }}>Total capacity: {bookingsView.restaurant?.totalSeats} seats</p>
            {bookingsView.allReservations?.length === 0 ? (
              <p className="text-muted">No reservations yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)' }}>Time</th>
                      <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)' }}>Guests</th>
                      <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)' }}>Customer</th>
                      <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)' }}>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsView.allReservations?.map((res) => (
                      <tr key={res.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>{res.date}</td>
                        <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>{res.time}</td>
                        <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>{res.guests}</td>
                        <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>{res.User?.name ?? '—'}</td>
                        <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>{res.contactNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" className="btn btn-secondary" style={{ marginTop: 'var(--space-md)' }} onClick={() => setBookingsView(null)}>Close</button>
          </div>
        )}
      </div>
    </>
  );
}
