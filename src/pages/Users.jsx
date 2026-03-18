import React, { useState, useEffect } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Mail, Briefcase, Shield, UserPlus, Edit2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { showToast } = useToast();
    const { profile } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // User to confirm deletion

    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        department: '',
        role: 'EMPLOYEE'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            showToast("Failed to fetch users", "error");
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const handleOpenModal = (user) => {
        setEditingUser(user);
        setFormData({
            full_name: user?.full_name || '',
            department: user?.department || '',
            role: user?.role || 'EMPLOYEE'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        setLoading(true);
        
        // Note: For full RLS environment without a backend, admins updating other users
        // might require a backend edge function or a specific RLS policy. 
        // For this demo, we assume the RLS allows updates or we handle failures gracefully.
        const { error } = await supabase
            .from('users')
            .update({
                full_name: formData.full_name,
                department: formData.department,
                role: formData.role
            })
            .eq('user_id', editingUser.user_id);

        if (error) {
            showToast(`Update failed: ${error.message}`, "error");
        } else {
            showToast('User profile updated successfully!', 'success');
            fetchUsers();
            setIsModalOpen(false);
        }
        setLoading(false);
    };

    const handleDelete = async (user) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('user_id', user.user_id);
            
            if (error) throw error;
            showToast('User profile removed', 'warning');
            fetchUsers();
        } catch (error) {
            showToast(`Failed to delete user profile: ${error.message}`, "error");
        } finally {
            setLoading(false);
            setDeleteConfirm(null);
        }
    };

    // Protect the UI
    if (profile?.role !== 'ADMIN') {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Access Denied: Admins Only
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-900">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-gray-500 text-sm">Manage user accounts, roles, and access permissions.</p>
                </div>
                <Button 
                    onClick={() => showToast("Users must self-register on the Sign Up page.", "info")} 
                    className="flex items-center gap-2"
                >
                    <UserPlus size={18} />
                    Invite User
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-gray-900">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {users.map((u) => (
                            <tr key={u.user_id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 overflow-hidden border border-indigo-100">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.full_name}`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div>
                                            <p className="font-bold">{u.full_name}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Mail size={10} /> {u.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                                        <Briefcase size={14} className="opacity-40" />
                                        {u.department || 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                        <Shield size={12} />
                                        {u.role}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <button 
                                            onClick={() => handleOpenModal(u)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#4F27E9] transition-all"
                                            title="Edit User"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => setDeleteConfirm(u)}
                                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                                            title="Delete User"
                                            disabled={loading}
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                    No users found.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit User Role & Dept">
                <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-gray-900">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                        <input 
                            required
                            type="text" 
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            placeholder="John Doe"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium"
                        />
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Email (Read Only)</label>
                        <input 
                            disabled
                            type="email" 
                            value={editingUser?.email || ''}
                            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Department</label>
                            <input 
                                required
                                type="text" 
                                value={formData.department}
                                onChange={(e) => setFormData({...formData, department: e.target.value})}
                                placeholder="Engineering"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Role</label>
                            <select 
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-medium"
                            >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-50 font-medium transition-colors">
                            Cancel
                        </button>
                        <Button type="submit" className="px-8 shadow-md" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-red-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                <XCircle size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-base">Remove User?</h3>
                                <p className="text-xs text-gray-500">This only removes the profile data.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
                            <p className="font-semibold text-gray-800">{deleteConfirm.full_name}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{deleteConfirm.email}</p>
                            <p className="text-gray-500 text-xs capitalize">{deleteConfirm.department || 'No Dept'} · {deleteConfirm.role}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">Keep User</button>
                            <button onClick={() => handleDelete(deleteConfirm)} disabled={loading} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60">{loading ? 'Removing...' : 'Yes, Remove'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
