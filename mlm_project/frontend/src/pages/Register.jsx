import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', sponsor_id: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.register({ ...form, sponsor_id: form.sponsor_id || null });
      setMessage('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <div className="card">
        <h2>Join the Network</h2>
        <form onSubmit={handleSubmit}>
          <input placeholder="Full name" value={form.name} onChange={update('name')} required />
          <input type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
          <input type="password" placeholder="Password" value={form.password} onChange={update('password')} required />
          <input placeholder="Phone" value={form.phone} onChange={update('phone')} />
          <input placeholder="Address" value={form.address} onChange={update('address')} />
          <input placeholder="Sponsor's Member ID (optional)" value={form.sponsor_id} onChange={update('sponsor_id')} />
          {message && <p>{message}</p>}
          <button className="btn" type="submit" style={{ marginTop: 10 }}>Register</button>
        </form>
      </div>
    </div>
  );
}
