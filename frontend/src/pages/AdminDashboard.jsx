import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminStats, getActivityLogs } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadStats = async () => {
    try {
      const { data } = await getAdminStats();
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stats');
    }
  };

  const loadLogs = async () => {
    try {
      const { data } = await getActivityLogs({ limit: 100 });
      setLogs(data.logs);
      setLogsTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity logs');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      await Promise.all([loadStats(), loadLogs()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleString();
  };

  return (
    <>
      <nav>
        <Link to="/">Restaurants</Link>
        <Link to="/book">Book Reservation</Link>
        <Link to="/admin" style={{ fontWeight: 'bold' }}>Admin Dashboard</Link>
        <span style={{ float: 'right', color: '#fff' }}>
          {user.name} (Admin){' '}
          <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={handleLogout}>
            Logout
          </button>
        </span>
      </nav>
      <div className="container">
        <h1>Admin Dashboard</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Read-only monitoring. View users, restaurants, booking statistics, and system activity.
        </p>

        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1976d2' }}>{stats?.usersCount ?? 0}</div>
                <div style={{ color: '#666' }}>Registered Users</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2e7d32' }}>{stats?.restaurantsCount ?? 0}</div>
                <div style={{ color: '#666' }}>Restaurants</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ed6c02' }}>{stats?.bookings?.daily ?? 0}</div>
                <div style={{ color: '#666' }}>Bookings (Today)</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9c27b0' }}>{stats?.bookings?.weekly ?? 0}</div>
                <div style={{ color: '#666' }}>Bookings (This Week)</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0288d1' }}>{stats?.bookings?.monthly ?? 0}</div>
                <div style={{ color: '#666' }}>Bookings (This Month)</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c62828' }}>{stats?.totalSeatsBooked ?? 0}</div>
                <div style={{ color: '#666' }}>Total Seats Booked (Upcoming)</div>
              </div>
            </div>

            <div className="card">
              <h3>System Activity Logs (read-only)</h3>
              <p style={{ color: '#666', marginBottom: 12 }}>Total events: {logsTotal}</p>
              {logs.length === 0 ? (
                <p>No activity yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #eee' }}>
                        <th style={{ textAlign: 'left', padding: 8 }}>Time</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Entity</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>User</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: 8 }}>{formatDate(log.createdAt)}</td>
                          <td style={{ padding: 8 }}>{log.action}</td>
                          <td style={{ padding: 8 }}>{log.entity}</td>
                          <td style={{ padding: 8 }}>{log.User?.name ?? log.User?.email ?? '—'}</td>
                          <td style={{ padding: 8 }}>
                            {log.metadata && typeof log.metadata === 'object'
                              ? JSON.stringify(log.metadata)
                              : log.metadata ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
