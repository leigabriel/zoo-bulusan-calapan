import React from 'react';
import { Link } from 'react-router-dom';

const PricingSection = () => {
    return (
        <section id="tickets-section" className="py-16 sm:py-20 md:py-24 bg-[#ebebeb] w-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10 sm:mb-12 md:mb-14">
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 uppercase block mb-2 sm:mb-3">
                        PRICING
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-medium text-gray-900 leading-tight">
                        <span className="overflow-hidden inline-block w-full" style={{ verticalAlign: 'bottom' }}>
                            <span style={{ display: 'block' }}>Choose the right ticket for you</span>
                        </span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 border border-[#212631]/20 rounded-lg lg:rounded-none shadow-sm mb-8 sm:mb-10 md:mb-12">
                    {[
                        { label: "ADULT", price: "₱40", desc: "Ages 18-59. Perfect for those who want the full experience." },
                        { label: "CHILD", price: "₱20", desc: "Ages 5-17. Launch your first visit and start exploring within minutes." },
                        { label: "RESIDENT", price: "FREE", desc: "Exclusive for local residents. End-to-end community access." }
                    ].map((t, i) => (
                        <div
                            key={i}
                            className="flex flex-col justify-between p-6 sm:p-8 md:p-9 bg-white border-b lg:border-r lg:border-b-0 border-gray-300 last:border-b-0 lg:last:border-r-0"
                        >
                            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.1em] sm:tracking-[0.15em] text-gray-400 uppercase mb-4 sm:mb-6">
                                {t.label}
                            </span>
                            <div className="flex items-center h-[60px] mb-4 sm:mb-6">
                                <div className="text-3xl sm:text-4xl md:text-[44px] font-medium text-gray-900 leading-none">
                                    {t.price}
                                </div>
                            </div>
                            <div className="h-[1px] w-full bg-gray-200 mb-6 sm:mb-8" />
                            <p className="text-sm sm:text-base md:text-[18px] leading-relaxed text-gray-500 min-h-[70px]">
                                {t.desc}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center">
                    <Link to="/reservations">
                        <button className="px-8 py-3.5 sm:px-10 sm:py-4 md:px-12 md:py-4 bg-gray-900 text-white text-xs sm:text-sm font-bold tracking-wider sm:tracking-widest uppercase rounded-full hover:bg-gray-800 transition-all duration-300 shadow-lg shadow-gray-200 min-h-[44px]">
                            Reserve Now
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;