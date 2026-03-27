import React from 'react';
import FlowIcon from '../../assets/icons/card_flow.png';

const Card = ({ title, description, active, onClick, listView, icon: Icon }) => {
    return (
        <div
            onClick={onClick}
            className={`
                group p-6 flex rounded-[32px] cursor-pointer transition-all duration-500 ease-out border
                ${active
                    ? 'bg-[#4F27E9] border-transparent shadow-xl shadow-indigo-100 -translate-y-1'
                    : 'bg-white border-gray-100 shadow-premium hover:shadow-premium-hover active:scale-[0.98]'
                }
                ${listView
                    ? 'w-full flex-row items-center gap-6 h-auto'
                    : 'w-full flex-col gap-5 h-full min-h-[180px]'
                }
            `}
        >
            {/* Icon Container */}
            <div className={`
                w-14 h-14 rounded-2xl flex items-center justify-center flex-none transition-all duration-500
                ${active 
                    ? 'bg-white/20 text-white rotate-6' 
                    : 'bg-indigo-50 text-[#4F27E9] group-hover:bg-[#4F27E9] group-hover:text-white group-hover:-rotate-6 shadow-sm'
                }
            `}>
                {Icon ? <Icon size={24} /> : <img src={FlowIcon} alt="Icon" className={`w-6 h-6 object-contain ${active ? 'brightness-0 invert' : ''}`} />}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2 flex-1">
                <h3 className={`
                    font-black text-[18px] leading-tight tracking-tight transition-colors duration-300
                    ${active ? 'text-white' : 'text-gray-900'}
                `}>
                    {title}
                </h3>
                <p className={`
                    font-medium text-[13px] leading-relaxed transition-colors duration-300 line-clamp-2
                    ${active ? 'text-white/70' : 'text-gray-500'}
                `}>
                    {description}
                </p>
            </div>
            
            {/* Hover Decorator */}
            {!active && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#4F27E9] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            )}
        </div>
    );
};

export default Card;
