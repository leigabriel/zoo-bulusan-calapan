import React from 'react';
import { Link } from 'react-router-dom';

const AboutSection = () => {
    return (
        <section className="bg-[#26bc61] flex-1 flex flex-col justify-center px-6 py-10 md:px-16 w-full h-full overflow-hidden">
            <div className="max-w-[1500px] mx-auto w-full flex flex-col md:flex-row h-full">
                <div className="w-full md:w-1/2 flex flex-col justify-center h-[55%] md:h-full pt-16 md:pt-0 z-10">
                    <h2 className="text-[#212631] text-xl md:text-3xl lg:text-4xl uppercase tracking-wide mb-6 md:mb-12">
                        About Bulusan Zoo
                    </h2>
                    <div className="mb-8 md:mb-12">
                        {['Founded in 2015,', 'Bulusan Wildlife & Nature Park', 'began as a small conservation', 'initiative in Calapan City.'].map((line, i) => (
                            <p key={i} className="text-[#212631] text-2xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.15] md:leading-[1.1] tracking-tight">
                                <span className="block">{line}</span>
                            </p>
                        ))}
                    </div>
                    <div className="mt-auto md:mt-0">
                        <Link to="/about" className="border border-[#212631]/30 text-[#212631] text-xs md:text-sm font-bold tracking-widest uppercase px-8 py-4 hover:bg-[#212631] hover:text-[#ebebeb] transition-all duration-300 inline-block">More</Link>
                    </div>
                </div>
                <div className="w-full md:w-1/2 h-[45%] md:h-full relative pointer-events-none">
                </div>
            </div>
        </section>
    );
};

export default AboutSection;