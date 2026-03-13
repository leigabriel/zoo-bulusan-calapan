import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const WildlifeSection = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    return (
        <section id="animal" className="w-full bg-[#ebebeb] text-[#212631] border-y border-[#212631] box-border">
            <div className="flex flex-col lg:flex-row w-full min-h-[100svh]">

                <div
                    className="w-full lg:w-1/2 min-h-[50vh] lg:min-h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-[#212631] relative cursor-none"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <img
                        src="https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=1200&h=1200&fit=crop"
                        alt="Wildlife"
                        className="w-full h-full object-cover absolute inset-0"
                    />
                    {isHovered && (
                        <div
                            className="fixed z-50 pointer-events-none bg-[#38d091] text-[#ebebeb] px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2"
                            style={{ left: mousePos.x, top: mousePos.y }}
                        >
                            Explore Fauna
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-1/2 flex relative flex-col justify-between">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#212631] px-6 py-4 text-[10px] md:text-xs uppercase tracking-widest gap-2 sm:gap-0">
                        <span>Announcing our new species</span>
                        <span className="text-[#38d091]">{'>'.repeat(8)} Read More</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 relative">
                        <span className="border border-[#38d091] text-[#38d091] rounded-full px-4 py-1.5 text-[10px] uppercase tracking-widest w-max mb-8 font-bold">
                            Wildlife Collection
                        </span>

                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                            Exotic<br />Fauna.
                        </h2>

                        <p className="text-sm md:text-base text-[#212631] leading-relaxed mb-10 max-w-md">
                            Bulusan Zoo creates dedicated environments that adapt to natural instincts, amplifying wildlife preservation. Every effort compounds.
                        </p>

                        <div>
                            <Link to="/animals" className="bg-[#38d091] text-[#ebebeb] text-xs font-bold tracking-widest uppercase px-8 py-4 hover:bg-[#212631] hover:text-[#38d091] transition-all duration-300 inline-block">
                                Contact Us
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-[#212631] px-6 py-4 text-[10px] md:text-xs uppercase tracking-widest gap-2 sm:gap-0">
                        <span>Born from the spirit of Mindoro</span>
                        <span className="text-[#38d091]">V. 1.3 &nbsp;&nbsp;&nbsp; Optimize / Adapt / Evolve</span>
                    </div>
                </div>

                <div className="hidden lg:flex w-12 border-l border-[#212631] items-center justify-center relative shrink-0">
                    <span className="absolute transform rotate-90 whitespace-nowrap text-[10px] tracking-widest uppercase text-[#38d091]">
                        Building in Calapan City
                    </span>
                </div>
            </div>
        </section>
    );
};

export default WildlifeSection;
