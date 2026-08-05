import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as adminApi from '@/api/adminApi';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Pagination from '@/components/Pagination';
import { getCategoryIcon } from '@/constants/categories';
import { Users, Package, ClipboardList, ShieldCheck } from 'lucide-react';
import type { AdminStats, Asset, AssetStatus, User } from '@/types';

/**
 * AdminDashboardPage.tsx
 * ------------------------------------------------------------------
 * Private route: /admin (guarded by ProtectedRoute + AdminRoute)
 *
 * Tabbed dashboard: platform stats overview, user management
 * (view/promote/demote/delete), and asset management (view/delete
 * any listing platform-wide, bypassing normal ownership checks).
 */

type Tab = 'overview' | 'users' | 'assets';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'assets', label: 'Assets', icon: Package },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-500">Platform overview and moderation tools.</p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && <StatsOverview />}
      {activeTab === 'users' && <UsersTable />}
      {activeTab === 'assets' && <AssetsTable />}
    </div>
  );
}

/**
 * StatsOverview
 * ------------------------------------------------------------------
 * Platform-wide summary counts, rendered as a grid of stat cards.
 */
function StatsOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminApi.getStats();
        setStats(data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-gray-500">Unable to load stats.</p>;
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Assets', value: stats.totalAssets, icon: Package, color: 'text-purple-600 bg-purple-50' },
    {
      label: 'Total Borrow Requests',
      value: stats.totalBorrowRequests,
      icon: ClipboardList,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: 'Pending Requests',
      value: stats.pendingRequests,
      icon: ClipboardList,
      color: 'text-yellow-600 bg-yellow-50',
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex rounded-md p-2 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Assets by Status</h3>
        <div className="grid grid-cols-3 gap-4">
          {(Object.entries(stats.assetsByStatus) as [AssetStatus, number][]).map(
            ([status, count]) => (
              <div key={status} className="text-center">
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs capitalize text-gray-500">{status}</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * UsersTable
 * ------------------------------------------------------------------
 * Paginated table of all users, with role promote/demote and delete
 * actions. The current admin's own row shows no action buttons,
 * matching the backend's self-modification guards.
 */
function UsersTable() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, pagination } = await adminApi.getAllUsers({ page, limit: 10 });
      setUsers(data);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleRole = async (targetUser: User) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${targetUser.name}'s role to '${newRole}'?`)) return;

    setActioningId(targetUser._id);
    try {
      await adminApi.updateUserRole(targetUser._id, newRole);
      toast.success(`Role updated to '${newRole}'`);
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (targetUser: User) => {
    if (
      !window.confirm(
        `Delete ${targetUser.name}'s account? This also deletes all their assets and borrow requests. This cannot be undone.`
      )
    )
      return;

    setActioningId(targetUser._id);
    try {
      await adminApi.deleteUser(targetUser._id);
      toast.success('User deleted');
      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const isSelf = u._id === currentUser?._id;
              const isActioning = actioningId === u._id;

              return (
                <tr key={u._id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isSelf ? (
                      <span className="text-xs text-gray-400">You</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isActioning}
                          className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={isActioning}
                          className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

/**
 * AssetsTable
 * ------------------------------------------------------------------
 * Paginated table of all assets platform-wide, with a moderation
 * delete action that bypasses normal owner-only restrictions.
 */
function AssetsTable() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, pagination } = await adminApi.getAllAssetsAdmin({ page, limit: 10 });
      setAssets(data);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDelete = async (asset: Asset) => {
    if (!window.confirm(`Delete "${asset.name}"? This cannot be undone.`)) return;

    setDeletingId(asset._id);
    try {
      await adminApi.deleteAssetAdmin(asset._id);
      toast.success('Asset deleted');
      setAssets((prev) => prev.filter((a) => a._id !== asset._id));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assets.map((asset) => {
              const Icon = getCategoryIcon(asset.category);
              const ownerName =
                    asset.owner && typeof asset.owner === 'object' ? asset.owner.name : 'Unknown';

              return (
                <tr key={asset._id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600">
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ownerName}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(asset)}
                      disabled={deletingId === asset._id}
                      className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingId === asset._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}