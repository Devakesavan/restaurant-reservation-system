import { useState, useEffect } from 'react';
import AppNav from '../components/AppNav';
import { getAdminStats, getActivityLogs } from '../services/api';

export default function AdminDashboard() {
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

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleString();
  };

  const statCards = [
    { label: 'Registered Users', value: stats?.usersCount ?? 0, color: 'var(--color-primary)' },
    { label: 'Restaurants', value: stats?.restaurantsCount ?? 0, color: 'var(--color-success)' },
    { label: 'Bookings (Today)', value: stats?.bookings?.daily ?? 0, color: 'var(--color-warning)' },
    { label: 'Bookings (This Week)', value: stats?.bookings?.weekly ?? 0, color: '#7B5B96' },
    { label: 'Bookings (This Month)', value: stats?.bookings?.monthly ?? 0, color: '#0288d1' },
    { label: 'Total Seats Booked (Upcoming)', value: stats?.totalSeatsBooked ?? 0, color: 'var(--color-error)' },
  ];

  return (
    <>
      <AppNav user={user} />
      <div className="app-container">
        <h1>Admin Dashboard</h1>
        <p className="text-muted" style={{ marginBottom: 'var(--space-xl)' }}>
          Read-only monitoring. View users, restaurants, booking statistics, and system activity.
        </p>

        {error && <p className="error" style={{ marginBottom: 'var(--space-md)' }}>{error}</p>}
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
              {statCards.map((card) => (
                <div key={card.label} className="card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: card.color, fontFamily: 'var(--font-heading)' }}>{card.value}</div>
                  <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: 'var(--space-xs)' }}>{card.label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className="card-title">System Activity Logs</h3>
              <p className="text-muted" style={{ marginBottom: 'var(--space-md)' }}>Total events: {logsTotal}</p>
              {logs.length === 0 ? (
                <p className="text-muted">No activity yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)' }}>Time</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)' }}>Action</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)' }}>Entity</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)' }}>User</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-sm) var(--space-md)' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>{formatDate(log.createdAt)}</td>
                          <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>{log.action}</td>
                          <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>{log.entity}</td>
                          <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>{log.User?.name ?? log.User?.email ?? '—'}</td>
                          <td style={{ padding: 'var(--space-sm) var(--space-md)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.metadata && typeof log.metadata === 'object' ? JSON.stringify(log.metadata) : log.metadata ?? '—'}
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
