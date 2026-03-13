import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';

const animalHabitats = [
    { id: 1, name: 'African Lion', species: 'Panthera leo', habitat: 'Sub-Saharan Africa', region: 'Africa', coordinates: [-1.2921, 36.8219], icon: '🦁', image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=1000', description: 'The king of the savannah, living in social prides. They are apex predators essential for maintaining the balance of herbivore populations.', category: 'Mammals' },
    { id: 2, name: 'African Elephant', species: 'Loxodonta africana', habitat: 'Central & Southern Africa', region: 'Africa', coordinates: [-15.4167, 28.2833], icon: '🐘', image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=1000', description: 'The largest land animal on Earth. They are "ecosystem engineers," creating paths and water holes used by other species.', category: 'Mammals' },
    { id: 3, name: 'Bengal Tiger', species: 'Panthera tigris tigris', habitat: 'Indian Subcontinent', region: 'Asia', coordinates: [22.5726, 88.3639], icon: '🐅', image: 'https://images.unsplash.com/photo-1500642805046-e56455171932?auto=format&fit=crop&q=80&w=1000', description: 'A solitary and powerful hunter found in the mangrove forests of the Sundarbans and various Indian national parks.', category: 'Mammals' },
    { id: 4, name: 'Giant Panda', species: 'Ailuropoda melanoleuca', habitat: 'South Central China', region: 'Asia', coordinates: [30.6171, 103.8203], icon: '🐼', image: 'https://images.unsplash.com/photo-1564349683136-77e08bef1ed1?auto=format&fit=crop&q=80&w=1000', description: 'An evolutionary unique bear that subsists almost entirely on bamboo. They are a global symbol of wildlife conservation.', category: 'Mammals' },
    { id: 5, name: 'Red Kangaroo', species: 'Macropus rufus', habitat: 'Central Australia', region: 'Australia & Oceania', coordinates: [-25.2744, 133.7751], icon: '🦘', image: 'https://images.unsplash.com/photo-1591010323317-0f622616467a?auto=format&fit=crop&q=80&w=1000', description: 'The world\'s largest marsupial. They are built for energy-efficient travel across the vast, arid Australian Outback.', category: 'Mammals' },
    { id: 6, name: 'Jaguar', species: 'Panthera onca', habitat: 'Amazon Basin', region: 'The Americas', coordinates: [-3.4653, -62.2159], icon: '🐆', image: 'https://images.unsplash.com/photo-1543967625-f15da8009930?auto=format&fit=crop&q=80&w=1000', description: 'The strongest feline bite force in the world, allowing them to pierce the shells of turtles and caimans.', category: 'Mammals' },
    { id: 7, name: 'Polar Bear', species: 'Ursus maritimus', habitat: 'Arctic Circle', region: 'Polar Regions', coordinates: [78.2232, 15.6267], icon: '🐻‍❄️', image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&q=80&w=1000', description: 'A marine mammal that depends on sea ice for hunting seals. They are highly vulnerable to rising global temperatures.', category: 'Mammals' },
    { id: 8, name: 'Emperor Penguin', species: 'Aptenodytes forsteri', habitat: 'Antarctica', region: 'Polar Regions', coordinates: [-75.2509, -0.0713], icon: '🐧', image: 'https://images.unsplash.com/photo-1517783999520-f068d7431a60?auto=format&fit=crop&q=80&w=1000', description: 'The tallest and heaviest of all living penguin species, they endure the harshest winters on the planet to breed.', category: 'Birds' },
    { id: 9, name: 'Bald Eagle', species: 'Haliaeetus leucocephalus', habitat: 'North America', region: 'The Americas', coordinates: [45.0, -110.0], icon: '🦅', image: 'https://images.unsplash.com/photo-1501701314321-4d7a86161491?auto=format&fit=crop&q=80&w=1000', description: 'A majestic bird of prey and a symbol of freedom. They are found near large bodies of open water with an abundance of fish.', category: 'Birds' },
    { id: 10, name: 'Koala', species: 'Phascolarctos cinereus', habitat: 'Eastern Australia', region: 'Australia & Oceania', coordinates: [-33.8688, 151.2093], icon: '🐨', image: 'https://images.unsplash.com/photo-1542617933-72439110f065?auto=format&fit=crop&q=80&w=1000', description: 'An arboreal herbivorous marsupial. They sleep up to 20 hours a day to conserve energy from their low-calorie eucalyptus diet.', category: 'Mammals' },
    { id: 11, name: 'Komodo Dragon', species: 'Varanus komodoensis', habitat: 'Indonesian Islands', region: 'Asia', coordinates: [-8.4901, 119.4619], icon: '🦎', image: 'https://images.unsplash.com/photo-1545281358-132039785501?auto=format&fit=crop&q=80&w=1000', description: 'The largest extant species of lizard. They use a combination of powerful bites and venom to take down large prey like deer.', category: 'Reptiles' },
    { id: 12, name: 'American Bison', species: 'Bison bison', habitat: 'Great Plains', region: 'The Americas', coordinates: [44.4280, -110.5885], icon: '🦬', image: 'https://images.unsplash.com/photo-1533202996923-bb5b2909403d?auto=format&fit=crop&q=80&w=1000', description: 'A keystone species of the American prairies. Once nearly extinct, conservation efforts have restored their numbers significantly.', category: 'Mammals' },
    { id: 13, name: 'Snow Leopard', species: 'Panthera uncia', habitat: 'Himalayas', region: 'Asia', coordinates: [35.8617, 76.5133], icon: '🐆', image: 'https://images.unsplash.com/photo-1610484826967-09c5720778c7?auto=format&fit=crop&q=80&w=1000', description: 'Known as the "Ghost of the Mountains," these elusive cats are perfectly adapted to the cold, rugged terrain of Central Asia.', category: 'Mammals' },
    { id: 14, name: 'Meerkat', species: 'Suricata suricatta', habitat: 'Kalahari Desert', region: 'Africa', coordinates: [-26.1551, 22.0226], icon: '🦦', image: 'https://images.unsplash.com/photo-1594145070006-25916f1a4157?auto=format&fit=crop&q=80&w=1000', description: 'Small mongooses known for their upright standing posture and highly social family groups called mobs or gangs.', category: 'Mammals' },
    { id: 15, name: 'Great White Shark', species: 'Carcharodon carcharias', habitat: 'Coastal Waters', region: 'Australia & Oceania', coordinates: [-34.6191, 19.3518], icon: '🦈', image: 'https://images.unsplash.com/photo-1560273074-c93173ec71dd?auto=format&fit=crop&q=80&w=1000', description: 'A massive predatory fish found in coastal surface waters of all major oceans. They play a vital role in marine ecosystems.', category: 'Fish' },
    { id: 16, name: 'Platypus', species: 'Ornithorhynchus anatinus', habitat: 'Eastern Australia Rivers', region: 'Australia & Oceania', coordinates: [-37.8136, 144.9631], icon: '🦆', image: 'https://images.unsplash.com/photo-1621255556209-66e8550f443a?auto=format&fit=crop&q=80&w=1000', description: 'One of the few mammals that lay eggs. They use electrolocation to find prey in murky river bottoms.', category: 'Mammals' },
    { id: 17, name: 'Galápagos Tortoise', species: 'Chelonoidis niger', habitat: 'Galápagos Islands', region: 'The Americas', coordinates: [-0.6394, -90.3518], icon: '🐢', image: 'https://images.unsplash.com/photo-1548141024-343038304958?auto=format&fit=crop&q=80&w=1000', description: 'Giant tortoises that can live for over 100 years. Their shells vary in shape based on the specific island environment.', category: 'Reptiles' },
    { id: 18, name: 'Iberian Lynx', species: 'Lynx pardinus', habitat: 'Southwestern Spain', region: 'The Americas', coordinates: [37.1704, -6.9298], icon: '🐱', image: 'https://images.unsplash.com/photo-1516139008210-96e45d0dd332?auto=format&fit=crop&q=80&w=1000', description: 'The world\'s most endangered feline species, native to the Iberian Peninsula. Intensive conservation is saving them from extinction.', category: 'Mammals' },
    { id: 19, name: 'Orangutan', species: 'Pongo pygmaeus', habitat: 'Borneo Rainforest', region: 'Asia', coordinates: [1.3521, 110.1903], icon: '🦧', image: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&q=80&w=1000', description: 'Highly intelligent great apes that share 97% of their DNA with humans. They are the world\'s largest arboreal mammals.', category: 'Mammals' },
    { id: 20, name: 'Blue Whale', species: 'Balaenoptera musculus', habitat: 'Open Oceans', region: 'Polar Regions', coordinates: [0.0, -30.0], icon: '🐋', image: 'https://images.unsplash.com/photo-1601618386442-a727d2c3df31?auto=format&fit=crop&q=80&w=1000', description: 'The largest animal to have ever lived. Their heart is the size of a bumper car, and their tongue weighs as much as an elephant.', category: 'Mammals' }
];

const regionColors = {
    'Africa': '#0D9488',
    'Asia': '#059669',
    'Australia & Oceania': '#0891B2',
    'The Americas': '#10B981',
    'Polar Regions': '#0284C7'
};

const DiscoveryList = memo(({ isMobile, filterRegion, setFilterRegion, selectedAnimal, onSelect, onClose }) => (
    <div className={`flex flex-col h-full bg-white ${!isMobile && 'border-l border-teal-100 shadow-2xl'}`}>
        <div className="p-6 md:p-8 border-b border-teal-50 bg-teal-50/30">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-teal-900">Fauna Discovery</h1>
                {isMobile && (
                    <button onClick={onClose} className="p-2 text-teal-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {['All', ...Object.keys(regionColors)].map(region => (
                    <button
                        key={region}
                        onClick={() => setFilterRegion(region)}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${filterRegion === region ? 'bg-teal-700 text-white border-teal-700 shadow-md' : 'bg-white text-teal-600 border-teal-200 hover:border-teal-400'}`}
                    >
                        {region}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
            {animalHabitats.filter(a => filterRegion === 'All' || a.region === filterRegion).map(animal => (
                <div
                    key={animal.id}
                    onClick={() => onSelect(animal)}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer ${selectedAnimal?.id === animal.id ? 'bg-teal-800 text-white shadow-lg scale-[1.02]' : 'hover:bg-teal-50 hover:translate-x-1'}`}
                >
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl flex-shrink-0">
                        {animal.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{animal.name}</h4>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedAnimal?.id === animal.id ? 'text-teal-200' : 'text-teal-500'}`}>{animal.region}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
));

const MapPage = () => {
    const navigate = useNavigate();
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [filterRegion, setFilterRegion] = useState('All');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isMobileListOpen, setIsMobileListOpen] = useState(false);

    useEffect(() => {
        let lenisRafId = null;
        
        const loadLenis = () => {
            if (window.Lenis) return;
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@studio-freight/lenis@1.0.33/dist/lenis.min.js';
            script.onload = () => {
                const lenis = new window.Lenis({ lerp: 0.1, duration: 1.2 });
                const raf = (time) => { 
                    lenis.raf(time); 
                    lenisRafId = requestAnimationFrame(raf); 
                };
                lenisRafId = requestAnimationFrame(raf);
            };
            document.head.appendChild(script);
        };

        const loadLeaflet = () => {
            if (window.L) { initializeMap(); return; }
            const link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.onload = initializeMap;
            document.body.appendChild(script);
        };

        loadLenis();
        loadLeaflet();
        return () => { 
            if (lenisRafId) cancelAnimationFrame(lenisRafId);
            if (mapRef.current) mapRef.current.remove(); 
        };
    }, []);

    const initializeMap = () => {
        if (mapRef.current || !mapContainerRef.current) return;
        const L = window.L;
        const map = L.map(mapContainerRef.current, {
            center: [20, 0], zoom: 3, minZoom: 2, zoomControl: false, attributionControl: false
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
        mapRef.current = map;
        setIsMapReady(true);
    };

    const handleSelect = useCallback((animal) => {
        setSelectedAnimal(animal);
        setIsMobileListOpen(false);
        if (mapRef.current) mapRef.current.flyTo(animal.coordinates, 5, { duration: 1.5 });
    }, []);

    useEffect(() => {
        if (!isMapReady || !window.L) return;
        const L = window.L;
        markersRef.current.forEach(m => mapRef.current.removeLayer(m));
        markersRef.current = [];

        const filtered = filterRegion === 'All' ? animalHabitats : animalHabitats.filter(a => a.region === filterRegion);

        filtered.forEach(animal => {
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-14 h-14 md:w-16 md:h-16 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-3xl md:text-4xl transform hover:scale-110 active:scale-90 transition-all duration-300" style="background: ${regionColors[animal.region]}">${animal.icon}</div>`,
                iconSize: [64, 64], iconAnchor: [32, 32]
            });
            const marker = L.marker(animal.coordinates, { icon }).addTo(mapRef.current);
            marker.on('click', () => handleSelect(animal));
            markersRef.current.push(marker);
        });
        mapRef.current.invalidateSize();
    }, [filterRegion, isMapReady, handleSelect]);

    return (
        <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-teal-50 overflow-hidden text-teal-950 antialiased">
            <style>{`
                .leaflet-container { background: #f0fdfa !important; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="flex-1 relative h-full">
                <div className="absolute top-4 md:top-6 left-4 md:left-6 z-[1000] flex gap-2">
                    <button onClick={() => setShowExitConfirm(true)} className="h-12 w-12 md:h-14 md:w-14 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-teal-50 transition-all border border-teal-100">
                        <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <button onClick={() => setIsMobileListOpen(true)} className="md:hidden h-12 w-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-teal-100">
                        <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                    </button>
                </div>
                <div ref={mapContainerRef} className="h-full w-full" />
            </div>

            <aside className="hidden md:block w-80 lg:w-96 h-full z-[1001]">
                <DiscoveryList filterRegion={filterRegion} setFilterRegion={setFilterRegion} selectedAnimal={selectedAnimal} onSelect={handleSelect} />
            </aside>

            {isMobileListOpen && (
                <div className="fixed inset-0 z-[2000] md:hidden">
                    <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={() => setIsMobileListOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 h-[80dvh] rounded-t-[2.5rem] overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <DiscoveryList isMobile={true} filterRegion={filterRegion} setFilterRegion={setFilterRegion} selectedAnimal={selectedAnimal} onSelect={handleSelect} onClose={() => setIsMobileListOpen(false)} />
                    </div>
                </div>
            )}

            {selectedAnimal && (
                <div className="fixed inset-0 z-[2001] flex items-center justify-center p-0 md:p-8">
                    <div className="absolute inset-0 bg-teal-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedAnimal(null)} />
                    <div className="relative w-full h-full md:h-auto md:max-w-4xl bg-white md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                        <div className="w-full md:w-1/2 h-[45dvh] md:h-auto relative">
                            <img src={selectedAnimal.image} alt={selectedAnimal.name} className="w-full h-full object-cover" />
                            <button onClick={() => setSelectedAnimal(null)} className="absolute top-6 right-6 w-12 h-12 bg-black/30 backdrop-blur-xl rounded-full text-white flex items-center justify-center border border-white/20">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 p-8 md:p-12 overflow-y-auto hide-scrollbar">
                            <span className="px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-white mb-6 inline-block shadow-md" style={{ background: regionColors[selectedAnimal.region] }}>{selectedAnimal.region}</span>
                            <h2 className="text-4xl md:text-5xl font-black text-teal-900 mb-1 leading-tight">{selectedAnimal.name}</h2>
                            <p className="text-xl italic text-teal-500 mb-8 font-medium">{selectedAnimal.species}</p>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-5 bg-teal-50 rounded-2xl border border-teal-100/30">
                                    <p className="text-[9px] uppercase font-black text-teal-400 mb-1">Native Zone</p>
                                    <p className="font-bold text-teal-800 text-sm">{selectedAnimal.habitat}</p>
                                </div>
                                <div className="p-5 bg-teal-50 rounded-2xl border border-teal-100/30">
                                    <p className="text-[9px] uppercase font-black text-teal-400 mb-1">GPS Mark</p>
                                    <p className="font-bold text-teal-800 text-sm font-mono">{selectedAnimal.coordinates[0]}°, {selectedAnimal.coordinates[1]}°</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-teal-900 uppercase tracking-widest border-b border-teal-100 pb-2">Ecological Note</h4>
                                <p className="text-teal-700 leading-relaxed text-lg font-medium italic">"{selectedAnimal.description}"</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showExitConfirm && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-teal-950/70 backdrop-blur-lg" onClick={() => setShowExitConfirm(false)} />
                    <div className="relative bg-white p-10 rounded-4xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
                        {/* <div className="w-24 h-24 bg-teal-50 rounded-[2rem] flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">🌏</div> */}
                        <h3 className="text-2xl font-black text-teal-900 mb-2">Close Expedition?</h3>
                        <p className="text-teal-600 mb-8 font-medium leading-relaxed">Your curated discovery view will be cleared.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => navigate(-1)} className="w-full py-4 bg-red-700 text-white rounded-2xl font-bold hover:bg-red-800 transition-all shadow-lg active:scale-95">Leave</button>
                            <button onClick={() => setShowExitConfirm(false)} className="w-full py-4 bg-teal-50 text-teal-700 rounded-2xl font-bold hover:bg-teal-100 transition-all">Keep Browsing</button>
                        </div>
                    </div>
                </div>
            )}

            {!isMapReady && (
                <div className="fixed inset-0 bg-white z-[5000] flex flex-col items-center justify-center gap-6">
                    <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                    <p className="text-teal-900 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Synchronizing Globe...</p>
                </div>
            )}
        </div>
    );
};

export default MapPage;
