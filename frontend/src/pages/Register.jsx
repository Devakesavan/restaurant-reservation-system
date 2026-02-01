import { useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { register as registerApi } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await registerApi(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, email: data.email, role: data.role }));
      if (data.role === 'owner') navigate('/owner');
      else if (data.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (data && (data.message || (Array.isArray(data.errors) && data.errors[0]?.msg))) ||
        (err.code === 'ERR_NETWORK' ? 'Cannot reach server. Is the backend running on port 5000?' : 'Registration failed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-promo">
        <h1>Fine Dining at Your Fingertips</h1>
        <p>
          Discover exceptional restaurants, book your perfect table, and enjoy unforgettable culinary experiences with TableTop.
        </p>
      </div>
      <div className="auth-panel">
        <div className="auth-tabs">
          <NavLink to="/login" className={({ isActive }) => `auth-tab ${isActive ? 'active' : ''}`}>Login</NavLink>
          <NavLink to="/register" className={({ isActive }) => `auth-tab ${isActive ? 'active' : ''}`}>Register</NavLink>
        </div>
        <div className="auth-card">
          <h2>Create an account</h2>
          <p className="auth-subtitle">Join TableTop to book tables and manage your dining experience.</p>
          {error && <p className="error" style={{ marginBottom: '1rem' }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password (min 6 characters)</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label htmlFor="role">I want to</label>
              <select id="role" name="role" value={form.role} onChange={handleChange}>
                <option value="user">Book seats at restaurants</option>
                <option value="owner">Manage my own restaurants</option>
                <option value="admin">Monitor the system (Admin)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
