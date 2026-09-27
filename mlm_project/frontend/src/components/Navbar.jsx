import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <div className="navbar">
      <div className="brand">NetworkMarketing Co.</div>
      <div>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/downline">My Downline</Link>
            <Link to="/products">Products</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/commissions">Commissions</Link>
            <a href="#" onClick={() => { onLogout(); navigate('/login'); }}>Logout ({user.name})</a>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Join Now</Link>
          </>
        )}
      </div>
    </div>
  );
}
