import React, { useState } from 'react';
import Card from '../components/dashboard/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import FlowIcon from '../assets/icons/card_flow.png';
import { LayoutGrid, List } from 'lucide-react'; // Import icons

const CardsGrid = () => {
    // Generate 10 cards with unique numbering (1-10)
    const cards = Array.from({ length: 10 }, (_, i) => ({
        title: `Conversation Flow Agent ${i + 1} `,
        description: "For rigid, highly formatted conversations"
    }));

    const [selectedCard, setSelectedCard] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    return (
        <div className="">
            {/* View Toggle (Grid / List) - Floating at top right */}
            <div className="flex justify-end mb-6">
                <div className="flex items-center gap-[6px]">
                    {/* Grid Button */}
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`
                            flex items-center justify-center w-[44px] h-[36px] rounded-full transition-all duration-200
                            ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-transparent text-gray-400 hover:text-black'}
                        `}
                    >
                        <LayoutGrid size={20} className={`transition-all ${viewMode === 'grid' ? 'stroke-white' : 'stroke-current opacity-60'}`} strokeWidth={viewMode === 'grid' ? 2 : 1.5} />
                    </button>

                    {/* List Button */}
                    <button
                        onClick={() => setViewMode('list')}
                        className={`
                            flex items-center justify-center w-[44px] h-[36px] rounded-full transition-all duration-200
                            ${viewMode === 'list' ? 'bg-black text-white' : 'bg-transparent text-gray-400 hover:text-black'}
                        `}
                    >
                        <List size={24} className={`transition-all ${viewMode === 'list' ? 'stroke-white' : 'stroke-current opacity-60'}`} strokeWidth={viewMode === 'list' ? 2 : 1.5} />
                    </button>
                </div>
            </div>

            {/* Content Grid/List */}
            <div className={`
                ${viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'flex flex-col gap-4'
                }
            `}>
                {cards.map((card, index) => (
                    <Card
                        key={index}
                        title={card.title}
                        description={card.description}
                        active={selectedCard?.index === index}
                        onClick={() => setSelectedCard({ ...card, index })}
                        listView={viewMode === 'list'}
                    />
                ))}
            </div>

            {/* Mini Window Modal */}
            <Modal
                isOpen={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                title={selectedCard?.title}
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-pucho-blue/20 flex items-center justify-center flex-none text-pucho-blue">
                            <img src={FlowIcon} alt="Icon" className="w-5 h-5 object-contain opacity-100" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Agent Details</p>
                            <p className="text-xs text-gray-500">Active and running</p>
                        </div>
                    </div>
                    <p className="text-[15px] leading-relaxed">
                        {selectedCard?.description}. This agent is configured to handle structured data inputs and guide users through specific predefined workflows.
                    </p>

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setSelectedCard(null)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <Button onClick={() => console.log("Action")}> {/* Updated Button */}
                            Open Agent
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CardsGrid;
