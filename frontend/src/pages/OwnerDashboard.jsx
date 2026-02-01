import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getMyRestaurants,
  getRestaurantBookings,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '../services/api';

export default function OwnerDashboard() {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
      <nav>
        <Link to="/">All Restaurants</Link>
        <Link to="/book">Book Reservation</Link>
        <Link to="/owner" style={{ fontWeight: 'bold' }}>My Restaurants</Link>
        <span style={{ float: 'right', color: '#fff' }}>
          {user.name} (Owner){' '}
          <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={handleLogout}>
            Logout
          </button>
        </span>
      </nav>
      <div className="container">
        <h1>My Restaurants</h1>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Manage your restaurants and total seats. Seat availability updates automatically when users book.
        </p>

        {showAddForm && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>Add Restaurant</h3>
            <form onSubmit={handleAddRestaurant}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Cuisine</label>
                <input
                  type="text"
                  value={addForm.cuisine}
                  onChange={(e) => setAddForm({ ...addForm, cuisine: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={addForm.location}
                  onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rating (0–5, optional)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={addForm.rating}
                  onChange={(e) => setAddForm({ ...addForm, rating: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Total seats per restaurant</label>
                <input
                  type="number"
                  min={1}
                  value={addForm.totalSeats}
                  onChange={(e) => setAddForm({ ...addForm, totalSeats: e.target.value })}
                  required
                  placeholder="e.g. 50"
                />
              </div>
              <button type="submit" className="btn btn-primary">Add</button>
              <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </form>
          </div>
        )}

        {!showAddForm && (
          <button type="button" className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowAddForm(true)}>
            + Add Restaurant
          </button>
        )}

        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : restaurants.length === 0 ? (
          <div className="card">
            <p>You have no restaurants yet. Add one to start receiving seat bookings.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {restaurants.map((r) => (
              <li key={r.id} className="card" style={{ marginBottom: 12 }}>
                {editingId === r.id ? (
                  <form onSubmit={handleUpdateRestaurant}>
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Total seats</label>
                      <input
                        type="number"
                        min={1}
                        value={editForm.totalSeats}
                        onChange={(e) => setEditForm({ ...editForm, totalSeats: e.target.value })}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">Save</button>
                    <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <strong>{r.name}</strong> — {r.cuisine} · {r.location}
                        <br />
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>
                          Total seats: {r.totalSeats}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-primary" onClick={() => loadBookings(r.id)}>
                          View Bookings
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => startEdit(r)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(r.id, r.name)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {bookingsView && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3>Booking status — {bookingsView.restaurant?.name}</h3>
            <p>Total capacity: {bookingsView.restaurant?.totalSeats} seats</p>
            {bookingsView.allReservations?.length === 0 ? (
              <p>No reservations yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Time</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Guests</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsView.allReservations?.map((res) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 8 }}>{res.date}</td>
                      <td style={{ padding: 8 }}>{res.time}</td>
                      <td style={{ padding: 8 }}>{res.guests}</td>
                      <td style={{ padding: 8 }}>{res.User?.name ?? '—'}</td>
                      <td style={{ padding: 8 }}>{res.contactNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button type="button" className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => setBookingsView(null)}>
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
