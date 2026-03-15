import React from 'react';
import { Link } from 'react-router-dom';

const EventsSection = () => {
    return (
        <section id="events-section" className="bg-[#ebebeb] w-full flex items-center justify-center py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="w-full max-w-[1600px] mx-auto bg-[#38d091] rounded-[1rem] md:rounded-[3rem] overflow-hidden relative flex flex-col min-h-[75vh] sm:min-h-[80vh]">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 relative z-30 px-6 pt-10 sm:px-12 sm:pt-16 md:px-16 md:pt-20 lg:px-20 lg:pt-24">
                    <div className="flex flex-col items-start gap-4">
                        <span className="bg-white/20 text-[#ebebeb] text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-white/10">
                            Daily Events
                        </span>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#ebebeb] leading-tight tracking-tight">
                            live feeding &<br />animal shows
                        </h3>
                    </div>

                    <div className="flex flex-col items-start gap-4">
                        <span className="bg-white/20 text-[#ebebeb] text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-white/10">
                            Schedule
                        </span>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#ebebeb] leading-tight tracking-tight">
                            every day from<br />8:00am to 5:00pm
                        </h3>
                        <Link to="/events" className="mt-2 text-[#ebebeb] font-medium underline decoration-2 underline-offset-4 hover:text-[#212631] transition-colors">
                            View full program
                        </Link>
                    </div>

                    <div className="flex flex-col items-start gap-4">
                        <span className="bg-white/20 text-[#ebebeb] text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-white/10">
                            Reserve
                        </span>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#ebebeb] leading-tight tracking-tight">
                            skip the line<br />book online*
                        </h3>
                        <p className="text-[#ebebeb]/70 text-[10px] sm:text-xs font-medium">
                            *residents enter for free. id required.
                        </p>
                    </div>
                </div>

                <div className="relative w-full flex-grow flex justify-center items-end mt-12 pb-8 sm:pb-12 lg:pb-16 z-10 pointer-events-none">

                    <h2 className="text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] font-serif italic text-[#ebebeb] leading-none tracking-tighter m-0 pb-6 md:pb-10 select-none drop-shadow-lg whitespace-nowrap">
                        wildlife
                    </h2>

                    <div className="absolute bottom-[40%] right-[10%] md:right-[20%] rotate-12 pointer-events-auto hover:scale-110 transition-transform cursor-pointer">
                        <div className="bg-[#212631] text-[#ebebeb] px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-xl shadow-xl border-2 md:border-4 border-[#ebebeb] flex items-center gap-2">
                            explore
                        </div>
                    </div>

                    <div className="absolute bottom-[20%] left-[5%] md:left-[15%] -rotate-6 pointer-events-auto hover:scale-110 transition-transform cursor-pointer">
                        <div className="w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-[#ebebeb] shadow-xl bg-[#212631]">
                            <img src="https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=200&h=200&fit=crop" alt="Monkey" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <div className="absolute top-[10%] left-[35%] md:left-[45%] rotate-[20deg] pointer-events-auto hover:scale-110 transition-transform hidden sm:block cursor-pointer">
                        <div className="bg-[#ebebeb] text-[#007a55] px-4 py-1.5 md:px-6 md:py-2 rounded-full font-black text-lg md:text-3xl shadow-xl border-2 md:border-4 border-[#007a55]">
                            100%
                        </div>
                    </div>

                    <div className="absolute bottom-[15%] right-[5%] md:right-[15%] -rotate-[15deg] pointer-events-auto hover:scale-110 transition-transform cursor-pointer">
                        <div className="bg-[#212631] text-white p-3 md:p-5 rounded-full shadow-xl border-2 md:border-4 border-[#ebebeb]">
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default EventsSection;
