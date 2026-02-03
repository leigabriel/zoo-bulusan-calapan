import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Animal habitat data organized by region with geographic coordinates
const animalHabitats = [
    // ===== AFRICA =====
    {
        id: 1,
        name: 'African Lion',
        species: 'Panthera leo',
        habitat: 'Sub-Saharan Africa',
        region: 'Africa',
        coordinates: [-1.2921, 36.8219], // Kenya
        icon: '🦁',
        description: 'The king of the savannah, found in grasslands of Kenya, Tanzania, and South Africa.',
        category: 'Mammals'
    },
    {
        id: 2,
        name: 'African Elephant',
        species: 'Loxodonta africana',
        habitat: 'Central & Southern Africa',
        region: 'Africa',
        coordinates: [-15.4167, 28.2833], // Zambia
        icon: '🐘',
        description: 'The largest land animal, roaming the savannahs and forests of Africa.',
        category: 'Mammals'
    },
    {
        id: 3,
        name: 'Reticulated Giraffe',
        species: 'Giraffa reticulata',
        habitat: 'East Africa',
        region: 'Africa',
        coordinates: [0.0236, 37.9062], // Kenya
        icon: '🦒',
        description: 'The tallest mammal on Earth, native to Kenya, Ethiopia, and Somalia.',
        category: 'Mammals'
    },
    {
        id: 4,
        name: 'Plains Zebra',
        species: 'Equus quagga',
        habitat: 'East & Southern Africa',
        region: 'Africa',
        coordinates: [-2.3333, 34.8333], // Serengeti, Tanzania
        icon: '🦓',
        description: 'Known for distinctive black-and-white stripes, found across African grasslands.',
        category: 'Mammals'
    },
    {
        id: 5,
        name: 'Meerkat',
        species: 'Suricata suricatta',
        habitat: 'Kalahari Desert',
        region: 'Africa',
        coordinates: [-24.7500, 21.0000], // Botswana
        icon: '🐿️',
        description: 'Social desert dwellers of the Kalahari in Botswana and Namibia.',
        category: 'Mammals'
    },
    {
        id: 6,
        name: 'Western Lowland Gorilla',
        species: 'Gorilla gorilla gorilla',
        habitat: 'Central Africa',
        region: 'Africa',
        coordinates: [-0.2280, 15.8277], // Congo
        icon: '🦍',
        description: 'Our closest relatives, living in the dense forests of Congo, Gabon, and Cameroon.',
        category: 'Mammals'
    },
    {
        id: 7,
        name: 'Ring-tailed Lemur',
        species: 'Lemur catta',
        habitat: 'Madagascar',
        region: 'Africa',
        coordinates: [-18.7669, 46.8691], // Madagascar
        icon: '🐒',
        description: 'Endemic to Madagascar, known for their distinctive striped tails.',
        category: 'Mammals'
    },
    {
        id: 8,
        name: 'Common Ostrich',
        species: 'Struthio camelus',
        habitat: 'African Savannahs',
        region: 'Africa',
        coordinates: [12.8628, 15.0557], // Sahel region
        icon: '🦃',
        description: 'The largest living bird, native to African savannahs and the Sahel.',
        category: 'Birds'
    },

    // ===== ASIA =====
    {
        id: 9,
        name: 'Bengal Tiger',
        species: 'Panthera tigris tigris',
        habitat: 'Indian Subcontinent',
        region: 'Asia',
        coordinates: [22.5726, 88.3639], // Sundarbans, India
        icon: '🐅',
        description: 'The majestic big cat of India, Bangladesh, and Bhutan.',
        category: 'Mammals'
    },
    {
        id: 10,
        name: 'Giant Panda',
        species: 'Ailuropoda melanoleuca',
        habitat: 'South Central China',
        region: 'Asia',
        coordinates: [30.6171, 103.8203], // Sichuan, China
        icon: '🐼',
        description: 'Beloved bamboo eater from the mountains of Sichuan, Shaanxi, and Gansu.',
        category: 'Mammals'
    },
    {
        id: 11,
        name: 'Asian Elephant',
        species: 'Elephas maximus',
        habitat: 'Southeast Asia',
        region: 'Asia',
        coordinates: [8.5241, 76.9366], // Kerala, India
        icon: '🐘',
        description: 'Smaller than African cousins, found in India, Thailand, and Sri Lanka.',
        category: 'Mammals'
    },
    {
        id: 12,
        name: 'Red Panda',
        species: 'Ailurus fulgens',
        habitat: 'Eastern Himalayas',
        region: 'Asia',
        coordinates: [27.7172, 85.3240], // Nepal
        icon: '🦊',
        description: 'The adorable "firefox" of Nepal, Bhutan, and China.',
        category: 'Mammals'
    },
    {
        id: 13,
        name: 'Snow Leopard',
        species: 'Panthera uncia',
        habitat: 'Central Asian Mountains',
        region: 'Asia',
        coordinates: [46.8625, 103.8467], // Mongolia
        icon: '🐆',
        description: 'The ghost of the mountains, found in Mongolia, China, and Nepal.',
        category: 'Mammals'
    },
    {
        id: 14,
        name: 'Komodo Dragon',
        species: 'Varanus komodoensis',
        habitat: 'Indonesian Islands',
        region: 'Asia',
        coordinates: [-8.5500, 119.4833], // Komodo Island
        icon: '🦎',
        description: 'The world\'s largest lizard, endemic to Komodo, Rinca, and Flores.',
        category: 'Reptiles'
    },
    {
        id: 15,
        name: 'Orangutan',
        species: 'Pongo pygmaeus',
        habitat: 'Borneo & Sumatra',
        region: 'Asia',
        coordinates: [1.4927, 110.3000], // Borneo
        icon: '🦧',
        description: 'The great red apes of Indonesia and Malaysia\'s rainforests.',
        category: 'Mammals'
    },

    // ===== AUSTRALIA & OCEANIA =====
    {
        id: 16,
        name: 'Red Kangaroo',
        species: 'Macropus rufus',
        habitat: 'Central Australia',
        region: 'Australia & Oceania',
        coordinates: [-25.2744, 133.7751], // Central Australia
        icon: '🦘',
        description: 'Australia\'s iconic marsupial and the largest kangaroo species.',
        category: 'Mammals'
    },
    {
        id: 17,
        name: 'Koala',
        species: 'Phascolarctos cinereus',
        habitat: 'Eastern Australia',
        region: 'Australia & Oceania',
        coordinates: [-33.8688, 151.2093], // Sydney region
        icon: '🐨',
        description: 'Eucalyptus-loving marsupials of Eastern and Southern Australia.',
        category: 'Mammals'
    },
    {
        id: 18,
        name: 'Emu',
        species: 'Dromaius novaehollandiae',
        habitat: 'Mainland Australia',
        region: 'Australia & Oceania',
        coordinates: [-31.9505, 115.8605], // Western Australia
        icon: '🦃',
        description: 'Australia\'s largest bird and second-largest in the world.',
        category: 'Birds'
    },
    {
        id: 19,
        name: 'Tasmanian Devil',
        species: 'Sarcophilus harrisii',
        habitat: 'Tasmania',
        region: 'Australia & Oceania',
        coordinates: [-42.8821, 147.3272], // Tasmania
        icon: '🐕',
        description: 'Fierce carnivorous marsupial found only in Tasmania.',
        category: 'Mammals'
    },

    // ===== THE AMERICAS =====
    {
        id: 20,
        name: 'Jaguar',
        species: 'Panthera onca',
        habitat: 'Central & South America',
        region: 'The Americas',
        coordinates: [-3.4653, -62.2159], // Amazon, Brazil
        icon: '🐆',
        description: 'The apex predator of the Americas, from Mexico to Argentina.',
        category: 'Mammals'
    },
    {
        id: 21,
        name: 'Capybara',
        species: 'Hydrochoerus hydrochaeris',
        habitat: 'South American Wetlands',
        region: 'The Americas',
        coordinates: [-16.5000, -56.0000], // Pantanal, Brazil
        icon: '🐹',
        description: 'The world\'s largest rodent, native to South American wetlands.',
        category: 'Mammals'
    },
    {
        id: 22,
        name: 'Two-Toed Sloth',
        species: 'Choloepus didactylus',
        habitat: 'Central & South American Rainforests',
        region: 'The Americas',
        coordinates: [9.7489, -83.7534], // Costa Rica
        icon: '🦥',
        description: 'Slow-moving tree dwellers of tropical rainforests.',
        category: 'Mammals'
    },
    {
        id: 23,
        name: 'American Bison',
        species: 'Bison bison',
        habitat: 'North American Great Plains',
        region: 'The Americas',
        coordinates: [44.4280, -110.5885], // Yellowstone, USA
        icon: '🦬',
        description: 'The iconic symbol of the American West and Great Plains.',
        category: 'Mammals'
    },
    {
        id: 24,
        name: 'Bald Eagle',
        species: 'Haliaeetus leucocephalus',
        habitat: 'North America',
        region: 'The Americas',
        coordinates: [47.7511, -120.7401], // Washington State, USA
        icon: '🦅',
        description: 'America\'s national bird, found across USA, Canada, and Northern Mexico.',
        category: 'Birds'
    },
    {
        id: 25,
        name: 'Humboldt Penguin',
        species: 'Spheniscus humboldti',
        habitat: 'Coastal South America',
        region: 'The Americas',
        coordinates: [-33.0472, -71.6127], // Chile coast
        icon: '🐧',
        description: 'Warm-weather penguins native to coastal Chile and Peru.',
        category: 'Birds'
    },

    // ===== POLAR REGIONS =====
    {
        id: 26,
        name: 'Polar Bear',
        species: 'Ursus maritimus',
        habitat: 'Arctic Circle',
        region: 'Polar Regions',
        coordinates: [78.2232, 15.6267], // Svalbard, Norway
        icon: '🐻‍❄️',
        description: 'The Arctic\'s apex predator, found in Canada, Russia, Greenland, and Alaska.',
        category: 'Mammals'
    },
    {
        id: 27,
        name: 'Arctic Fox',
        species: 'Vulpes lagopus',
        habitat: 'Arctic Tundra',
        region: 'Polar Regions',
        coordinates: [64.9631, -19.0208], // Iceland
        icon: '🦊',
        description: 'Hardy tundra survivors across Northern Europe, Asia, and North America.',
        category: 'Mammals'
    }
];

