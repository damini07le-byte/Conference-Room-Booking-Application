import React from 'react';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
    Calendar, Users, CheckCircle, XCircle, TrendingUp, 
    Activity, ShieldAlert, Clock, Bell, Plus, Info, Bot, Wand2, FileText
} from 'lucide-react';
import BookingModal from '../components/dashboard/BookingModal';
import MoMModal from '../components/dashboard/MoMModal';
import { supabase } from '../lib/supabase';

const CalendarGrid = ({ isAdmin, rooms: roomsData, bookings: todayBookings }) => {
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    const getStatus = (roomId, time) => {
        if (!todayBookings || todayBookings.length === 0) return 'green';
        
        const slotStart = time;
        const slotEnd = `${String(parseInt(time.split(':')[0]) + 1).padStart(2, '0')}:00`;
        
        const booking = todayBookings.find(b => {
            if (b.room_id !== roomId && b.rooms?.id !== roomId) return false;
            if (b.status !== 'CONFIRMED') return false;
            
            // Check for overlap: bookingStart < slotEnd AND bookingEnd > slotStart
            return b.start_time < slotEnd && b.end_time > slotStart;
        });

        if (booking) {
            // If it starts exactly at this time, it's "Starting Soon" if it's within next 30 mins
            // For simplicity in this grid, we'll mark it red if booked
            return 'red';
        }
        
        return 'green';
    };

    const colors = {
        green: 'bg-[#F0FFF4] border-[#C6F6D5] text-[#2F855A]',
        red: 'bg-[#FFF5F5] border-[#FED7D7] text-[#C53030]',
        orange: 'bg-[#FFFAF0] border-[#FEEBC8] text-[#9C4221]',
        grey: 'bg-gray-50 border-gray-100 text-gray-400'
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Room Availability Calendar</h3>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#F0FFF4] border border-[#C6F6D5]"></div> Available</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#FFF5F5] border border-[#FED7D7]"></div> Booked</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#FFFAF0] border border-[#FEEBC8]"></div> Starting Soon</div>
                </div>
            </div>
            <div className="overflow-x-auto p-6">
                <table className="w-full border-separate border-spacing-2">
                    <thead>
                        <tr>
                            <th className="p-2"></th>
                            {timeSlots.map(time => (
                                <th key={time} className="p-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{time}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(roomsData || []).map(room => (
                            <tr key={room.id}>
                                <td className="p-2 text-sm font-bold text-gray-900 whitespace-nowrap min-w-[140px]">{room.room_name}</td>
                                {timeSlots.map(time => {
                                    const status = getStatus(room.id, time);
                                    const slotBooking = todayBookings?.find(b => (b.room_id === room.id || b.rooms?.id === room.id) && b.status === 'CONFIRMED' && b.start_time <= time && b.end_time > time);
                                    
                                    return (
                                        <td key={time} className="p-0">
                                            <div className={`h-12 w-full rounded-xl border flex items-center justify-center transition-all cursor-pointer hover:scale-[1.02] ${colors[status]}`}>
                                                {status === 'red' && isAdmin && <span className="text-[10px] font-bold px-1 text-center truncate">{slotBooking?.title || 'Booked'}</span>}
                                                {status === 'green' && <Plus size={14} className="opacity-40" />}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {(!roomsData || roomsData.length === 0) && (
                            <tr>
                                <td colSpan={timeSlots.length + 1} className="py-10 text-center text-gray-400 text-sm">No rooms found. Add rooms in the Rooms Management page.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
const Dashboard = () => {
    const { user } = useAuth();
    const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
    const [bookingInitialData, setBookingInitialData] = React.useState(null);
    const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

    const [isMoMModalOpen, setIsMoMModalOpen] = React.useState(false);
    const [selectedBookingForMoM, setSelectedBookingForMoM] = React.useState(null);
    const [todayBookings, setTodayBookings] = React.useState([]);
    const [stats, setStats] = React.useState({
        totalToday: 0,
        activeRooms: 0,
        cancellations: 0,
        peakRoom: 'N/A'
    });
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (user) fetchTodayBookings();
    }, [user]);

    const fetchTodayBookings = async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split('T')[0];

        const { data: roomsData } = await supabase
            .from('rooms')
            .select('*');

        const { data: bookingsData } = await supabase
            .from('bookings')
            .select('*, rooms(room_name)')
            .order('created_at', { ascending: false });

        const todayList = bookingsData?.filter(b => b.booking_date === today) || [];
        const yesterdayList = bookingsData?.filter(b => b.booking_date === yesterday) || [];
        
        // Heatmap Calculation (Assuming 9 hour day: 9am-6pm)
        const totalWorkMinutes = 9 * 60;
        const heatmap = (roomsData || []).map(room => {
            const roomBookings = todayList.filter(b => (b.rooms?.id || b.room_id) === room.id && b.status === 'CONFIRMED');
            let bookedMinutes = 0;
            roomBookings.forEach(b => {
                const start = b.start_time.split(':').map(Number);
                const end = b.end_time.split(':').map(Number);
                bookedMinutes += (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
            });
            return {
                name: room.room_name,
                val: Math.min(100, Math.round((bookedMinutes / totalWorkMinutes) * 100)),
                color: bookedMinutes > 300 ? 'bg-[#4F27E9]' : bookedMinutes > 120 ? 'bg-indigo-400' : 'bg-indigo-200'
            };
        });

        const mappedTodayList = todayList.map(b => ({
            ...b,
            id: b.booking_id || b.id,
            date: b.booking_date,
            startTime: b.start_time?.substring(0, 5),
            endTime: b.end_time?.substring(0, 5),
            room: b.rooms?.room_name || 'Unknown Room'
        }));

        setTodayBookings(mappedTodayList);

        // Calculate Stats
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const active = todayList.filter(b => 
            b.status === 'CONFIRMED' && 
            b.start_time <= currentTime && 
            b.end_time >= currentTime
        ).length;

        const cancelled = todayList.filter(b => b.status === 'CANCELLED').length;
        const yesterdayCancelled = yesterdayList.filter(b => b.status === 'CANCELLED').length;

        const roomCounts = {};
        todayList.forEach(b => {
            const rName = b.rooms?.room_name || 'Unknown';
            roomCounts[rName] = (roomCounts[rName] || 0) + 1;
        });
        const peak = Object.entries(roomCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Fetch Upcoming for user (Current time onwards)
        const upcoming = bookingsData?.filter(b => 
            (b.booking_date > today || (b.booking_date === today && b.start_time > currentTime)) &&
            b.status === 'CONFIRMED'
        ).slice(0, 5).map(b => ({
            ...b,
            startTime: b.start_time?.substring(0, 5),
            room: b.rooms?.room_name || 'Unknown Room'
        })) || [];

        // Find "Next Available Room" for quick booking
        const nextAvailable = roomsData?.find(r => {
            return !todayList.some(b => 
                (b.room_id === r.id || b.rooms?.id === r.id) && 
                b.status === 'CONFIRMED' && 
                b.start_time <= currentTime && 
                b.end_time > currentTime
            );
        }) || roomsData?.[0];

        // Unique Attendees for today
        const attendeeEmails = new Set();
        todayList.forEach(b => {
            if (b.attendee_emails) {
                b.attendee_emails.split(',').forEach(e => attendeeEmails.add(e.trim()));
            }
        });

        setStats({
            totalToday: todayList.length,
            totalYesterday: yesterdayList.length,
            activeRooms: active,
            cancellations: cancelled,
            yesterdayCancellations: yesterdayCancelled,
            peakRoom: peak,
            heatmap,
            rooms: roomsData,
            upcoming,
            nextAvailable,
            attendeeCount: attendeeEmails.size,
            allBookings: bookingsData?.slice(0, 10).map(b => ({
                ...b,
                user_name: b.user_id ? 'Employee' : 'Guest',
                room_name: b.rooms?.room_name || 'Unknown'
            })) || []
        });

        setLoading(false);
    };

    const handleOpenBooking = (data = null) => {
        setBookingInitialData(data);
        setIsBookingModalOpen(true);
    };

    const handleOpenMoM = (booking) => {
        setSelectedBookingForMoM(booking);
        setIsMoMModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in group/dashboard">
            {isAdmin ? (
                <AdminDashboardView onOpenBooking={handleOpenBooking} stats={stats} todayBookings={todayBookings} />
            ) : (
                <UserDashboardView 
                    user={user} 
                    onOpenBooking={handleOpenBooking} 
                    todayBookings={todayBookings}
                    onOpenMoM={handleOpenMoM}
                    loadingToday={loading}
                    stats={stats}
                />
            )}

            <BookingModal 
                isOpen={isBookingModalOpen} 
                onClose={() => setIsBookingModalOpen(false)}
                initialData={bookingInitialData}
                onSuccess={() => {
                    fetchTodayBookings();
                }}
            />

            <MoMModal 
                isOpen={isMoMModalOpen}
                onClose={() => setIsMoMModalOpen(false)}
                booking={selectedBookingForMoM}
                onSuccess={fetchTodayBookings}
            />
        </div>
    );
};

const AdminDashboardView = ({ onOpenBooking, stats, todayBookings }) => {
    const getTrend = (current, previous) => {
        if (previous === undefined || previous === null || previous === 0) {
            if (current > 0) return { value: 100, isUp: true };
            return null;
        }
        const diff = ((current - previous) / previous) * 100;
        return {
            value: Math.abs(Math.round(diff)),
            isUp: diff >= 0
        };
    };

    const bookingTrend = getTrend(stats.totalToday, stats.totalYesterday);
    const cancellationTrend = getTrend(stats.cancellations, stats.yesterdayCancellations);

    const kpis = [
        { 
            title: 'Total Bookings Today', 
            value: stats.totalToday || '0', 
            icon: <Calendar className="w-5 h-5" />, 
            color: 'bg-blue-50 text-blue-600',
            trend: bookingTrend ? `${bookingTrend.isUp ? '+' : '-'}${bookingTrend.value}% vs yesterday` : 'No past data'
        },
        { 
            title: 'Currently Active', 
            value: stats.activeRooms || '0', 
            icon: <Activity className="w-5 h-5" />, 
            color: 'bg-green-50 text-green-600' 
        },
        { 
            title: 'Cancellations Today', 
            value: stats.cancellations || '0', 
            icon: <XCircle className="w-5 h-5" />, 
            color: 'bg-red-50 text-red-600',
            trend: cancellationTrend ? `${cancellationTrend.isUp ? '+' : '-'}${cancellationTrend.value}% vs yesterday` : '0% vs yesterday'
        },
        { 
            title: 'Peak Usage Room', 
            value: stats.peakRoom || 'N/A', 
            icon: <TrendingUp className="w-5 h-5" />, 
            color: 'bg-indigo-50 text-indigo-600' 
        },
    ];

    return (
        <div className="space-y-8">
            {/* KPI Section */}
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Live Monitoring Hub</h2>
                <div className="flex gap-3">
                    <Button className="bg-white text-gray-900 border-gray-100 hover:bg-gray-50 flex items-center gap-2 h-9 px-4 text-xs font-bold shadow-sm">
                        <TrendingUp size={14} className="text-[#4F27E9]" />
                        Export Analytics
                    </Button>
                    <Button 
                        onClick={() => onOpenBooking()}
                        className="bg-[#4F27E9] text-white hover:bg-[#3D1DB3] border-none flex items-center gap-2 h-9 px-4 text-xs font-bold shadow-sm"
                    >
                        <Plus size={14} />
                        Manual Override
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${kpi.color}`}>
                                {kpi.icon}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">{kpi.title}</p>
                                <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
                            </div>
                        </div>
                        {kpi.trend && (
                            <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.trend.includes('+') ? 'bg-green-50 text-green-600' : kpi.trend.includes('-') ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                                    {kpi.trend}
                                </span>
                                <span className="text-[10px] text-gray-300 font-medium">Analytics Insight</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Availability Grid */}
            <CalendarGrid isAdmin={true} rooms={stats.rooms} bookings={todayBookings} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bookings Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">All Recent activity</h3>
                        <button className="text-xs text-[#4F27E9] font-bold hover:underline">View Full Audit Log</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Room</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {(stats.allBookings || []).map((booking, i) => (
                                    <tr key={booking.id || i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.id}`} className="w-8 h-8 rounded-full bg-gray-100" />
                                            <span className="font-bold text-gray-900">{booking.title || 'Untitled Meeting'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{booking.room_name}</td>
                                        <td className="px-6 py-4 text-gray-500 font-medium text-xs">
                                            {booking.booking_date} · {booking.start_time?.substring(0, 5)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge status={booking.status?.toLowerCase()}>{booking.status}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#4F27E9]" title="View Details">
                                                <Info size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats.allBookings || stats.allBookings.length === 0) && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-400 font-medium">No recent activity found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Stats / Heatmap */}
                <div className="space-y-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#4F27E9]" />
                            Room Heatmap
                        </h3>
                        <div className="space-y-5">
                            {(stats.heatmap || []).map((room, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                                        <span className="text-gray-500">{room.name}</span>
                                        <span className="text-[#4F27E9]">{room.val}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${room.color} rounded-full transition-all duration-1000`} style={{ width: `${room.val}%` }}></div>
                                    </div>
                                </div>
                            ))}
                            {(!stats.heatmap || stats.heatmap.length === 0) && (
                                <p className="text-xs text-center text-gray-400 font-medium py-10">No data available for heatmap</p>
                            )}
                        </div>
                        <p className="mt-6 text-[10px] text-gray-400 font-medium italic">Data based on past 30 days utilisation.</p>
                    </div>

                    <div className="bg-[#111834] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-amber-500" />
                                System Health
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs border-b border-white/10 pb-3">
                                    <span className="text-gray-400 font-medium tracking-tight">Booking Engine (WF-07)</span>
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[9px] font-black uppercase tracking-widest border border-green-500/20">Operational</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-b border-white/10 pb-3">
                                    <span className="text-gray-400 font-medium tracking-tight">Notif Cluster (WF-11)</span>
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[9px] font-black uppercase tracking-widest border border-green-500/20">Operational</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-medium tracking-tight">Last Data Sync</span>
                                    <span className="text-gray-300 font-bold">{new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                        <Activity className="absolute -bottom-6 -right-6 w-24 h-24 text-white/5 group-hover:text-white/10 transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserDashboardView = ({ user, onOpenBooking, todayBookings, onOpenMoM, loadingToday }) => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content (3 cols) */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Welcome Banner */}
                    <div className="bg-[#4F27E9] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 max-w-lg">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">
                                <Bot size={14} className="text-white" />
                                Pucho OS · Employee Portal
                            </div>
                            <h2 className="text-4xl font-black mb-3 tracking-tight">Hello, {user?.full_name?.split(' ')[0]}!</h2>
                            <p className="text-white/70 mb-10 font-medium text-lg leading-relaxed">Ready to automate your next meeting? Your personal assistant is ready in the bottom corner.</p>
                            <div className="flex items-center gap-4">
                                <Button 
                                    onClick={() => onOpenBooking()}
                                    className="bg-white text-[#4F27E9] hover:bg-gray-100 border-none px-10 h-14 font-black rounded-2xl shadow-xl hover:scale-105 transition-all text-sm"
                                >
                                    Quick Book Room
                                </Button>
                                <div className="flex -space-x-3 items-center ml-4">
                                    {[1, 2, 3].map(i => (
                                        <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + (stats.attendeeCount || 0)}`} className="w-10 h-10 rounded-full border-2 border-[#4F27E9] bg-white shadow-sm" alt="Attendee" />
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-[#4F27E9] bg-indigo-300 flex items-center justify-center text-[10px] font-black text-white">+{stats.attendeeCount || 0}</div>
                                    <p className="text-xs font-bold text-white/50 ml-6 tracking-tight">Today's Attendees</p>
                                </div>
                            </div>
                        </div>
                        <Calendar className="absolute -bottom-16 -right-16 w-80 h-80 text-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000 opacity-20" />
                        <div className="absolute top-12 right-12 w-48 h-48 bg-white/5 rounded-full blur-[80px]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Quick Book Panel */}
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col justify-between">
                            <div>
                                <h3 className="font-black text-[#111834] mb-2 flex items-center gap-3 text-lg">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4F27E9]">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    Quick Book
                                </h3>
                                <p className="text-xs font-medium text-gray-400 mb-8 leading-relaxed">Instantly reserve the best available room for your immediate team sync or 1-on-1.</p>
                                
                                <div className="space-y-4">
                                    {stats.nextAvailable ? (
                                        <div className="p-4 rounded-2xl bg-[#FAF9FE] border border-[#F0EDFF] hover:border-[#4F27E9] transition-all cursor-pointer group flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 group-hover:text-[#4F27E9]">Next Available Room</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{stats.nextAvailable.room_name} · {stats.nextAvailable.floor_location}</p>
                                            </div>
                                            <Button 
                                                onClick={() => onOpenBooking({ room_id: stats.nextAvailable.id, title: 'Quick Team Meeting' })}
                                                className="h-8 px-4 text-[10px] font-black bg-[#4F27E9] rounded-xl hover:bg-[#3D1DB3]"
                                            >
                                                BOOK NOW
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 font-medium italic">All rooms currently occupied.</p>
                                    )}
                                </div>
                            </div>
                            <button className="w-full mt-6 py-4 border-2 border-dashed border-gray-100 rounded-2xl text-[11px] font-black text-gray-400 hover:text-[#4F27E9] hover:border-[#4F27E9] hover:bg-indigo-50/50 transition-all uppercase tracking-widest">
                                EXPLORE ALL ROOMS
                            </button>
                        </div>

                        {/* My Today Panel */}
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-[#111834] flex items-center gap-3 text-lg">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    My Today
                                </h3>
                                <button className="text-[10px] font-black text-[#4F27E9] hover:underline uppercase tracking-widest">HISTORY</button>
                            </div>
                            <div className="space-y-4">
                                {loadingToday ? (
                                    <div className="flex justify-center py-10">
                                        <div className="w-8 h-8 border-4 border-pucho-blue/20 border-t-pucho-blue rounded-full animate-spin"></div>
                                    </div>
                                ) : todayBookings.length > 0 ? todayBookings.map((booking) => (
                                    <div key={booking.id} className="p-5 rounded-2xl bg-[#FAF9FE] border border-[#F0EDFF] shadow-sm group/item">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-[#111834] text-sm leading-tight mb-1">{booking.title || 'Untitled Meeting'}</h4>
                                                <p className="text-xs font-bold text-gray-400">{booking.startTime} - {booking.endTime}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge status={booking.status?.toLowerCase()}>{booking.status}</Badge>
                                                {booking.summary_sent && (
                                                    <span className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">
                                                        <CheckCircle size={10} /> Summary Sent
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-200/50">
                                            <span className="text-[11px] font-bold text-gray-500">{booking.room}</span>
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => onOpenMoM(booking)}
                                                    className="text-[10px] font-black text-[#4F27E9] hover:underline uppercase tracking-widest flex items-center gap-1"
                                                >
                                                    <Wand2 size={12} /> MoM
                                                </button>
                                                <button className="text-[10px] font-black text-gray-400 hover:text-[#4F27E9] uppercase tracking-widest">Edit</button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="bg-gray-50 rounded-2xl p-8 text-center">
                                        <Calendar className="mx-auto w-10 h-10 text-gray-200 mb-2" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No meetings booked for today</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Availability Grid */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="font-black text-[#111834] tracking-tight text-xl uppercase">Full Studio Capacity View</h3>
                            <button className="text-xs font-bold text-gray-400 flex items-center gap-1 hover:text-[#4F27E9] transition-colors">
                                <Calendar size={14} /> View Month
                            </button>
                        </div>
                        <CalendarGrid isAdmin={false} rooms={stats.rooms} bookings={todayBookings} />
                    </div>
                </div>

                {/* Sidebar (1 col) */}
                <div className="space-y-8 lg:mt-0">
                    {/* User Profile Info */}
                    <div className="bg-[#111834] rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.full_name}`} className="w-20 h-20 rounded-[28px] border-4 border-white/10 bg-white/5 mb-6 shadow-2xl" alt="Profile" />
                            <h3 className="text-xl font-bold mb-1">{user?.full_name}</h3>
                            <p className="text-xs font-black text-[#4F27E9] uppercase tracking-[0.2em] mb-4">Account Verified</p>
                            
                            <div className="space-y-4 pt-6 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Department</span>
                                    <span className="text-xs font-bold">{user?.department || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Role</span>
                                    <span className="text-xs font-bold uppercase tracking-tighter bg-white/10 px-2 py-0.5 rounded-lg border border-white/5">{user?.role}</span>
                                </div>
                            </div>
                        </div>
                        <ShieldAlert className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5 group-hover:text-white/10 transition-all duration-700" />
                    </div>

                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                        <h3 className="font-black text-[#111834] mb-8 flex items-center gap-3 tracking-tight">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4F27E9]">
                                <Clock className="w-5 h-5" />
                            </div>
                            Upcoming
                        </h3>
                        <div className="space-y-8">
                            {stats.upcoming && stats.upcoming.length > 0 ? stats.upcoming.map((b, i) => (
                                <div key={b.id} className="flex gap-5 relative group cursor-pointer">
                                    <div className={`w-1.5 h-12 rounded-full transition-all group-hover:h-14 ${i === 0 ? 'bg-[#4F27E9]' : 'bg-indigo-100'}`}></div>
                                    <div className="py-0.5">
                                        <p className="text-sm font-bold text-[#111834] group-hover:text-[#4F27E9] transition-colors">{b.title}</p>
                                        <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{b.booking_date} • {b.startTime}</p>
                                    </div>
                                    {i === 0 && <div className="absolute top-1 right-0 w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>}
                                </div>
                            )) : (
                                <p className="text-xs text-gray-400 font-medium">No upcoming meetings.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                        <div className="flex justify-between items-start mb-8">
                            <h3 className="font-black text-[#111834] flex items-center gap-3 tracking-tight">
                                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Bell className="w-5 h-5" />
                                </div>
                                Notifications
                            </h3>
                            <span className="bg-[#4F27E9] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-lg shadow-lg">3</span>
                        </div>
                        <div className="space-y-6">
                            {todayBookings && todayBookings.length > 0 ? todayBookings.slice(0, 3).map((b, i) => (
                                <div key={b.id} className="group cursor-pointer">
                                    <p className={`text-[11px] font-black ${i === 0 ? 'text-[#4F27E9]' : 'text-gray-400'} uppercase tracking-[0.2em] mb-1`}>
                                        {b.status === 'CONFIRMED' ? 'Meeting Confirmed' : 'System Alert'}
                                    </p>
                                    <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-relaxed">
                                        {b.title} in {b.room} is {b.status.toLowerCase()}.
                                    </p>
                                    <p className="text-[9px] font-black text-gray-300 mt-2 uppercase tracking-tight">Today • {b.startTime}</p>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-400 font-medium">No recent notifications.</p>
                            )}
                        </div>
                        <Button className="w-full mt-10 bg-[#FAF9FE] text-[#4F27E9] hover:bg-indigo-50 border-none text-[11px] font-black tracking-widest h-12 rounded-2xl">VIEW ALL ALERTS</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
