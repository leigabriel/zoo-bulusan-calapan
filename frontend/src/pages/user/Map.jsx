import React, { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, APILoadingStatus, Map3D, MapMode, Marker3D, AltitudeMode, Pin, useApiLoadingStatus } from '@vis.gl/react-google-maps';
import { ChevronLeft, Menu, X } from 'reicon-react';
import animalHabitats from '../../data/animal-habitats';

/* global __GOOGLE_MAPS_API_KEY__ */

const API_KEY = __GOOGLE_MAPS_API_KEY__;

const regionColors = {
    'Africa': '#b8784e',
    'Asia': '#5f8065',
    'Australia & Oceania': '#7a9b86',
    'The Americas': '#6d8592',
    'Polar Regions': '#8098ad',
    'Europe': '#987c66'
};

const INITIAL_VIEW = {
    center: { lat: 20, lng: 0, altitude: 0 },
    range: 32000000,
    heading: 0,
    tilt: 0,
    roll: 0
};

const FOCUS_RANGE = 4200000;
const FOCUS_TILT = 55;

const DiscoveryList = memo(({ isMobile, filterRegion, setFilterRegion, onSelect, onClose }) => (
    <div className={`flex flex-col h-full bg-[#fffdf8] ${!isMobile && 'border-l border-[#dce5dc] shadow-2xl'}`}>
        <div className="p-5 md:p-8 border-b border-[#dce5dc] bg-[#f1f5ed]">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d8572]">Field guide</p>
                    <h1 className="mt-1 text-xl md:text-2xl font-black tracking-tight text-[#1f3328]">Wildlife Origins</h1>
                </div>
                {isMobile && (
                    <button onClick={onClose} className="p-2 text-[#52675a] hover:bg-white rounded-xl transition-colors" aria-label="Close wildlife origins">
                        <X className="h-6 w-6" />
                    </button>
                )}
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {['All', ...Object.keys(regionColors)].map(region => (
                    <button
                        key={region}
                        onClick={() => setFilterRegion(region)}
                        className={`whitespace-nowrap px-3.5 py-2 rounded-full text-[10px] font-bold transition-all border ${filterRegion === region ? 'bg-[#1f3328] text-white border-[#1f3328] shadow-sm' : 'bg-[#fffdf8] text-[#52675a] border-[#d5e1d5] hover:border-[#78927e]'}`}
                    >
                        {region}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-2 hide-scrollbar">
            {animalHabitats.filter(a => filterRegion === 'All' || a.region === filterRegion).map(animal => (
                <div
                    key={animal.id}
                    onClick={() => onSelect(animal)}
                    className="flex items-center gap-4 p-3.5 rounded-2xl transition-all cursor-pointer hover:bg-[#edf3eb] hover:translate-x-1"
                >
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl flex-shrink-0">
                        {animal.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{animal.name}</h4>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#6d8572]">{animal.region}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
));

const GlobeMap = ({ filterRegion, onSelectAnimal }) => {
    const apiStatus = useApiLoadingStatus();
    const [viewProps, setViewProps] = useState(INITIAL_VIEW);

    const handleCameraChange = useCallback((ev) => {
        setViewProps(prev => ({ ...prev, ...ev.detail }));
    }, []);

    const visibleAnimals = filterRegion === 'All'
        ? animalHabitats
        : animalHabitats.filter(a => a.region === filterRegion);

    const isLoaded = apiStatus === APILoadingStatus.LOADED;
    const isFailed = apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE;

    if (!isLoaded) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[#e8eee8]">
                {isFailed ? (
                    <p className="px-6 text-center text-sm font-medium text-[#52675a]">
                        Could not load the 3D globe. Check that the Google Maps API key is valid and that the Maps 3D API is enabled.
                    </p>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-12 h-12 border-4 border-[#d5e1d5] border-t-[#1f3328] rounded-full animate-spin" />
                        <p className="text-[#1f3328] font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Synchronizing Globe...</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Map3D
            {...viewProps}
            mode={MapMode.SATELLITE}
            onCameraChanged={handleCameraChange}
            style={{ width: '100%', height: '100%' }}
        >
            {visibleAnimals.map(animal => (
                <Marker3D
                    key={animal.id}
                    position={{ lat: animal.coordinates[0], lng: animal.coordinates[1], altitude: 0 }}
                    altitudeMode={AltitudeMode.RELATIVE_TO_GROUND}
                    onClick={() => onSelectAnimal(animal)}
                    title={`${animal.name} — ${animal.region}`}
                >
                    <Pin
                        background={regionColors[animal.region]}
                        borderColor="#ffffff"
                        glyphColor="#ffffff"
                        glyph={animal.icon}
                        scale={10}
                    />
                </Marker3D>
            ))}
        </Map3D>
    );
};

const MapFallback = () => (
    <div className="h-full w-full flex items-center justify-center bg-[#e8eee8] p-8">
        <div className="max-w-xs text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full border-4 border-white bg-[#f1f5ed] shadow-inner flex items-center justify-center text-4xl">
                🌏
            </div>
            <h2 className="text-lg font-black text-[#1f3328] mb-2">3D Globe Disabled</h2>
            <p className="text-sm text-[#52675a] font-medium leading-relaxed">
                The interactive globe needs a Google Maps API key with the Maps 3D API enabled. Set <span className="font-mono text-[#1f3328]">VITE_GOOGLE_MAPS_API_KEY</span> to activate it.
            </p>
        </div>
    </div>
);

const MapPage = () => {
    const navigate = useNavigate();
    const [filterRegion, setFilterRegion] = useState('All');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isMobileListOpen, setIsMobileListOpen] = useState(false);

    const handleSelect = useCallback((animal) => {
        navigate(`/map/animals/${animal.id}`);
        setIsMobileListOpen(false);
    }, [navigate]);

    return (
        <div className="wildlife-origins flex flex-col md:flex-row h-[100dvh] w-full bg-[#eef3ed] overflow-hidden text-[#1f3328] antialiased">
            <style>{`
                .wildlife-origins gmp-map-3d { background: #e8eee8 !important; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="flex-1 relative h-full">
                <div className="absolute top-4 md:top-6 left-4 md:left-6 z-[1000] flex gap-2">
                    <button onClick={() => setShowExitConfirm(true)} className="h-12 w-12 md:h-14 md:w-14 bg-[#fffdf8] rounded-2xl shadow-lg flex items-center justify-center hover:bg-[#edf3eb] transition-all border border-[#dce5dc]" aria-label="Back">
                        <ChevronLeft className="h-6 w-6 text-[#1f3328]" />
                    </button>
                     <button onClick={() => setIsMobileListOpen(true)} className="md:hidden h-12 w-12 bg-[#fffdf8] rounded-2xl shadow-lg flex items-center justify-center border border-[#dce5dc]" aria-label="Open wildlife list">
                         <Menu className="h-6 w-6 text-[#1f3328]" />
                    </button>
                </div>
                {API_KEY ? (
                    <APIProvider apiKey={API_KEY} libraries={['maps3d', 'marker']}>
                        <GlobeMap filterRegion={filterRegion} onSelectAnimal={handleSelect} />
                    </APIProvider>
                ) : (
                    <MapFallback />
                )}
            </div>

            <aside className="hidden md:block w-80 lg:w-96 h-full z-[1001]">
                <DiscoveryList filterRegion={filterRegion} setFilterRegion={setFilterRegion} onSelect={handleSelect} />
            </aside>

            {isMobileListOpen && (
                <div className="fixed inset-0 z-[2000] md:hidden">
                     <div className="absolute inset-0 bg-[#1f3328]/45 backdrop-blur-sm" onClick={() => setIsMobileListOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 h-[min(80dvh,42rem)] rounded-t-[2.5rem] overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
                        <DiscoveryList isMobile={true} filterRegion={filterRegion} setFilterRegion={setFilterRegion} onSelect={handleSelect} onClose={() => setIsMobileListOpen(false)} />
                    </div>
                </div>
            )}

            {showExitConfirm && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
                     <div className="absolute inset-0 bg-[#1f3328]/70 backdrop-blur-lg" onClick={() => setShowExitConfirm(false)} />
                    <div className="relative bg-[#fffdf8] p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
                         <h3 className="text-2xl font-black text-[#1f3328] mb-2">Close Expedition?</h3>
                         <p className="text-[#52675a] mb-8 font-medium leading-relaxed">Your curated discovery view will be cleared.</p>
                        <div className="flex flex-col gap-3">
                             <button onClick={() => navigate(-1)} className="w-full py-4 bg-[#1f3328] text-white rounded-2xl font-bold hover:bg-[#294536] transition-all shadow-lg active:scale-95">Leave</button>
                              <button onClick={() => setShowExitConfirm(false)} className="w-full py-4 bg-[#e5f0e3] text-[#1f3328] rounded-2xl font-bold hover:bg-[#d8e8d7] transition-all">Keep Browsing</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;