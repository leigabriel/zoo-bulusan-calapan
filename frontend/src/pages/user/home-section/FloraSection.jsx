import React from 'react';
import { Link } from 'react-router-dom';

const FloraSection = () => {
    return (
        <section id="plant" className="relative w-full h-auto min-h-screen box-border bg-transparent overflow-hidden">
            <img
                src="/plant.png"
                alt="Plant Folder Background"
                className="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none"
            />

            <div className="relative z-10 w-full h-auto flex flex-col max-w-[1800px] mx-auto px-5 sm:px-8 md:px-12 lg:px-16 pt-28 sm:pt-32 md:pt-40 pb-16 text-[#212631]">
                <div className="flex flex-row justify-between items-end pb-3 border-b border-dotted border-[#212631] w-full gap-4">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold">
                        Featured Plant 01
                    </span>
                    <Link to="/plants" className="text-[10px] md:text-xs uppercase tracking-widest font-bold hover:opacity-60 transition-opacity text-right">
                        See All Plants &rarr;
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end py-6 md:py-12 border-b border-dotted border-[#212631] gap-4 md:gap-8">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl tracking-tight leading-[1.05] max-w-4xl font-normal">
                        Botanical Elegance: Papa Meilland Rose
                    </h2>
                    <div className="flex flex-wrap lg:flex-col gap-2 text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest">
                        <span>2025</span>
                        <span>Botanical Gardens</span>
                        <span className="bg-[#212631]/20 px-2 py-1 md:px-3 md:py-1.5 mt-1 md:mt-2 font-bold whitespace-nowrap w-fit">
                            Rosa, Perennial, Fragrant
                        </span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 md:gap-12 pt-6 md:pt-12">
                    <div className="w-full lg:w-1/4 flex flex-col gap-6 lg:gap-8">
                        <p className="text-xs sm:text-sm md:text-base leading-relaxed tracking-wide text-[#212631]/90">
                            An immersive exploration of the Papa Meilland rose, renowned worldwide for its deep velvet crimson petals and captivating, rich fragrance.
                        </p>
                    </div>

                    <div className="w-full lg:w-3/4 flex flex-col md:flex-row gap-2 sm:gap-4 lg:gap-6">
                        <div className="w-full md:w-2/3 h-[250px] sm:h-[350px] md:h-[500px] lg:h-[600px] bg-[#1a1a1a] overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1531874824027-2a0d33bd6338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cm9zZXxlbnwwfHwwfHx8MA%3D%3D"
                                alt="Papa Meilland Rose Feature"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                            />
                        </div>
                        <div className="w-full md:w-1/3 flex flex-row md:flex-col gap-2 sm:gap-4 lg:gap-6 h-[120px] sm:h-[180px] md:h-[500px] lg:h-[600px]">
                            <div className="flex-1 bg-[#1a1a1a] overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1763048233745-84e9af322a68?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cm9zZSUyMGdhcmRlbiUyMHNpbmdsZXxlbnwwfHwwfHx8MA%3D%3D"
                                    alt="Rose Petal Details"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                                />
                            </div>
                            <div className="flex-1 bg-[#1a1a1a] overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1770652487953-648a445bf2d9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHJvc2UlMjBnYXJkZW4lMjBzaW5nbGV8ZW58MHx8MHx8fDA%3D"
                                    alt="Dark Moody Rose"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FloraSection;