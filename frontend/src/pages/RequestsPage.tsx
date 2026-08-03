// frontend/src/pages/RequestsPage.tsx
import React, { useEffect, useState } from 'react';
import { fetchUserRequests, updateRequestStatus } from '../api/borrowService';

interface RequestItem {
  _id: string;
  asset: { title: string; category: string };
  borrower: { _id: string; name: string; email: string };
  owner: { _id: string; name: string };
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  startDate: string;
  endDate: string;
}

export const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadRequests = async () => {
    try {
      const data = await fetchUserRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateRequestStatus(id, status);
      loadRequests(); // Refresh UI
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) return <div className="p-4">Loading borrow requests...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Borrow Requests</h1>
      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req._id} className="p-4 border rounded-lg flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-semibold text-lg">{req.asset?.title}</h3>
              <p className="text-sm text-gray-600">Borrower: {req.borrower?.name} ({req.borrower?.email})</p>
              <p className="text-xs text-gray-500">
                Dates: {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
              </p>
              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded uppercase font-bold ${
                req.status === 'approved' ? 'bg-green-100 text-green-800' :
                req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {req.status}
              </span>
            </div>

            {req.status === 'pending' && (
              <div className="space-x-2">
                <button
                  onClick={() => handleStatusChange(req._id, 'approved')}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusChange(req._id, 'rejected')}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};