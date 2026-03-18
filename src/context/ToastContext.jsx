import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onRemove }) => {
    const icons = {
        success: <CheckCircle className="text-green-500" size={18} />,
        error: <XCircle className="text-red-500" size={18} />,
        warning: <AlertCircle className="text-amber-500" size={18} />,
        info: <Info className="text-blue-500" size={18} />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-100',
        error: 'bg-red-50 border-red-100',
        warning: 'bg-amber-50 border-amber-100',
        info: 'bg-blue-50 border-blue-100'
    };

    return (
        <div className={`
            flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl
            animate-in slide-in-from-right-full fade-in duration-300
            min-w-[300px] max-w-md ${bgColors[toast.type]}
        `}>
            {icons[toast.type]}
            <p className="flex-1 text-sm font-semibold text-gray-800">{toast.message}</p>
            <button onClick={onRemove} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
                <X size={14} className="text-gray-400" />
            </button>
        </div>
    );
};
