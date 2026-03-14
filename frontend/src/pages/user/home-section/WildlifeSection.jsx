import React from 'react';
import { Link } from 'react-router-dom';

const WildlifeSection = () => {
    return (
        <section id="animal" className="relative w-full h-auto min-h-screen box-border bg-transparent overflow-hidden">
            <img
                src="/animal.png"
                alt="Animal Folder Background"
                className="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none"
            />

            <div className="relative z-10 w-full h-auto flex flex-col max-w-[1800px] mx-auto px-5 sm:px-8 md:px-12 lg:px-16 pt-28 sm:pt-32 md:pt-40 pb-16 text-[#EAE7DC]">
                <div className="flex flex-row justify-between items-end pb-3 border-b border-dotted border-[#2C3930] w-full gap-4">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold">
                        Featured Wildlife 01
                    </span>
                    <Link to="/animals" className="text-[10px] md:text-xs uppercase tracking-widest font-bold hover:opacity-60 transition-opacity text-right">
                        See All Animals &rarr;
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end py-6 md:py-12 border-b border-dotted border-[#2C3930] gap-4 md:gap-8">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl tracking-tight leading-[1.05] max-w-4xl font-normal">
                        Graceful Fauna: The Philippine Deer
                    </h2>
                    <div className="flex flex-wrap lg:flex-col gap-2 text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest">
                        <span>2025</span>
                        <span>Bulusan Conservation</span>
                        <span className="bg-[#2C3930]/10 px-2 py-1 md:px-3 md:py-1.5 mt-1 md:mt-2 font-bold whitespace-nowrap w-fit">
                            Mammals, Endemic, Herbivore
                        </span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 md:gap-12 pt-6 md:pt-12">
                    <div className="w-full lg:w-1/4 flex flex-col gap-6 lg:gap-8">
                        <p className="text-xs sm:text-sm md:text-base leading-relaxed tracking-wide text-[#EAE7DC]/80">
                            A detailed look into the habitat and behavior of the native deer species, showcasing its elegance, gentle nature, and vital role in balancing the local ecosystem.
                        </p>
                        <Link to="/animals" className="text-[10px] sm:text-xs uppercase tracking-widest font-bold hover:opacity-60 transition-opacity w-max border-b border-[#2C3930] pb-1">
                            View Project &rarr;
                        </Link>
                    </div>

                    <div className="w-full lg:w-3/4 flex flex-col md:flex-row gap-2 sm:gap-4 lg:gap-6">
                        <div className="w-full md:w-2/3 h-[250px] sm:h-[350px] md:h-[500px] lg:h-[600px] bg-[#2C3930] overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1695293721056-f1f91f52b004?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                alt="Philippine Deer Feature"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                            />
                        </div>
                        <div className="w-full md:w-1/3 flex flex-row md:flex-col gap-2 sm:gap-4 lg:gap-6 h-[120px] sm:h-[180px] md:h-[500px] lg:h-[600px]">
                            <div className="flex-1 bg-[#2C3930] overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1695293721404-a944512e52c3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzl8fGRlZXIlMjB6b298ZW58MHx8MHx8fDA%3D"
                                    alt="Deer Portrait"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                                />
                            </div>
                            <div className="flex-1 bg-[#2C3930] overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1695293721360-c36e4e2abe26?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDJ8fGRlZXIlMjB6b298ZW58MHx8MHx8fDA%3D"
                                    alt="Deer in Forest"
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

export default WildlifeSection;