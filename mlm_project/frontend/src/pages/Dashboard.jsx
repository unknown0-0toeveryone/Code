import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [member, setMember] = useState(null);

  useEffect(() => {
    api.getSummary(user.member_id).then(setSummary).catch(() => {});
    api.getMember(user.member_id).then(setMember).catch(() => {});
  }, [user]);

  return (
    <div className="container">
      <h1>Welcome back, {user.name}</h1>
      <div className="card">
        <h3>Your Profile</h3>
        {member && (
          <p>
            Rank: <strong>{member.rank_name}</strong> &nbsp;|&nbsp;
            Commission rate: <strong>{member.commission_rate}%</strong> &nbsp;|&nbsp;
            Joined: {new Date(member.join_date).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="card">
        <h3>Performance Summary</h3>
        <div className="grid">
          <div className="stat">
            <div className="value">{summary?.total_orders ?? '—'}</div>
            <div>Completed Orders</div>
          </div>
          <div className="stat">
            <div className="value">₹{Number(summary?.total_purchase_value ?? 0).toLocaleString()}</div>
            <div>Total Purchases</div>
          </div>
          <div className="stat">
            <div className="value">₹{Number(summary?.total_commission_earned ?? 0).toLocaleString()}</div>
            <div>Commission Earned</div>
          </div>
        </div>
      </div>
    </div>
  );
}
