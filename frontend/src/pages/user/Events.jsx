import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const Icons = {
    Utensils: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-white opacity-90">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
        </svg>
    ),
    Bird: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-white opacity-90">
            <path d="M21 3v2c0 9.627-5.373 14-12 14H7.098c.21.576.503 1.12.87 1.615.61.82 1.48 1.54 2.632 2.155A14.247 14.247 0 0 0 18 24c1.15 0 2.22-.265 3.19-.73.49-.235.93-.52 1.32-.84.28-.23.53-.49.75-.77.19-.24.35-.49.49-.75.25-.49.43-1.02.52-1.57.06-.34.09-.7.09-1.07V3h-3.36zM3 13c2.67 0 5.14-.94 7.12-2.52A12.08 12.08 0 0 0 14.62 3H3v10z" />
        </svg>
    ),
    Clock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
        </svg>
    ),
    Calendar: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
        </svg>
    )
};

const Events = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <section className="relative text-white py-24 text-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(45,90,39,0.85), rgba(58,140,125,0.85)), url(https://images.unsplash.com/photo-1518837695005-2083093ee35b)' }}>
                <div className="relative z-10 animate-fade-in-up">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">Wildlife Events</h1>
                    <p className="text-xl max-w-2xl mx-auto opacity-90 font-light">Experience unforgettable moments with our animals through live feedings and shows.</p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-16 flex-grow">
                <div className="flex items-center justify-center gap-3 mb-12">
                    <span className="h-px w-12 bg-green-200"></span>
                    <h2 className="text-3xl font-bold text-green-800 tracking-wide uppercase">Upcoming Activities</h2>
                    <span className="h-px w-12 bg-green-200"></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

                    <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                        <div className="h-48 bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <div className="transform group-hover:scale-110 transition duration-500">
                                <Icons.Utensils />
                            </div>
                            <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-md flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE NOW
                            </span>
                        </div>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-2xl text-gray-800">Penguin Feeding</h3>
                                <div className="flex items-center gap-1.5 text-teal-600 bg-teal-50 px-3 py-1 rounded-lg font-bold text-sm">
                                    <Icons.Clock /> 2:30 PM
                                </div>
                            </div>
                            <p className="text-gray-500 mb-8 leading-relaxed">Watch our playful penguins dive and swim as they enjoy their afternoon meal.</p>
                            <button className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2">
                                <Icons.Calendar /> Join Event
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                        <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <div className="transform group-hover:scale-110 transition duration-500">
                                <Icons.Bird />
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-2xl text-gray-800">Tropical Bird Show</h3>
                                <div className="flex items-center gap-1.5 text-teal-600 bg-teal-50 px-3 py-1 rounded-lg font-bold text-sm">
                                    <Icons.Clock /> 1:00 PM
                                </div>
                            </div>
                            <p className="text-gray-500 mb-8 leading-relaxed">Spectacular flight demonstrations featuring macaws, eagles, and parrots.</p>
                            <button className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2">
                                <Icons.Calendar /> Join Event
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Events;