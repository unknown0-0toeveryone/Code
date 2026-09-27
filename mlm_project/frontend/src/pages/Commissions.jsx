import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Commissions({ user }) {
  const [rows, setRows] = useState([]);

  function load() {
    api.getCommissions(user.member_id).then(setRows);
  }
  useEffect(load, [user]);

  async function pay(id) {
    await api.payCommission(id);
    load();
  }

  return (
    <div className="container">
      <h1>My Commissions</h1>
      <div className="card">
        <table>
          <thead><tr><th>#</th><th>From Order</th><th>Level</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.commission_id}>
                <td>{c.commission_id}</td>
                <td>#{c.order_id} (₹{c.order_total})</td>
                <td>{c.level}</td>
                <td>₹{c.amount}</td>
                <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                <td>{c.status === 'pending' && <button className="btn" onClick={() => pay(c.commission_id)}>Pay Out</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
