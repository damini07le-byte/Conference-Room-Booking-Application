import React from 'react';

const Badge = ({ children, status }) => {
    const getStatusStyles = () => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'active':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'cancelled':
            case 'inactive':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'completed':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'pending':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
            {children}
        </span>
    );
};

export default Badge;
