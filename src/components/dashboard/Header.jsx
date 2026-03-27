import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SearchIcon from '../../assets/icons/search.svg';
import BellIcon from '../../assets/icons/bell.png';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const Header = ({ onMenuClick }) => {
    const { user } = useAuth();
    const { notifications, searchQuery, setSearchQuery } = useData();
    const [isFocused, setIsFocused] = useState(false);
    
    // Derived state for performance and real-time accuracy
    const notifCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="sticky top-0 z-30 w-full h-20 bg-white/60 backdrop-blur-2xl border-b border-white/40 flex items-center justify-between px-8 transition-all">
            {/* Search (Left) */}
            <div className="flex items-center flex-1 max-w-lg">
                <div
                    className={`
                        group flex items-center gap-3 bg-gray-50/50 rounded-2xl border transition-all duration-300 w-full overflow-hidden
                        ${isFocused 
                            ? 'h-12 border-[#4F27E9] bg-white shadow-lg shadow-indigo-50 ring-4 ring-indigo-50/50' 
                            : 'h-12 border-gray-100/50 hover:border-indigo-100 hover:bg-white hover:shadow-sm'
                        }
                    `}
                >
                    <div className="flex items-center justify-center w-10 h-10 ml-1 rounded-xl group-hover:bg-indigo-50 transition-colors">
                        <img src={SearchIcon} alt="Search" className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for meetings, rooms, or members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-[#111834] placeholder:text-gray-400 text-sm font-bold font-['Outfit']"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="p-2 mr-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center gap-6">
                {/* Notification Cluster */}
                <Link 
                    to={user?.role?.toUpperCase() === 'ADMIN' ? "/admin/notifications" : "/user/notifications"} 
                    className="relative w-12 h-12 flex items-center justify-center bg-gray-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-gray-100 hover:shadow-sm transition-all group"
                >
                    <img src={BellIcon} alt="Notifications" className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    {notifCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-[#4F27E9] text-white text-[10px] flex items-center justify-center rounded-full font-black px-1.5 border-2 border-white shadow-sm animate-bounce">
                            {notifCount > 9 ? '9+' : notifCount}
                        </span>
                    )}
                </Link>

                <div className="h-8 w-[1.5px] bg-gray-100 rounded-full"></div>
                
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-[13px] font-black text-[#111834] leading-none mb-0.5">{user?.full_name || 'Member'}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.role || 'User'}</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shadow-sm">
                        <img 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || 'Member'}`} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-xl"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
