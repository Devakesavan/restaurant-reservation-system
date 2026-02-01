import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppNav from '../components/AppNav';
import { getRestaurants, searchRestaurants, getMyRestaurants, deleteRestaurant, addRestaurant } from '../services/api';

export default function Restaurants() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [myRestaurantIds, setMyRestaurantIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', cuisine: '', location: '', rating: '', totalSeats: '' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwner = user.role === 'owner';
  const isAdmin = user.role === 'admin';

  const loadRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = search.trim() ? await searchRestaurants(search.trim()) : await getRestaurants();
      setRestaurants(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (isOwner) {
      getMyRestaurants()
        .then(({ data }) => setMyRestaurantIds(new Set(data.map((r) => r.id))))
        .catch(() => {});
    }
  }, [isOwner]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadRestaurants();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete restaurant "${name}"?`)) return;
    try {
      await deleteRestaurant(id);
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
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
      setAddForm({ name: '', cuisine: '', location: '', rating: '', totalSeats: '' });
      setShowAddForm(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Add failed');
    }
  };

  return (
    <>
      <AppNav user={user} />
      {isOwner && (
        <div style={{ padding: '0 var(--space-xl)', marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Restaurant'}
          </button>
        </div>
      )}
      <div className="app-container">
        <h1>Restaurants</h1>
        <p className="text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
          Browse and search restaurants. Book a table when you&apos;re ready.
        </p>

        {isOwner && showAddForm && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 className="card-title">Add Restaurant</h3>
            <form onSubmit={handleAddRestaurant}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required placeholder="Restaurant name" />
              </div>
              <div className="form-group">
                <label>Cuisine</label>
                <input type="text" value={addForm.cuisine} onChange={(e) => setAddForm({ ...addForm, cuisine: e.target.value })} required placeholder="e.g. Italian, Japanese" />
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
                <label>Total seats available</label>
                <input type="number" min={1} value={addForm.totalSeats} onChange={(e) => setAddForm({ ...addForm, totalSeats: e.target.value })} required placeholder="e.g. 50" />
              </div>
              <button type="submit" className="btn btn-primary">Add Restaurant</button>
              <button type="button" className="btn btn-secondary" style={{ marginLeft: 'var(--space-sm)' }} onClick={() => setShowAddForm(false)}>Cancel</button>
            </form>
          </div>
        )}

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', maxWidth: 480 }}>
          <input
            type="text"
            placeholder="Search by name, cuisine, or location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '0.625rem 0.875rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {error && <p className="error" style={{ marginBottom: 'var(--space-md)' }}>{error}</p>}
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : restaurants.length === 0 ? (
          <div className="card">
            <p className="text-muted" style={{ margin: 0 }}>No restaurants found.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {restaurants.map((r) => (
              <li key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                  <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>{r.name}</strong>
                  <span className="text-muted" style={{ marginLeft: 'var(--space-sm)' }}>— {r.cuisine} · {r.location}</span>
                  {r.totalSeats != null && <span className="text-muted"> · {r.totalSeats} seats</span>}
                  {r.rating != null && <span className="text-muted"> · Rating: {r.rating}</span>}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                  <Link to={`/book/${r.id}`} className="btn btn-primary">Book</Link>
                  {isOwner && myRestaurantIds.has(r.id) && (
                    <>
                      <Link to="/owner" className="btn btn-secondary">Manage</Link>
                      <button type="button" className="btn btn-danger" onClick={() => handleDelete(r.id, r.name)}>Delete</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
