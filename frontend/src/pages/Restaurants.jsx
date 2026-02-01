import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
      <nav>
        <Link to="/" style={{ fontWeight: 'bold' }}>Restaurants</Link>
        <Link to="/book">Book Reservation</Link>
        {isOwner && <Link to="/owner">My Restaurants</Link>}
        {isAdmin && <Link to="/admin">Admin Dashboard</Link>}
        {isOwner && (
          <button type="button" className="btn btn-secondary" style={{ background: 'transparent', border: '1px solid #fff' }} onClick={() => setShowAddForm(!showAddForm)}>
            Add Restaurant
          </button>
        )}
        <span style={{ float: 'right', color: '#fff' }}>
          {user.name} ({user.role}){' '}
          <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={handleLogout}>
            Logout
          </button>
        </span>
      </nav>
      <div className="container">
        <h1>Restaurants</h1>
        {isOwner && showAddForm && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>Add Restaurant</h3>
            <form onSubmit={handleAddRestaurant}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Cuisine</label>
                <input type="text" value={addForm.cuisine} onChange={(e) => setAddForm({ ...addForm, cuisine: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Rating (0-5, optional)</label>
                <input type="number" min={0} max={5} step={0.1} value={addForm.rating} onChange={(e) => setAddForm({ ...addForm, rating: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Total seats available</label>
                <input type="number" min={1} value={addForm.totalSeats} onChange={(e) => setAddForm({ ...addForm, totalSeats: e.target.value })} required placeholder="e.g. 50" />
              </div>
              <button type="submit" className="btn btn-primary">Add</button>
              <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => setShowAddForm(false)}>Cancel</button>
            </form>
          </div>
        )}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search by name, cuisine, or location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: 8 }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : restaurants.length === 0 ? (
          <p>No restaurants found.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {restaurants.map((r) => (
              <li key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{r.name}</strong> — {r.cuisine} · {r.location}
                  {r.totalSeats != null && ` · ${r.totalSeats} seats`}
                  {r.rating != null && ` · Rating: ${r.rating}`}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
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
