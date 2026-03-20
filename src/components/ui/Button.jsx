import React from 'react';

const Button = ({ children, onClick, className = '', disabled = false, icon: Icon }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                relative h-[44px] px-5 flex items-center justify-center gap-2 rounded-[100px]
                transition-all duration-200 ease-in-out
                font-['Inter'] font-medium text-[16px] leading-[150%]
                overflow-hidden
                group
                bg-[#4F27E9] text-white
                disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed
                hover:bg-[#3D1DB3]
                ${className}
            `}
            style={{
                boxShadow: disabled ? 'none' : '0px 4.4px 8.8px rgba(79, 39, 233, 0.3)',
            }}
        >
            {/* Highlight/Gloss Effect - Top Half */}
            <div
                className={`absolute top-[1px] left-[1px] right-[1px] h-[23px] rounded-[100px] pointer-events-none group-active:hidden group-disabled:hidden`}
                style={{
                    background: 'linear-gradient(175.37deg, rgba(255,255,255,0.3) -10.54%, rgba(255, 255, 255, 0) 74.6%)',
                    opacity: 0.7,
                    zIndex: 2,
                }}
            />

            {/* Hover State Background Change */}
            <div className="absolute inset-0 bg-[#2D2D2D] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-0" />

            {/* Pressed State Background Change */}
            <div className="absolute inset-0 bg-black opacity-0 group-active:opacity-100 transition-opacity duration-0 pointer-events-none z-0" />

            {/* Icon (Left) */}
            {Icon && (
                <div
                    className="relative z-10 flex items-center justify-center w-6 h-6"
                    style={{ filter: "drop-shadow(0px 1.15789px 1.27368px rgba(0, 0, 0, 0.4))" }}
                >
                    <Icon className="w-3.5 h-3.5" />
                </div>
            )}

            {/* Content (Text) */}
            <span
                className="relative z-10 flex items-center"
                style={{ textShadow: "0px 1.15789px 1.27368px rgba(0, 0, 0, 0.4)" }}
            >
                {children}
            </span>
        </button>
    );
};

export default Button;
