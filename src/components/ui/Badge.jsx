import React from 'react';

const Badge = ({ children, status, variant = "default", className = "" }) => {
    const getStatusStyles = () => {
        const lowerStatus = status?.toLowerCase();
        
        if (lowerStatus === 'confirmed' || lowerStatus === 'active') {
            return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        }
        if (lowerStatus === 'cancelled' || lowerStatus === 'inactive' || lowerStatus === 'declined') {
            return 'bg-rose-50 text-rose-600 border-rose-100';
        }
        if (lowerStatus === 'completed' || lowerStatus === 'finished') {
            return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        }
        if (lowerStatus === 'pending' || lowerStatus === 'processing') {
            return 'bg-amber-50 text-amber-600 border-amber-100';
        }
        
        switch (variant) {
            case 'outline': return 'bg-transparent border-gray-200 text-gray-400';
            case 'solid': return 'bg-[#4F27E9] text-white border-transparent';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusStyles()} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
