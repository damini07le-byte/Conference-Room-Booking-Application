import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Save, Clock, Calendar, CheckCircle, User, Mail, Phone, Lock, Camera, UploadCloud } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

const Settings = () => {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);

    // Profile Information
    const [profileInfo, setProfileInfo] = useState({
        full_name: '',
        email: '',
        phone: '',
        department: '',
        bio: '',
        avatar_url: ''
    });

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // Default Rules (UC-7)
    const [rules, setRules] = useState({
        max_duration: 120, // minutes
        min_duration: 15,
        advance_booking_days: 14,
        buffer_time: 10,
        require_approval: false
    });

    // Notification Preferences (UC-5) - synced with Supabase
    const [notifications, setNotifications] = useState({
        email_alerts: true,
        slack_sync: false,
        reminder_30min: true,
        daily_report: true
    });

    useEffect(() => {
        // Load settings from local storage
        const savedRules = localStorage.getItem('booking_rules');
        if (savedRules) setRules(JSON.parse(savedRules));

        // Sync with Auth session data immediately
        if (user) {
            setUserId(user.id);
            setProfileInfo(prev => ({
                ...prev,
                full_name: user.full_name || prev.full_name,
                email: user.email || '',
                department: user.department || prev.department
            }));
        }
    }, [user]);

    // Fetch profile and notification preferences from Supabase for latest data
    const fetchUserData = async () => {
        if (!userId) return;
        
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (data && !error) {
                setProfileInfo({
                    full_name: data.full_name || '',
                    email: user?.email || data.email || '',
                    phone: data.phone || '',
                    department: data.department || '',
                    bio: data.bio || '',
                    avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${data.full_name}`
                });
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    };

    useEffect(() => {
        if (userId) fetchUserData();
    }, [userId]);

    const handleSaveProfile = async () => {
        setLoading(true);
        if (userId) {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: profileInfo.full_name,
                    phone: profileInfo.phone,
                    department: profileInfo.department,
                    bio: profileInfo.bio,
                    avatar_url: profileInfo.avatar_url
                })
                .eq('user_id', userId);
            
            if (error) {
                showToast("Failed to update profile", "error");
            } else {
                showToast("Profile updated successfully", "success");
            }
        }
        setLoading(false);
    };

    const handleUpdatePassword = async () => {
        if (!passwords.newPassword || passwords.newPassword !== passwords.confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }
        
        setLoading(true);
        try {
            // 🚀 1. HASH NEW PASSWORD (FOR CUSTOM AUTH SYNC)
            const bcrypt = (await import('bcryptjs')).default;
            const hashedPassword = bcrypt.hashSync(passwords.newPassword, 10);

            // 🚀 2. UPDATE DATABASE TABLE DIRECTLY
            const { error } = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('id', user.id);

            if (error) throw error;

            showToast("Password updated successfully", "success");
            setPasswords({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error("[Settings] Password Update Failure:", error.message);
            showToast(error.message || "Failed to update password", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = (e) => {
        // In a real app, you'd upload to Supabase Storage
        // For now, we simulate with a temporary URL or just show toast
        showToast("Photo upload simulation: In production, this would save to Supabase Storage", "info");
    };

    const handleSaveRules = () => {
        setLoading(true);
        localStorage.setItem('booking_rules', JSON.stringify(rules));
        setTimeout(() => {
            showToast("Global booking rules updated", "success");
            setLoading(false);
        }, 800);
    };

    const handleSaveNotifications = async () => {
        setLoading(true);
        
        // Save to localStorage as backup
        localStorage.setItem('user_notifications', JSON.stringify(notifications));
        
        // Save to Supabase for Pucho workflows to read
        if (userId) {
            const { error } = await supabase
                .from('users')
                .update({
                    email_alerts: notifications.email_alerts,
                    slack_sync: notifications.slack_sync,
                    reminder_30min: notifications.reminder_30min,
                    daily_report: notifications.daily_report
                })
                .eq('user_id', userId);
            
            if (error) {
                showToast("Failed to save preferences to server", "error");
                console.error("Supabase update error:", error);
            } else {
                showToast("Notification preferences saved", "success");
            }
        } else {
            showToast("Notification preferences saved locally", "success");
        }
        
        setLoading(false);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in text-[#111834] pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-premium">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#4F27E9] flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <SettingsIcon className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight leading-none">Preferences</h1>
                        <p className="text-sm font-medium text-gray-500">Configure your workspace identity and rules.</p>
                    </div>
                </div>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-[48px] border border-gray-100 shadow-premium overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-50/50">
                <div className="px-10 py-8 border-b border-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4F27E9]">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">Personal Identity</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Profile Configuration</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSaveProfile} 
                        disabled={loading} 
                        className="bg-[#4F27E9] text-white hover:bg-[#3D1DB3] h-12 px-8 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <Save size={16} />
                        Sync Profile
                    </button>
                </div>
                
                <div className="p-10 flex flex-col lg:flex-row gap-12">
                    {/* Avatar Column */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-[56px] overflow-hidden border-[6px] border-white shadow-3xl relative transition-transform duration-500 group-hover:scale-[1.02]">
                                <img 
                                    src={profileInfo.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profileInfo.full_name}`} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-[#4F27E9]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <Camera className="text-white w-10 h-10" />
                                </div>
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-white text-[#4F27E9] rounded-[20px] shadow-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all border border-gray-100">
                                <UploadCloud size={20} />
                                <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                            </label>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Identity</p>
                            <p className="text-xs font-bold text-gray-900">{profileInfo.full_name || 'Member'}</p>
                        </div>
                    </div>

                    {/* Fields Grid */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Display Name</label>
                            <input 
                                type="text" 
                                value={profileInfo.full_name}
                                onChange={(e) => setProfileInfo({...profileInfo, full_name: e.target.value})}
                                className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-3xl focus:bg-white focus:border-[#4F27E9] focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm transition-all text-[#111834]"
                                placeholder="Your full name"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email Terminal</label>
                            <div className="relative">
                                <input 
                                    type="email" 
                                    value={profileInfo.email}
                                    disabled
                                    className="w-full px-6 py-4 bg-gray-100/50 border border-gray-100 rounded-3xl cursor-not-allowed text-gray-400 font-bold text-sm"
                                />
                                <Lock size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Mobile Contact</label>
                            <input 
                                type="text" 
                                value={profileInfo.phone}
                                onChange={(e) => setProfileInfo({...profileInfo, phone: e.target.value})}
                                className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-3xl focus:bg-white focus:border-[#4F27E9] focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm transition-all text-[#111834]"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Division</label>
                            <input 
                                type="text" 
                                value={profileInfo.department}
                                onChange={(e) => setProfileInfo({...profileInfo, department: e.target.value})}
                                className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-3xl focus:bg-white focus:border-[#4F27E9] focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm transition-all text-[#111834]"
                                placeholder="e.g. Design, Engineering"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Professional Abstract</label>
                            <textarea 
                                value={profileInfo.bio}
                                onChange={(e) => setProfileInfo({...profileInfo, bio: e.target.value})}
                                rows="3"
                                className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[32px] focus:bg-white focus:border-[#4F27E9] focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm transition-all text-[#111834] resize-none"
                                placeholder="A brief description of your role..."
                            />
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="px-10 py-10 bg-gray-50/30 border-t border-gray-50">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                            <Shield size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-lg font-black tracking-tight">Security Protocol</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update your access credentials</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">New Password</label>
                            <input 
                                type="password" 
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                className="w-full px-6 py-4 bg-white border border-gray-200 rounded-3xl focus:border-[#4F27E9] focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm transition-all"
                                placeholder="••••••••••••"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Verify Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                    className="w-full px-6 py-4 bg-white border border-gray-200 rounded-3xl focus:border-[#4F27E9] focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm transition-all"
                                    placeholder="••••••••••••"
                                />
                            </div>
                            <button 
                                onClick={handleUpdatePassword} 
                                disabled={loading || !passwords.newPassword}
                                className="h-14 px-8 bg-[#111834] text-white rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                Secure
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Rules Section */}
            {profile?.role === 'ADMIN' && (
                <div className="bg-[#111834] rounded-[48px] p-1 shadow-3xl">
                    <div className="bg-white/5 backdrop-blur-3xl rounded-[46px] overflow-hidden">
                        <div className="px-10 py-8 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 text-white">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-sm border border-indigo-500/20">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">Governance Rules</h2>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Global workspace constraints</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleSaveRules} 
                                disabled={loading} 
                                className="bg-white text-[#111834] hover:bg-indigo-50 h-12 px-8 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Save size={16} />
                                Implement
                            </button>
                        </div>
                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock size={14} className="text-indigo-400" /> Max Duration
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        value={rules.max_duration}
                                        onChange={(e) => setRules({...rules, max_duration: parseInt(e.target.value)})}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none text-white font-bold focus:border-indigo-500 transition-all"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 text-[10px] font-black uppercase tracking-widest">MINS</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Calendar size={14} className="text-indigo-400" /> Booking Horizon
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        value={rules.advance_booking_days}
                                        onChange={(e) => setRules({...rules, advance_booking_days: parseInt(e.target.value)})}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none text-white font-bold focus:border-indigo-500 transition-all"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 text-[10px] font-black uppercase tracking-widest">DAYS</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock size={14} className="text-indigo-400" /> Cooldown Buffer
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        value={rules.buffer_time}
                                        onChange={(e) => setRules({...rules, buffer_time: parseInt(e.target.value)})}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none text-white font-bold focus:border-indigo-500 transition-all"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 text-[10px] font-black uppercase tracking-widest">MINS</span>
                                </div>
                            </div>
                            <div className="lg:col-span-3 flex items-center gap-4 bg-white/5 p-6 rounded-[32px] border border-white/10 cursor-pointer hover:bg-white/10 transition-all relative overflow-hidden group">
                                <div className="relative z-10 flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-sm">Automated Approval Protocol</h4>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">If off, all bookings will be self-confirmed</p>
                                    </div>
                                    <div 
                                        onClick={() => setRules({...rules, require_approval: !rules.require_approval})}
                                        className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${rules.require_approval ? 'bg-indigo-500' : 'bg-white/10'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full bg-white shadow-xl transition-all duration-300 transform ${rules.require_approval ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
