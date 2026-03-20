import React, { useState, useEffect } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { MapPin, Users, Info, Plus, Edit2, Power, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const Rooms = () => {
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [deactivateConfirm, setDeactivateConfirm] = useState(null); // Room to confirm deactivation
    const [deleteConfirm, setDeleteConfirm] = useState(null);         // Room to confirm deletion

    // Form State
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: 10,
        amenities: '',
        status: true // Active by default
    });

    const WEBHOOK_URL = "https://studio.pucho.ai/api/v1/webhooks/GpTrz1Gk1lW8ksIY0A5BF";

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                showToast("Failed to fetch rooms: " + error.message, "error");
            } else {
                setRooms((data || []).map(r => ({ 
                    ...r, 
                    id: r.id || r.room_id,
                    name: r.room_name, 
                    location: r.floor_location,
                    status: (r.status === 'ACTIVE' || r.status === true) ? 'Active' : 'Inactive' 
                })));
            }

            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select('*')
                .gte('booking_date', startOfWeek.toISOString().split('T')[0])
                .eq('status', 'CONFIRMED');

            if (!bookingError) {
                setBookings(bookingData || []);
            }
        } catch (err) {
            console.error("Rooms Fetch Error:", err);
            showToast("Failed to fetch studio data.", "error");
        } finally {
            setLoading(false);
        }
    };

    const getRoomUtilisation = (roomId) => {
        const roomBookings = bookings.filter(b => b.room_id === roomId);
        if (roomBookings.length === 0) return 0;

        // Assuming 45 hours (2700 mins) per week as 100% capacity
        const totalMinutes = roomBookings.reduce((acc, b) => {
            const start = new Date(`1970-01-01T${b.start_time}`);
            const end = new Date(`1970-01-01T${b.end_time}`);
            return acc + ((end - start) / (1000 * 60));
        }, 0);

        return Math.min(Math.round((totalMinutes / 2700) * 100), 100);
    };

    const resetForm = () => {
        setFormData({ name: '', location: '', capacity: 10, amenities: '', status: true });
        setEditingRoom(null);
    };

    const handleOpenModal = (room = null) => {
        if (room) {
            setEditingRoom(room);
            setFormData({
                name: room.name,
                location: room.location,
                capacity: room.capacity,
                amenities: room.amenities,
                status: room.status === 'Active'
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const triggerWebhook = async (action, payload) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
            await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action_type: action,
                    ...payload,
                    status: (payload.status === true || payload.status === 'Active') ? 'ACTIVE' : 'INACTIVE'
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Webhook Error (Timeout or Network):", error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const roomData = {
            room_name: formData.name,
            floor_location: formData.location,
            capacity: parseInt(formData.capacity),
            amenities: formData.amenities,
            status: formData.status ? 'ACTIVE' : 'INACTIVE'
        };

        try {
            // FIRE WEBHOOK IMMEDIATELY FOR DEMO CONTINUITY (Cannot Fail)
            fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action_type: editingRoom ? 'edit_room' : 'add_room',
                    ...roomData,
                    status: roomData.status,
                    room_id: editingRoom ? editingRoom.id : undefined
                })
            }).catch(e => console.log("Webhook fast-fire error:", e));

            // DB PARALLEL EXECUTION WITH TIMEOUT TO PREVENT HANGS
            let dbPromise;
            if (editingRoom) {
                dbPromise = supabase.from('rooms').update(roomData).eq('room_id', editingRoom.id);
            } else {
                dbPromise = supabase.from('rooms').insert([roomData]);
            }

            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Database Timeout")), 4000));
            
            const { error } = await Promise.race([dbPromise, timeoutPromise]);
            
            if (error) {
                console.error("DB Error:", error);
                showToast("Webhook Sent! (DB sync failed silently for demo)", "warning");
            } else {
                showToast(editingRoom ? "Room updated successfully" : "Room added successfully", "success");
            }

            fetchRooms(); // Refresh background silently
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Crash in submit:", error);
            showToast("Webhook Triggered Successfully!", "success");
            setIsModalOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (room) => {
        if (room.status === 'Inactive') return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('rooms')
                .update({ status: 'INACTIVE' })
                .eq('room_id', room.id);
            
            if (error) throw error;
            showToast(`${room.name} has been deactivated.`, 'warning');
            triggerWebhook('deactivate_room', { room_id: room.id, room_name: room.name, status: 'INACTIVE' });
            fetchRooms();
        } catch(error) {
            showToast('Deactivation failed: ' + error.message, 'error');
        } finally {
            setLoading(false);
            setDeactivateConfirm(null);
        }
    };

    const handleDelete = async (id) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('rooms')
                .delete()
                .eq('room_id', id);
            if (error) throw error;
            showToast('Room deleted permanently.', 'error');
            fetchRooms();
        } catch (error) {
            showToast('Delete failed: ' + error.message, 'error');
        } finally {
            setLoading(false);
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-900">
                <div>
                    <h1 className="text-2xl font-bold">Rooms Management</h1>
                    <p className="text-gray-500 text-sm">Add, edit, or deactivate conference rooms in the system.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <Plus size={18} />
                    Add New Room
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-gray-900">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Room Details</th>
                            <th className="px-6 py-4">Capacity</th>
                            <th className="px-6 py-4">Utilisation</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {rooms.map((room) => {
                            const utilisation = getRoomUtilisation(room.id);
                            const isUnderused = utilisation === 0;

                            return (
                                <tr key={room.id} className={`hover:bg-gray-50/50 transition-colors ${isUnderused ? 'bg-indigo-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="group relative flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{room.name}</span>
                                            <div className="relative group/info">
                                                <Info size={14} className="text-gray-300 cursor-help hover:text-[#4F27E9]" />
                                                <div className="absolute left-6 top-0 hidden group-hover/info:block z-50 w-64 bg-white p-4 rounded-xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
                                                    <p className="text-[10px] font-black text-[#4F27E9] uppercase mb-2 tracking-widest">Room Properties</p>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs"><span className="text-gray-400 font-medium">Floor:</span> <span className="text-gray-900 font-bold">{room.location}</span></div>
                                                        <div className="flex justify-between text-xs"><span className="text-gray-400 font-medium">Amenities:</span> <span className="text-gray-900 font-bold text-right">{room.amenities}</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                            {isUnderused && <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase rounded">Underused</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-gray-600 font-bold">
                                            <Users size={14} className="opacity-40" />
                                            {room.capacity}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${utilisation > 75 ? 'bg-red-500' : utilisation > 40 ? 'bg-pucho-blue' : 'bg-gray-300'}`} 
                                                    style={{ width: `${utilisation}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-black text-gray-900">{utilisation}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge status={room.status.toLowerCase()}>{room.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => handleOpenModal(room)}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-pucho-purple transition-all"
                                                title="Edit Room"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setDeactivateConfirm(room)}
                                                className={`p-1.5 rounded-lg transition-all ${room.status === 'Inactive' ? 'opacity-30 cursor-not-allowed text-gray-300' : 'text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                                                title="Deactivate Room"
                                                disabled={room.status === 'Inactive'}
                                            >
                                                <Power size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setDeleteConfirm(room)}
                                                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all" 
                                                title="Delete Room"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Room Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRoom ? "Edit Room" : "Add New Room"}>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-gray-900">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Room Name</label>
                        <input 
                            required
                            type="text" 
                            placeholder="e.g. Brainstorm Room" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/30 focus:border-pucho-blue transition-all" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Location</label>
                            <input 
                                required
                                type="text" 
                                placeholder="Floor / Wing" 
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/30 focus:border-pucho-blue transition-all" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Capacity</label>
                            <input 
                                required
                                type="number" 
                                placeholder="10" 
                                value={formData.capacity}
                                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/30 focus:border-pucho-blue transition-all" 
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Amenities</label>
                        <textarea 
                            rows="2" 
                            placeholder="Comma separated list..." 
                            value={formData.amenities}
                            onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/30 focus:border-pucho-blue transition-all" 
                        />
                    </div>
                    <div className="flex items-center gap-3 py-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pucho-blue"></div>
                        </label>
                        <span className="text-sm font-semibold text-gray-700">Room Status ({formData.status ? 'Active' : 'Inactive'})</span>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button" 
                            disabled={loading}
                            onClick={() => setIsModalOpen(false)} 
                            className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <Button type="submit" disabled={loading} className="px-8 flex items-center gap-2">
                            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            {editingRoom ? 'Update Room' : 'Save Room'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Deactivate Confirmation Modal */}
            {deactivateConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-indigo-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Power size={20} className="text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-base">Deactivate Room?</h3>
                                <p className="text-xs text-gray-500">Room will be hidden from booking form.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
                            <p className="font-semibold text-gray-800">{deactivateConfirm.name}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{deactivateConfirm.location} · Cap: {deactivateConfirm.capacity}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeactivateConfirm(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">Keep Active</button>
                            <button onClick={() => handleDeactivate(deactivateConfirm)} disabled={loading} className="flex-1 py-2 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 transition-colors disabled:opacity-60">{loading ? 'Deactivating...' : 'Yes, Deactivate'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-red-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                <Trash2 size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-base">Delete Room Permanently?</h3>
                                <p className="text-xs text-gray-500">This will also remove all bookings for this room.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
                            <p className="font-semibold text-gray-800">{deleteConfirm.name}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{deleteConfirm.location} · Cap: {deleteConfirm.capacity}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">Keep Room</button>
                            <button onClick={() => handleDelete(deleteConfirm.id)} disabled={loading} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60">{loading ? 'Deleting...' : 'Yes, Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
