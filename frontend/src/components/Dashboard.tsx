// frontend/src/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { getAssets, createAsset } from '../services/assetService';

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchItems = async () => {
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (err: any) {
      setError('Failed to fetch items.');
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAsset({ title, description });
      setTitle('');
      setDescription('');
      fetchItems(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create item.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px' }}>
      <h2>ReBorrow Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>List an Item to Borrow/Share</h3>
        <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder="Item Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          <button type="submit" style={{ padding: '8px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Add Item
          </button>
        </form>
      </div>

      <h3>Available Items</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {assets.length === 0 ? (
          <p>No items available right now.</p>
        ) : (
          assets.map((item, index) => (
            <div key={index} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px' }}>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;