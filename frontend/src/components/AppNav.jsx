import { Link, NavLink, useNavigate } from 'react-router-dom';

export default function AppNav({ user }) {
  const navigate = useNavigate();
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="app-nav">
      <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Restaurants</NavLink>
      <NavLink to="/book" className={({ isActive }) => isActive ? 'active' : ''}>Book Reservation</NavLink>
      {isOwner && <NavLink to="/owner" className={({ isActive }) => isActive ? 'active' : ''}>My Restaurants</NavLink>}
      {isAdmin && <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>Admin Dashboard</NavLink>}
      <span className="app-nav-spacer" />
      <span className="app-nav-user">
        {user?.name} <span style={{ opacity: 0.8 }}>({user?.role})</span>
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </span>
    </nav>
  );
}