// Region colors for visual distinction
const regionColors = {
    'Africa': '#f59e0b',
    'Asia': '#ef4444',
    'Australia & Oceania': '#8b5cf6',
    'The Americas': '#10b981',
    'Polar Regions': '#3b82f6'
};

const MapPage = () => {
    const navigate = useNavigate();
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [filterRegion, setFilterRegion] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');

    const regions = ['All', 'Africa', 'Asia', 'Australia & Oceania', 'The Americas', 'Polar Regions'];
    const categories = ['All', 'Mammals', 'Birds', 'Reptiles'];

    useEffect(() => {
        // Load Leaflet CSS
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = '/dist/leaflet.css';
        document.head.appendChild(linkElement);

        // Load Leaflet JS
        const scriptElement = document.createElement('script');
        scriptElement.src = '/dist/leaflet.js';
        scriptElement.async = true;

        scriptElement.onload = () => {
            if (mapContainerRef.current && !mapRef.current && window.L) {
                initializeMap();
            }
        };

        document.body.appendChild(scriptElement);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            if (linkElement.parentNode) {
                linkElement.parentNode.removeChild(linkElement);
            }
            if (scriptElement.parentNode) {
                scriptElement.parentNode.removeChild(scriptElement);
            }
        };
    }, []);

    const initializeMap = () => {
        if (!window.L || !mapContainerRef.current) return;

        const L = window.L;

        // Initialize the map centered on a world view
        const map = L.map(mapContainerRef.current, {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: false,
            scrollWheelZoom: true,
            dragging: true,
            doubleClickZoom: true,
            touchZoom: true,
            worldCopyJump: true
        });

        // Add OpenStreetMap tile layer with a nicer style
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        // Add custom zoom control to top-right
        L.control.zoom({
            position: 'topright'
        }).addTo(map);

        // Store map reference
        mapRef.current = map;
        setIsMapReady(true);

        // Add markers for each animal
        addAnimalMarkers(map, L);
    };

    const getFilteredAnimals = () => {
        return animalHabitats.filter(animal => {
            const matchesRegion = filterRegion === 'All' || animal.region === filterRegion;
            const matchesCategory = filterCategory === 'All' || animal.category === filterCategory;
            return matchesRegion && matchesCategory;
        });
    };

    const addAnimalMarkers = (map, L) => {
        // Clear existing markers
        markersRef.current.forEach(marker => map.removeLayer(marker));
        markersRef.current = [];

        const filteredAnimals = getFilteredAnimals();

        filteredAnimals.forEach(animal => {
            const regionColor = regionColors[animal.region] || '#10b981';

            // Create custom icon with emoji and region color
            const customIcon = L.divIcon({
                className: 'custom-animal-marker',
                html: `
                    <div class="animal-marker-container">
                        <div class="animal-marker-icon" style="border-color: ${regionColor};">${animal.icon}</div>
                        <div class="animal-marker-pulse" style="background: ${regionColor};"></div>
                    </div>
                `,
                iconSize: [50, 50],
                iconAnchor: [25, 25]
            });

            const marker = L.marker(animal.coordinates, { icon: customIcon })
                .addTo(map);

            // Create popup content
            const popupContent = `
                <div class="animal-popup">
                    <div class="animal-popup-header" style="background: linear-gradient(135deg, ${regionColor}, ${regionColor}dd);">
                        <span class="animal-popup-icon">${animal.icon}</span>
                        <div>
                            <h3 class="animal-popup-name">${animal.name}</h3>
                            <p class="animal-popup-species">${animal.species}</p>
                        </div>
                    </div>
                    <div class="animal-popup-body">
                        <p class="animal-popup-habitat"><strong>🌍 Habitat:</strong> ${animal.habitat}</p>
                        <p class="animal-popup-desc">${animal.description}</p>
                        <div class="animal-popup-tags">
                            <span class="animal-popup-region" style="background: ${regionColor}20; color: ${regionColor};">${animal.region}</span>
                            <span class="animal-popup-category">${animal.category}</span>
                        </div>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, {
                maxWidth: 320,
                className: 'custom-popup'
            });

            marker.on('click', () => {
                setSelectedAnimal(animal);
            });

            markersRef.current.push(marker);
        });
    };

    // Re-add markers when filters change
    useEffect(() => {
        if (mapRef.current && window.L && isMapReady) {
            addAnimalMarkers(mapRef.current, window.L);
        }
    }, [filterRegion, filterCategory, isMapReady]);

    const handleGoBack = () => {
        navigate(-1);
    };

    const flyToAnimal = (animal) => {
        if (mapRef.current) {
            mapRef.current.flyTo(animal.coordinates, 6, {
                duration: 1.5
            });
            setSelectedAnimal(animal);

            // Open the popup for this animal
            markersRef.current.forEach(marker => {
                const latlng = marker.getLatLng();
                if (latlng.lat === animal.coordinates[0] && latlng.lng === animal.coordinates[1]) {
                    marker.openPopup();
                }
            });
        }
    };

    const flyToRegion = (region) => {
        if (!mapRef.current) return;

        const regionCenters = {
            'Africa': [0, 20, 3],
            'Asia': [30, 100, 3],
            'Australia & Oceania': [-25, 135, 4],
            'The Americas': [10, -80, 3],
            'Polar Regions': [70, 0, 3]
        };

        if (regionCenters[region]) {
            const [lat, lng, zoom] = regionCenters[region];
            mapRef.current.flyTo([lat, lng], zoom, { duration: 1.5 });
        }
    };

    const filteredAnimals = getFilteredAnimals();

    return (
        <>
            {/* Inject custom styles for markers */}
            <style>{`
                .custom-animal-marker {
                    background: transparent;
                    border: none;
                }
                .animal-marker-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .animal-marker-icon {
                    font-size: 24px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                    z-index: 2;
                    background: white;
                    border-radius: 50%;
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid #10b981;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                .animal-marker-icon:hover {
                    transform: scale(1.2);
                }
                .animal-marker-pulse {
                    position: absolute;
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: rgba(16, 185, 129, 0.3);
                    animation: pulse 2s infinite;
                    z-index: 1;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(2); opacity: 0; }
                }
                .custom-popup .leaflet-popup-content-wrapper {
                    border-radius: 16px;
                    padding: 0;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                .custom-popup .leaflet-popup-content {
                    margin: 0;
                    min-width: 260px;
                }
                .custom-popup .leaflet-popup-tip {
                    background: white;
                }
                .animal-popup-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: linear-gradient(135deg, #10b981, #0d9488);
                    color: white;
                }
                .animal-popup-icon {
                    font-size: 36px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 12px;
                    width: 56px;
                    height: 56px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .animal-popup-name {
                    font-size: 18px;
                    font-weight: 700;
                    margin: 0;
                }
                .animal-popup-species {
                    font-size: 12px;
                    opacity: 0.9;
                    margin: 4px 0 0 0;
                    font-style: italic;
                }
                .animal-popup-body {
                    padding: 16px;
                    background: white;
                }
                .animal-popup-habitat {
                    font-size: 13px;
                    color: #374151;
                    margin: 0 0 10px 0;
                }
                .animal-popup-desc {
                    font-size: 13px;
                    color: #6b7280;
                    margin: 0 0 12px 0;
                    line-height: 1.5;
                }
                .animal-popup-tags {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .animal-popup-region {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                }
                .animal-popup-category {
                    display: inline-block;
                    padding: 4px 12px;
                    background: #f3f4f6;
                    color: #374151;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                }
                .leaflet-control-zoom a {
                    width: 36px !important;
                    height: 36px !important;
                    line-height: 36px !important;
                    font-size: 18px !important;
                    border-radius: 8px !important;
                }
                .leaflet-control-zoom {
                    border: none !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
                    border-radius: 12px !important;
                    overflow: hidden;
                }
            `}</style>

            <div className="fixed inset-0 flex flex-col bg-gray-100">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between max-w-7xl mx-auto gap-2">
                        {/* Back Button */}
                        <button
                            onClick={handleGoBack}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="hidden sm:inline">Back</span>
                        </button>

                        {/* Title */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="hidden md:block">
                                <h1 className="text-lg font-bold text-gray-900">Wildlife World Map</h1>
                                <p className="text-xs text-gray-500">Discover where our {animalHabitats.length} animals originate</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <select
                                value={filterRegion}
                                onChange={(e) => {
                                    setFilterRegion(e.target.value);
                                    if (e.target.value !== 'All') {
                                        flyToRegion(e.target.value);
                                    }
                                }}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium text-xs sm:text-sm transition-colors cursor-pointer border-0 focus:ring-2 focus:ring-emerald-500"
                            >
                                {regions.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium text-xs sm:text-sm transition-colors cursor-pointer border-0 focus:ring-2 focus:ring-emerald-500 hidden sm:block"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Map Container */}
                <div
                    ref={mapContainerRef}
                    className="flex-1 w-full mt-[68px]"
                    style={{ minHeight: 'calc(100vh - 68px)' }}
                />

                {/* Animal List Sidebar */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-auto sm:top-[84px] sm:left-4 sm:right-auto sm:w-80 z-[1000]">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 max-h-[200px] sm:max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
                        {/* Sidebar Header */}
                        <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-teal-600">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-white text-sm">🌍 Animals ({filteredAnimals.length})</h3>
                                {filterRegion !== 'All' && (
                                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-white text-xs">
                                        {filterRegion}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Animal List */}
                        <div className="overflow-y-auto flex-1 p-2">
                            {filteredAnimals.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-sm">No animals match your filters</p>
                                </div>
                            ) : (
                                filteredAnimals.map(animal => (
                                    <button
                                        key={animal.id}
                                        onClick={() => flyToAnimal(animal)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200 ${selectedAnimal?.id === animal.id
                                                ? 'bg-emerald-50 border border-emerald-200'
                                                : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-2xl flex-shrink-0">{animal.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm truncate">{animal.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{animal.habitat}</p>
                                        </div>
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: regionColors[animal.region] }}
                                            title={animal.region}
                                        />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Region Legend */}
                <div className="absolute bottom-4 right-4 z-[1000] hidden lg:block">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-4">
                        <h4 className="font-bold text-gray-700 text-xs mb-3 uppercase tracking-wide">Regions</h4>
                        <div className="space-y-2">
                            {Object.entries(regionColors).map(([region, color]) => (
                                <button
                                    key={region}
                                    onClick={() => {
                                        setFilterRegion(region);
                                        flyToRegion(region);
                                    }}
                                    className="flex items-center gap-2 w-full text-left hover:bg-gray-50 rounded-lg p-1 transition-colors"
                                >
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-xs text-gray-600">{region}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Loading Overlay */}
                {!isMapReady && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[2000]">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">Loading Wildlife Map...</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default MapPage;