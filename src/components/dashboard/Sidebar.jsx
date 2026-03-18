import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/pucho_logo_login.png';

// Custom Icon Imports
import HomeIcon from '../../assets/icons/Property 2=Grid, Property 1=Default.png';
import AgentsIcon from '../../assets/icons/agents.svg';
import ChatIcon from '../../assets/icons/chat.svg';
import FlowsIcon from '../../assets/icons/flows.svg';
import ActivityIcon from '../../assets/icons/activity.svg';
import McpIcon from '../../assets/icons/mcp.svg';
import KnowledgeIcon from '../../assets/icons/knowledge.svg';
import ToolsIcon from '../../assets/icons/tools.svg';
import MarketplaceIcon from '../../assets/icons/marketplace.svg';
import LogoutIcon from '../../assets/icons/logout.svg';
import BellIcon from '../../assets/icons/search.svg';

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userEmail = user?.email || 'admin@pucho.ai';
    const userName = user?.full_name || 'Admin User';

    // Menu items configuration
    const menuItems = [
        { name: 'Dashboard', icon: HomeIcon, path: '/admin' },
        { name: 'Bookings', icon: FlowsIcon, path: '/admin/bookings' },
        { name: 'Rooms', icon: AgentsIcon, path: '/admin/rooms', adminOnly: true },
        { name: 'Users', icon: ChatIcon, path: '/admin/users', adminOnly: true },
        { name: 'Notifications', icon: BellIcon, path: '/admin/notifications' },
    ];

    const filteredMenuItems = menuItems.filter(item => !item.adminOnly || (user && user.role === 'ADMIN'));

    return (
        <aside className="w-[240px] h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-30 shadow-sm">
            {/* Logo Section - Height matches Header for alignment */}
            <div className="px-6 h-[76px] flex items-center border-b border-gray-100/50">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Conference Room Booking" className="h-[34px] w-auto" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {filteredMenuItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-[10px] px-[12px] h-[40px] rounded-[22px] text-[14px] font-medium transition-all duration-200 border
                            ${isActive
                                ? 'bg-[rgba(79,39,233,0.08)] border-[rgba(79,39,233,0.15)] text-[#4F27E9] font-semibold'
                                : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-100 hover:text-gray-900'
                            }
                        `}
                    >
                        {/* Render Icon Image */}
                        <img
                            src={item.icon}
                            alt={item.name}
                            className={`w-5 h-5 object-contain transition-all`}
                            style={{ opacity: 0.7 }}
                        />
                        <span className="truncate">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User Profile (Bottom) */}
            <div className="p-4 border-t border-gray-100 space-y-2">

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-3xl text-[14px] font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                    <img
                        src={LogoutIcon}
                        alt="Logout"
                        className="w-5 h-5 object-contain opacity-80"
                    />
                    <span className="truncate">Log out</span>
                </button>

                <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
                        alt="User"
                        className="w-8 h-8 rounded-full bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
