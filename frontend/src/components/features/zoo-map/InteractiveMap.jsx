import { useState, useRef, useEffect } from 'react';

const ZoneIcon = ({ color }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={color} className="w-6 h-6">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
);

const InteractiveMap = () => {
    const [selectedZone, setSelectedZone] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [focusedZoneIndex, setFocusedZoneIndex] = useState(-1);
    const mapRef = useRef(null);

    const zones = [
        { id: 1, name: 'Savanna Zone', animals: ['Lions', 'Giraffes', 'Zebras'], color: '#F59E0B', x: 20, y: 30, icon: 'savanna' },
        { id: 2, name: 'Tropical Forest', animals: ['Tigers', 'Monkeys', 'Birds'], color: '#10B981', x: 60, y: 20, icon: 'tropical' },
        { id: 3, name: 'Aquatic Area', animals: ['Penguins', 'Dolphins', 'Seals'], color: '#3B82F6', x: 70, y: 60, icon: 'aquatic' },
        { id: 4, name: 'Asian Sanctuary', animals: ['Elephants', 'Pandas', 'Red Pandas'], color: '#8B5CF6', x: 30, y: 70, icon: 'asian' },
        { id: 5, name: 'Reptile House', animals: ['Crocodiles', 'Snakes', 'Lizards'], color: '#EF4444', x: 50, y: 50, icon: 'reptile' }
    ];

    const facilities = [
        { id: 'entrance', name: 'Main Entrance', x: 10, y: 50, icon: 'entrance' },
        { id: 'food1', name: 'Food Court', x: 40, y: 40, icon: 'food' },
        { id: 'restroom1', name: 'Restrooms', x: 55, y: 35, icon: 'restroom' },
        { id: 'gift', name: 'Gift Shop', x: 85, y: 50, icon: 'gift' },
        { id: 'info', name: 'Information', x: 15, y: 45, icon: 'info' }
    ];

    // Keyboard navigation for zones
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedZoneIndex(prev => (prev + 1) % zones.length);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedZoneIndex(prev => (prev - 1 + zones.length) % zones.length);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (focusedZoneIndex >= 0) {
                setSelectedZone(zones[focusedZoneIndex]);
            }
        } else if (e.key === 'Escape') {
            setSelectedZone(null);
            setFocusedZoneIndex(-1);
        }
    };

    const handleZoneClick = (zone) => {
        setSelectedZone(zone);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.2, 2));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.2, 0.5));
    };

    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setSelectedZone(null);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-[#2D5A27] to-[#3A8C7D] p-4 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Zoo Interactive Map</h2>
                        <p className="text-sm opacity-90">Tap on zones to explore</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleZoomOut}
                            aria-label="Zoom out map"
                            className="w-10 h-10 md:w-8 md:h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition touch-target text-lg"
                        >
                            −
                        </button>
                        <button 
                            onClick={handleZoomIn}
                            aria-label="Zoom in map"
                            className="w-10 h-10 md:w-8 md:h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition touch-target text-lg"
                        >
                            +
                        </button>
                        <button 
                            onClick={handleReset}
                            aria-label="Reset map view"
                            className="w-10 h-10 md:w-8 md:h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition touch-target"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                <path d="M3 3v5h5"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div 
                    ref={mapRef}
                    className="relative aspect-[4/3] bg-gradient-to-br from-green-100 to-teal-50 overflow-hidden cursor-grab active:cursor-grabbing"
                    style={{ transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)` }}
                    role="application"
                    aria-label="Interactive zoo map. Use arrow keys to navigate between zones, Enter to select."
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                >
                    <svg className="absolute inset-0 w-full h-full opacity-20" role="img" aria-hidden="true">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#059669" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>

                    {zones.map((zone, index) => (
                        <button
                            key={zone.id}
                            onClick={() => handleZoneClick(zone)}
                            onFocus={() => setFocusedZoneIndex(index)}
                            aria-label={`${zone.name}. Animals: ${zone.animals.join(', ')}`}
                            aria-pressed={selectedZone?.id === zone.id}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 touch-target ${
                                selectedZone?.id === zone.id || focusedZoneIndex === index ? 'scale-125 z-10 ring-4 ring-white ring-offset-2' : 'hover:scale-110'
                            }`}
                            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                        >
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white"
                                style={{ backgroundColor: zone.color }}
                            >
                                <ZoneIcon color="white" />
                            </div>
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                <span className="text-xs font-medium bg-white px-2 py-1 rounded-full shadow-sm text-gray-700">
                                    {zone.name}
                                </span>
                            </div>
                        </button>
                    ))}

                    {facilities.map(facility => (
                        <div
                            key={facility.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${facility.x}%`, top: `${facility.y}%` }}
                            title={facility.name}
                        >
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-sm font-bold border border-gray-200 text-gray-600">
                                {facility.name.charAt(0)}
                            </div>
                        </div>
                    ))}

                    <div className="absolute bottom-4 left-4 bg-white rounded-xl p-3 shadow-lg text-xs">
                        <div className="font-bold text-gray-700 mb-2">Legend</div>
                        <div className="space-y-1">
                            {zones.slice(0, 3).map(zone => (
                                <div key={zone.id} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: zone.color }} />
                                    <span className="text-gray-600">{zone.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {selectedZone && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-4">
                            <div 
                                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: selectedZone.color }}
                            >
                                <ZoneIcon color="white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800">{selectedZone.name}</h3>
                                <p className="text-sm text-gray-500">
                                    Animals: {selectedZone.animals.join(', ')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedZone(null)}
                                className="text-gray-400 hover:text-gray-600 touch-target p-2"
                                aria-label="Close zone details"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InteractiveMap;
