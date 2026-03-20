import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Calendar, Clock, Users, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

const BookingModal = ({ isOpen, onClose, initialData = null, onSuccess }) => {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetchingRooms, setFetchingRooms] = useState(false);
    const [rooms, setRooms] = useState([]);
    
    const [formData, setFormData] = useState({
        title: '',
        room_id: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        attendees: 1,
        description: ''
    });

    const WEBHOOK_URL = "https://studio.pucho.ai/api/v1/webhooks/GpTrz1Gk1lW8ksIY0A5BF";

    useEffect(() => {
        if (isOpen) {
            fetchRooms();
            if (initialData) {
                setFormData(prev => ({
                    ...prev,
                    ...initialData
                }));
            } else {
                // Set default times if empty
                const now = new Date();
                const start = new Date(now.getTime() + 30 * 60000); // 30 mins from now
                const end = new Date(start.getTime() + 60 * 60000);   // 1 hour later
                
                setFormData(prev => ({
                    ...prev,
                    startTime: start.toTimeString().substring(0, 5),
                    endTime: end.toTimeString().substring(0, 5)
                }));
            }
        }
    }, [isOpen, initialData]);

    const fetchRooms = async () => {
        setFetchingRooms(true);
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('status', 'ACTIVE')
                .order('room_name');
            
            if (error) throw error;
            
            // Map IDs robustly correctly
            const mappedRooms = (data || []).map(r => ({
                ...r,
                id: r.id || r.room_id, // Safety for different column naming
                name: r.room_name
            }));
            
            setRooms(mappedRooms);
            
            // If it's a "Quick Book" and no room is selected, pick the first one
            if (!formData.room_id && mappedRooms.length > 0 && !initialData?.room_id) {
                setFormData(prev => ({ ...prev, room_id: mappedRooms[0].id }));
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        } finally {
            setFetchingRooms(false);
        }
    };

    const validate = () => {
        const start = new Date(`${formData.date}T${formData.startTime}`);
        const end = new Date(`${formData.date}T${formData.endTime}`);
        const now = new Date();

        if (!formData.title) return "Please enter a meeting title.";
        if (!formData.room_id) return "Please select a room.";
        if (start < now) return "Start time must be in the future.";
        if (end <= start) return "End time must be after start time.";
        
        const selectedRoom = rooms.find(r => r.id === formData.room_id);
        if (selectedRoom && parseInt(formData.attendees) > selectedRoom.capacity) {
            return `This room has a maximum capacity of ${selectedRoom.capacity}.`;
        }

        return null;
    };

    const triggerWebhook = async (action, payload) => {
        const selectedRoom = rooms.find(r => r.id === payload.room_id);
        const startISO = `${payload.booking_date}T${payload.start_time}:00`;
        const endISO = `${payload.booking_date}T${payload.end_time}:00`;

        try {
            await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action_type: action,
                    ...payload,
                    room_name: selectedRoom?.room_name || 'Unknown Room',
                    user_email: user?.email,
                    user_name: profile?.full_name || user?.email,
                    start_date_time: startISO,
                    end_date_time: endISO
                })
            });
        } catch (err) {
            console.error("Webhook trigger failed:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validate();
        if (error) {
            showToast(error, "error");
            return;
        }

        setLoading(true);
        const payload = {
            title: formData.title,
            room_id: formData.room_id,
            booking_date: formData.date,
            start_time: formData.startTime,
            end_time: formData.endTime,
            attendees: parseInt(formData.attendees),
            description: formData.description,
            user_email: user?.email,
            status: 'CONFIRMED'
        };

        try {
            const { error: dbError } = await supabase
                .from('bookings')
                .insert([payload]);

            if (dbError) throw dbError;

            showToast("Meeting booked successfully!", "success");
            triggerWebhook('create_booking', payload);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            showToast(err.message || "Failed to book meeting", "error");
        } finally {
            setLoading(false);
        }
    };

    const selectedRoomDetails = rooms.find(r => r.id === formData.room_id);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reserve Room">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title Section */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <BookOpen size={12} className="text-[#4F27E9]" />
                        Meeting Title
                    </label>
                    <input 
                        required
                        type="text" 
                        placeholder="e.g. Design Sprint / Client Call" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 transition-all font-bold text-gray-900" 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Room Select */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Room</label>
                        <select 
                            required
                            value={formData.room_id}
                            onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-bold text-gray-900 appearance-none cursor-pointer"
                        >
                            <option value="">Select a room</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Attendees */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendees</label>
                        <div className="relative">
                            <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                required
                                type="number" 
                                min="1"
                                value={formData.attendees}
                                onChange={(e) => setFormData({...formData, attendees: e.target.value})}
                                className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-bold text-gray-900" 
                            />
                        </div>
                    </div>
                </div>

                {/* Logistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar size={12} /> Date
                        </label>
                        <input 
                            required
                            type="date" 
                            min={new Date().toISOString().split('T')[0]}
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-bold text-gray-900" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={12} /> Start
                        </label>
                        <input 
                            required
                            type="time" 
                            value={formData.startTime}
                            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-bold text-gray-900" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={12} /> End
                        </label>
                        <input 
                            required
                            type="time" 
                            value={formData.endTime}
                            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-bold text-gray-900" 
                        />
                    </div>
                </div>

                {/* Capacity Warning */}
                {selectedRoomDetails && parseInt(formData.attendees) > selectedRoomDetails.capacity && (
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-[10px] font-bold text-indigo-700">
                        <AlertCircle size={14} />
                        Over Capacity: This room fits {selectedRoomDetails.capacity} people max.
                    </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meeting Agenda</label>
                    <textarea 
                        rows="3"
                        placeholder="What's this meeting about?"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F27E9]/20 font-medium text-gray-700 resize-none"
                    />
                </div>

                {/* Action */}
                <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-[#4F27E9] text-white hover:bg-[#3D1DB3] rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Confirm Reservation"}
                </Button>
            </form>
        </Modal>
    );
};

export default BookingModal;
