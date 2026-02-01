import { useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { login } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
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
      const { data } = await login(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, email: data.email, role: data.role }));
      if (data.role === 'owner') navigate('/owner');
      else if (data.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Enter your credentials to access your account.</p>
          {error && <p className="error" style={{ marginBottom: '1rem' }}>{error}</p>}
          <form onSubmit={handleSubmit}>
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
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
