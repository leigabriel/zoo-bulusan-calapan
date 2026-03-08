import React from 'react';
import { Link } from 'react-router-dom';

const EventsSection = () => {
    return (
        <section id="events-section" className="relative bg-[#ebebeb] p-3 sm:p-4 md:p-6 lg:p-10 min-h-[10vh] sm:min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden w-full">
            <div className="relative w-full max-w-[1500px] min-h-[400px] sm:min-h-[500px] md:aspect-video bg-[#08140e] rounded-xl sm:rounded-2xl md:rounded-sm overflow-hidden shadow-2xl">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url('/bulusan.png')` }}
                />
                <div
                    className="absolute inset-0 opacity-50"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.04) 39px, rgba(255,255,255,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.04) 39px, rgba(255,255,255,0.04) 40px)`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0d2218]/80 via-[#08140e]/60 to-[#08140e]/90" />
                <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full p-6 sm:p-8 md:p-16 lg:p-24 min-h-[400px] sm:min-h-[500px]">
                    <div className="w-12 h-[1px] bg-emerald-400/60 mb-8 md:mb-12" />
                    <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-medium text-white tracking-tight leading-tight md:leading-[1.05] break-words mb-6 sm:mb-8 md:mb-10 max-w-xl">
                        {['Wildlife', 'Events'].map((word) => (
                            <div key={word} className="overflow-hidden">
                                <span style={{ display: 'block' }}>{word}</span>
                            </div>
                        ))}
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed mb-10 sm:mb-12 md:mb-14 font-light max-w-md mx-auto">
                        Experience unforgettable moments with our animals through live feedings and shows.
                    </p>
                    <div>
                        <Link to="/events" className="group flex items-center bg-white rounded-md sm:rounded-[2px] overflow-hidden transition-all active:scale-95 shadow-2xl hover:bg-gray-100 min-h-[44px]">
                            <span className="px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-teal-700 border-r border-gray-100 whitespace-nowrap">View All Events</span>
                            <div className="px-3 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4 bg-gray-50 flex items-center justify-center min-h-[44px] min-w-[44px]">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </Link>
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 md:bottom-10">
                        <span className="text-white/20 text-[9px] tracking-[0.3em] uppercase">Scroll</span>
                        <div className="w-[1px] h-6 bg-white/20" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EventsSection;