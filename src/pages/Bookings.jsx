import React, { useState, useEffect } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Calendar, Clock, MapPin, Users, Info, Plus, Edit2, XCircle, FileText, Wand2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import MoMModal from '../components/dashboard/MoMModal';

const Bookings = () => {
    const { showToast } = useToast();
    const { user, profile } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [cancelConfirm, setCancelConfirm] = useState(null); // Booking to confirm cancel

    const [editingBooking, setEditingBooking] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        room_id: '',
        date: '',
        startTime: '',
        endTime: '',
        attendees: 1,
        attendee_emails: '', // Comma separated emails
        description: ''
    });

    const [isMoMModalOpen, setIsMoMModalOpen] = useState(false);
    const [selectedBookingForMoM, setSelectedBookingForMoM] = useState(null);

    const WEBHOOK_URL = "https://studio.pucho.ai/api/v1/webhooks/8F0t3Zmk3XRABYJ8P77k6/sync";

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        // Fetch Rooms for the dropdown
        const { data: roomsData } = await supabase
            .from('rooms')
            .select('*')
            .order('room_name', { ascending: true });
        
        // Map fields to ensure consistency with internal state expectations
        const mappedRooms = (roomsData || []).map(r => ({
            ...r,
            id: r.id || r.room_id,
            name: r.room_name,
            capacity: parseInt(r.capacity) || 0,
            status: (r.status === 'ACTIVE' || r.status === true) ? 'Active' : 'Inactive'
        }));
        
        setRooms(mappedRooms);

        // Fetch Bookings
        const { data: bData } = await supabase
            .from('bookings')
            .select('*, rooms(room_name)')
            .order('booking_date', { ascending: false });
        
        setBookings(bData?.map(b => ({
            ...b,
            id: b.booking_id || b.id, // Map database identifier to internal 'id'
            date: b.booking_date || b.date,
            startTime: b.start_time?.substring(0, 5), // Hide seconds for display
            endTime: b.end_time?.substring(0, 5),     // Hide seconds for display
            room: b.rooms?.room_name || 'Unknown Room'
        })) || []);
        setLoading(false);
    };

    const handleOpenModal = (booking = null) => {
        if (booking) {
            setEditingBooking(booking);
            setFormData({
                title: booking.title || '',
                room_id: booking.room_id,
                date: booking.date,
                startTime: booking.start_time,
                endTime: booking.end_time,
                attendees: booking.attendees,
                attendee_emails: booking.attendee_emails || '',
                description: booking.description
            });
        } else {
            setEditingBooking(null);
            setFormData({
                title: '',
                room_id: '',
                date: '',
                startTime: '',
                endTime: '',
                attendees: 1,
                attendee_emails: '',
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const validateBooking = () => {
        const { room_id, date, startTime, endTime, attendees } = formData;
        
        // Robust check for room selection
        const selectedRoom = rooms.find(r => 
            String(r.id).trim() === String(room_id).trim()
        );
        
        if (!selectedRoom || !room_id) {
            return { pass: false, error: "Please select a room from the dropdown list." };
        }

        const now = new Date();
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        // Rule 1: No Overlap
        const overlap = bookings.find(b => 
            b.status === 'Confirmed' &&
            String(b.room_id).trim() === String(room_id).trim() &&
            b.date === date &&
            b.id !== editingBooking?.id &&
            ((startTime >= b.start_time && startTime < b.end_time) ||
             (endTime > b.start_time && endTime <= b.end_time) ||
             (startTime <= b.start_time && endTime >= b.end_time))
        );
        if (overlap) return { pass: false, error: `This room is already reserved for the selected timing.` };

        // Rule 2: Capacity Check
        if (parseInt(attendees) > selectedRoom.capacity) {
            return { pass: false, error: `Room capacity is ${selectedRoom.capacity}, you entered ${attendees} attendees.` };
        }

        // Rule 3: Future Date Only
        if (start < now) return { pass: false, error: `Cannot book past dates or time slots.` };

        // Rule 4: Duration Limits - REMOVED AS REQUESTED
        // Allowing any duration

        return { pass: true };
    };

    const triggerWebhook = async (action, payload) => {
        const roomName = rooms.find(r => r.id === payload.room_id)?.room_name;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Build ISO datetime strings for Google Calendar compatibility
        const bookingDate = payload.booking_date || payload.date || '';
        const startRaw = payload.start_time || payload.startTime || '';
        const endRaw = payload.end_time || payload.endTime || '';
        const startISO = bookingDate && startRaw ? `${bookingDate}T${startRaw.length === 5 ? startRaw + ':00' : startRaw}` : '';
        const endISO = bookingDate && endRaw ? `${bookingDate}T${endRaw.length === 5 ? endRaw + ':00' : endRaw}` : '';

        try {
            console.log("Triggering Webhook:", action, payload);
            await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action_type: action,
                    ...payload,
                    room_name: roomName,
                    user_email: user?.email || 'unknown@user.com',
                    user_name: profile?.full_name || 'Unknown User',
                    // Pre-formatted for Google Calendar 'Create Event' node
                    start_date_time: startISO,
                    end_date_time: endISO
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            console.log("Webhook success!");
        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Webhook Error (Timeout or Network):", error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validation = validateBooking();
        if (!validation.pass) {
            showToast(validation.error, "error");
            return;
        }

        setLoading(true);
        // Database Payload (Supabase)
        const dbData = {
            title: formData.title || 'Meeting',
            room_id: formData.room_id,
            booking_date: formData.date,
            start_time: formData.startTime,
            end_time: formData.endTime,
            attendees: parseInt(formData.attendees),
            attendee_emails: formData.attendee_emails, // Multi-attendee support
            description: formData.description,
            user_email: user?.email || 'unknown@user.com', // Added for UC-5 Reminders
            status: 'CONFIRMED'
        };

        // Complete data for Webhook/Logging (Adding ISO combined fields and Room Name for easier Calendar mapping)
        const selectedRoom = rooms.find(r => r.id === formData.room_id);
        const fullPayload = {
            ...dbData,
            room_name: selectedRoom?.name || 'Unknown Room',
            start_date_time: `${formData.date}T${formData.startTime}:00`,
            end_date_time: `${formData.date}T${formData.endTime}:00`,
            user_email: user?.email || 'unknown@user.com',
            user_name: profile?.full_name || 'Unknown User'
        };

        console.log("Submitting Booking to DB:", dbData);

        try {
            if (editingBooking) {
                const { error } = await supabase
                    .from('bookings')
                    .update(dbData)
                    .eq('booking_id', editingBooking.id); // Use booking_id for update
                if (error) throw error;
                showToast("Booking updated", "success");
                triggerWebhook('edit_booking', { ...fullPayload, booking_id: editingBooking.id });
            } else {
                const { error } = await supabase
                    .from('bookings')
                    .insert([dbData]);
                if (error) throw error;
                showToast("Booking created", "success");
                triggerWebhook('create_booking', fullPayload);
            }
            fetchInitialData();
            setIsModalOpen(false);
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
                .eq('booking_id', id);
            if (error) throw error;

            const booking = bookings.find(b => b.id === id);
            showToast('Booking cancelled successfully.', 'success');
            triggerWebhook('cancel_booking', { ...booking, status: 'CANCELLED' });
            fetchInitialData();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
            setCancelConfirm(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-900">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">Bookings</h1>
                    </div>
                    <p className="text-gray-500 text-sm">Manage and schedule your conference room reservations.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <Plus size={18} />
                    New Booking
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-gray-900">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold">My Bookings</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Meeting</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">MoM</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-500 text-xs">{booking.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                            <MapPin size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{booking.title || 'Meeting'}</span>
                                                <span className="text-xs text-gray-500">{booking.room}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{booking.date}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {booking.startTime} - {booking.endTime}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge status={booking.status?.toLowerCase()}>{booking.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {booking.summary_sent
                                            ? <span title="Meeting summary sent" className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-lg"><FileText size={11}/> Sent</span>
                                            : <span title="No summary sent yet" className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg"><FileText size={11}/> Pending</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => {
                                                    setSelectedBookingForMoM(booking);
                                                    setIsMoMModalOpen(true);
                                                }}
                                                className="p-1.5 rounded-lg transition-all hover:bg-pucho-blue/10 text-gray-400 hover:text-pucho-blue"
                                                title="Add Meeting Minutes (AI Summary)"
                                            >
                                                <Wand2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleOpenModal(booking)}
                                                className="p-1.5 rounded-lg transition-all hover:bg-gray-100 text-gray-400 hover:text-[#4F27E9]"
                                                title="Edit Booking"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setCancelConfirm(booking)}
                                                disabled={booking.status === 'CANCELLED'}
                                                className={`p-1.5 rounded-lg transition-all ${booking.status === 'CANCELLED' ? 'opacity-30 cursor-not-allowed text-gray-300' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                                                title="Cancel Booking"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingBooking ? "Edit Booking" : "Create New Booking"}
            >
                <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-gray-900">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Meeting Title</label>
                        <input 
                            required
                            type="text" 
                            placeholder="e.g. Project Sync / Design Review" 
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/20 transition-all font-medium" 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    required
                                    type="date" 
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/20 transition-all font-medium" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1 flex justify-between">
                                Room 
                                {formData.room_id && <span className="text-[10px] text-green-500 font-bold">✓ Selected</span>}
                            </label>
                            <select 
                                required
                                value={formData.room_id}
                                onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/20 transition-all appearance-none font-medium"
                            >
                                <option value="">Select a room</option>
                                {rooms.map(room => (
                                    <option key={String(room.id)} value={String(room.id)}>
                                        {room.room_name || room.name} (Cap: {room.capacity})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Start Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    required
                                    type="time" 
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/20 transition-all font-medium" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">End Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    required
                                    type="time" 
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/20 transition-all font-medium" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Attendees</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    required
                                    type="number" 
                                    placeholder="4" 
                                    value={formData.attendees}
                                    onChange={(e) => setFormData({...formData, attendees: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/20 transition-all font-medium" 
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Attendee Emails (Comma separated)</label>
                        <textarea 
                            rows="2" 
                            placeholder="email1@example.com, email2@example.com" 
                            value={formData.attendee_emails}
                            onChange={(e) => setFormData({...formData, attendee_emails: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/20 transition-all font-medium" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Description / Agenda</label>
                        <div className="relative">
                            <Info className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea 
                                rows="3" 
                                placeholder="Weekly sync..." 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-blue/20 transition-all font-medium" 
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-50 font-medium transition-colors">
                            Cancel
                        </button>
                        <Button type="submit" className="px-8 shadow-md">
                            {editingBooking ? 'Update Booking' : 'Confirm Booking'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Cancel Confirmation Modal */}
            {cancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-red-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                <XCircle size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-base">Cancel Booking?</h3>
                                <p className="text-xs text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
                            <p className="font-semibold text-gray-800">{cancelConfirm.title || 'Meeting'}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{cancelConfirm.date} · {cancelConfirm.startTime} – {cancelConfirm.endTime}</p>
                            <p className="text-gray-500 text-xs">{cancelConfirm.room}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCancelConfirm(null)}
                                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
                            >
                                Keep Booking
                            </button>
                            <button
                                onClick={() => handleCancel(cancelConfirm.id)}
                                disabled={loading}
                                className="flex-1 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
                            >
                                {loading ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MoM Modal */}
            <MoMModal 
                isOpen={isMoMModalOpen}
                onClose={() => setIsMoMModalOpen(false)}
                booking={selectedBookingForMoM}
                onSuccess={fetchInitialData}
            />
        </div>
    );
};

export default Bookings;
