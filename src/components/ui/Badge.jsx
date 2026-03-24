import React from 'react';

const Badge = ({ children, status, className = "" }) => {
    const getStatusStyles = () => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'active':
                return 'bg-green-50 text-green-600 border-green-100';
            case 'cancelled':
            case 'inactive':
                return 'bg-red-50 text-red-600 border-red-100';
            case 'completed':
                return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'pending':
                return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${getStatusStyles()} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
