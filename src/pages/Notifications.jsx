import React, { useState, useEffect } from 'react';
import Badge from '../components/ui/Badge';
import { Bell, CheckCircle, Info, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, rooms(room_name)')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            const mapped = data.map(b => {
                let type = 'CONFIRM';
                let title = 'Booking Confirmed';
                let message = `Your booking for ${b.rooms?.room_name || 'a room'} on ${b.booking_date} has been confirmed.`;
                
                if (b.status === 'CANCELLED') {
                    type = 'CANCEL';
                    title = 'Booking Cancelled';
                    message = `The reservation for "${b.title}" has been cancelled.`;
                } else if (b.status === 'EDITED') {
                    type = 'MODIFY';
                    title = 'Booking Modified';
                    message = `Your booking for "${b.title}" has been updated.`;
                }

                return {
                    id: b.id,
                    title,
                    message,
                    type,
                    time: new Date(b.created_at).toLocaleDateString() + ' ' + new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isRead: true // For now, we don't have a read/unread status in DB
                };
            });

            setNotifications(mapped);
        } catch (error) {
            console.error("Error fetching notifications:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'CONFIRM': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'REMINDER': return <Clock className="w-5 h-5 text-blue-500" />;
            case 'MODIFY': return <Info className="w-5 h-5 text-amber-500" />;
            case 'CANCEL': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center text-gray-900">
                <div>
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    <p className="text-gray-500 text-sm">Stay updated with your room bookings and system alerts.</p>
                </div>
                <button className="text-sm font-medium text-[#4F27E9] hover:underline">Mark all as read</button>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm flex justify-center">
                        <div className="w-8 h-8 border-4 border-[#4F27E9]/20 border-t-[#4F27E9] rounded-full animate-spin"></div>
                    </div>
                ) : notifications.length > 0 ? notifications.map((n) => (
                    <div key={n.id} className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${n.isRead ? 'bg-white border-gray-100 shadow-sm' : 'bg-[#FAF9FE] border-[#F0EDFF] shadow-sm'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.isRead ? 'bg-gray-50' : 'bg-white shadow-sm'}`}>
                            {getTypeIcon(n.type)}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`font-bold ${n.isRead ? 'text-gray-900' : 'text-[#6B46C1]'}`}>{n.title}</h3>
                                <span className="text-xs text-gray-400 font-medium">{n.time}</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">{n.message}</p>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>}
                    </div>
                )) : (
                    <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <Bell className="mx-auto w-10 h-10 text-gray-200 mb-2" />
                        <p className="text-gray-500 font-bold">No notifications yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
