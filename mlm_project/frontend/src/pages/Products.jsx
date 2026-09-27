import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Products({ user }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => { api.getProducts().then(setProducts); }, []);

  function updateQty(productId, qty) {
    setCart({ ...cart, [productId]: Number(qty) });
  }

  async function placeOrder() {
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([product_id, quantity]) => ({ product_id: Number(product_id), quantity }));
    if (items.length === 0) return setMessage('Select at least one product.');
    try {
      const res = await api.placeOrder({ member_id: user.member_id, items });
      setMessage(`Order #${res.order_id} placed — total ₹${res.total_amount}`);
      setCart({});
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="container">
      <h1>Product Catalogue</h1>
      <div className="card">
        <table>
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Qty</th></tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.product_id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>₹{p.price}</td>
                <td>{p.stock}</td>
                <td style={{ width: 80 }}>
                  <input type="number" min="0" max={p.stock}
                    value={cart[p.product_id] || ''}
                    onChange={e => updateQty(p.product_id, e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn" style={{ marginTop: 14 }} onClick={placeOrder}>Place Order</button>
        {message && <p style={{ marginTop: 10 }}>{message}</p>}
      </div>
    </div>
  );
}
