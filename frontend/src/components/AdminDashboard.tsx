// frontend/src/components/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import API from '../services/api';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await API.get('/admin/users');
        setUsers(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch user list.');
      }
    };

    fetchUsers();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px' }}>
      <h2>Admin Control Panel</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Registered Platform Users</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
        <thead>
          <tr style={{ background: '#f2f2f2', textAlign: 'left' }}>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Email</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.id}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.name}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.email}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;