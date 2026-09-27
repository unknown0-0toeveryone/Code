import { useEffect, useState } from 'react';
import { api } from '../api';
import DownlineTree from '../components/DownlineTree';

export default function Downline({ user }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.getDownline(user.member_id).then(setRows).catch(() => {});
  }, [user]);

  return (
    <div className="container">
      <h1>My Network / Downline</h1>
      <div className="card">
        <p>This tree is produced by the <code>sp_get_downline</code> recursive stored procedure — each level shown is one generation of members you (directly or indirectly) sponsored.</p>
        <DownlineTree rootId={user.member_id} rows={rows} />
      </div>
    </div>
  );
}
