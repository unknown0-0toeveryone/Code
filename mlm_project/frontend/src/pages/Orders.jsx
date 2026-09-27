import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);

  function load() {
    api.getOrders(user.member_id).then(setOrders);
  }
  useEffect(load, [user]);

  async function markCompleted(orderId) {
    await api.setOrderStatus(orderId, 'completed');
    load();
  }

  return (
    <div className="container">
      <h1>My Orders</h1>
      <div className="card">
        <table>
          <thead><tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.order_id}>
                <td>{o.order_id}</td>
                <td>{new Date(o.order_date).toLocaleString()}</td>
                <td>₹{o.total_amount}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td>
                  {o.status === 'pending' && (
                    <button className="btn" onClick={() => markCompleted(o.order_id)}>Mark Completed</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
          Marking an order "completed" fires the <code>trg_generate_sponsor_commission</code> trigger, which credits your sponsor automatically.
        </p>
      </div>
    </div>
  );
}
