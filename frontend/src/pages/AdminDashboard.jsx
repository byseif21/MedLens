import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import { getAdminUsers, deleteUserAdmin, updateUserAdmin } from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editingUser, setEditingUser] = useState(null); // User being edited
  
  const { notify } = useNotifications();
  const navigate = useNavigate();

  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]); // Refetch when page or filter changes

  const fetchUsers = async (query = searchTerm) => {
    setLoading(true);
    const result = await getAdminUsers(page, pageSize, query, roleFilter);
    if (result.success) {
      setUsers(result.data.users);
      setTotalUsers(result.data.total);
      setTotalPages(Math.ceil(result.data.total / pageSize));
    } else {
      notify({ type: 'error', title: 'Error', message: result.error });
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    fetchUsers(searchTerm);
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteUserAdmin(userId);
    if (result.success) {
      notify({ type: 'success', title: 'Success', message: 'User deleted successfully' });
      fetchUsers(); // Refresh list
    } else {
      notify({ type: 'error', title: 'Error', message: result.error });
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    const result = await updateUserAdmin(userId, { role: newRole });
    if (result.success) {
      notify({ type: 'success', title: 'Success', message: 'User role updated' });
      setEditingUser(null);
      fetchUsers(); // Refresh list
    } else {
      notify({ type: 'error', title: 'Error', message: result.error });
    }
  };

  return (
    <div className="min-h-screen bg-medical-light">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-medical-dark">Admin Dashboard</h1>
          <div className="text-sm text-gray-500">
            Total Users: {totalUsers}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow-medical mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-medical w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-medical w-full"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn-medical-primary whitespace-nowrap">
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-medical overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-medical-gray-100 text-medical-gray-600 uppercase text-sm font-semibold">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Created At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-medical-gray-200">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-medical-gray-50 transition-colors">
                        <td className="p-4 font-medium text-medical-dark">{user.name}</td>
                        <td className="p-4 text-gray-600">{user.email}</td>
                        <td className="p-4">
                          {editingUser === user.id ? (
                            <select
                              defaultValue={user.role}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              className="text-sm border rounded p-1"
                              autoFocus
                              onBlur={() => setEditingUser(null)}
                            >
                              <option value="user">User</option>
                              <option value="doctor">Doctor</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span 
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-gray-500 text-sm">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingUser(user.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white shadow-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 flex items-center">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-white shadow-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
