import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import '../../App.css'

const animalImages = [
    { src: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=1200&q=80', name: 'Monkey' },
    { src: 'https://images.unsplash.com/photo-1580980407668-6bb45a674180?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', name: 'Dove' },
    { src: 'https://plus.unsplash.com/premium_photo-1673454201378-3867e051dca7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGFycm90fGVufDB8fDB8fHww', name: 'Parrot' },
    { src: 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=1200&q=80', name: 'Eagle' },
    { src: 'https://images.unsplash.com/photo-1709025220742-6cbe1645abe5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fG9zdHJpY2h8ZW58MHx8MHx8fDA%3D', name: 'Ostrich' },
    { src: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=1200&q=80', name: 'Deer' },
    { src: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1200&q=80', name: 'Rabbit' },
    { src: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=1200&q=80', name: 'Tiger' },
    { src: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1200&q=80', name: 'Horse' },
    { src: 'https://images.unsplash.com/photo-1522231796108-23cbe9982a9c?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', name: 'Donkey' }
];

const FloatingIcon = ({ icon, className, delay = 0 }) => (
    <div
        className={`absolute bg-white rounded-2xl shadow-lg p-3 animate-float ${className}`}
        style={{ animationDelay: `${delay}s` }}
    >
        {icon}
    </div>
);

const Icons = {
    Lion: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
    ),
    Ticket: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
        </svg>
    )
};

const Home = () => {
    const [currentAnimalIndex, setCurrentAnimalIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentAnimalIndex((prev) => (prev + 1) % animalImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <ReactLenis root>
            <div className="min-h-screen flex flex-col bg-white">
                <Header />

                <AIFloatingButton />

                <section className="relative min-h-screen overflow-hidden pt-24">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url('https://i.pinimg.com/736x/cf/be/f7/cfbef7ee6088cac3e2e6c01cfe57bfed.jpg')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-transparent" />

                    <FloatingIcon
                        icon={<svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>}
                        className="top-32 left-[15%] hidden lg:flex"
                        delay={0}
                    />
                    <FloatingIcon
                        icon={<svg className="w-6 h-6 text-teal-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>}
                        className="top-44 right-[18%] hidden lg:flex"
                        delay={0.5}
                    />
                    <FloatingIcon
                        icon={<svg className="w-6 h-6 text-cyan-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" /></svg>}
                        className="top-56 left-[22%] hidden lg:flex"
                        delay={1}
                    />
                    <FloatingIcon
                        icon={<svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>}
                        className="top-36 right-[12%] hidden lg:flex"
                        delay={1.5}
                    />
                    <FloatingIcon
                        icon={<svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>}
                        className="top-64 left-[10%] hidden lg:flex"
                        delay={2}
                    />

                    <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-35 pb-8">
                        <div className="flex justify-center mb-8">
                            <div className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-md border border-gray-100">
                                <span className="text-sm font-medium text-gray-700">AI-Powered Wildlife Experience</span>
                                <span className="text-lg text-amber-500"><Icons.Lion /></span>
                            </div>
                        </div>

                        <div className="text-center max-w-4xl mx-auto">
                            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                                Welcome to
                                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text italic text-transparent"> Bulusan Zoo</span>
                            </h1>
                            <p className="text-lg md:text-2xl text-gray-600 max-w-5xl mx-auto mb-10 leading-snug">
                                Experience wildlife like never before with AI-powered tools that make exploring, planning your visit, and discovering amazing animals effortless and unforgettable.
                            </p>

                            {/* <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link to="/tickets" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full font-semibold text-base flex items-center gap-3 transition-all duration-200 shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:-translate-y-0.5">
                                    <Icons.Ticket />
                                    <span>Plan Your Visit</span>
                                </Link>
                                <button className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 px-6 py-4 rounded-full font-medium text-base flex items-center gap-3 transition-all duration-200 border border-gray-200 shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                    <span>Watch Video</span>
                                </button>
                            </div> */}
                        </div>

                        <div className="relative mt-16 flex justify-center pb-8">
                            <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-gray-900/30 border-4 border-white/50">
                                {animalImages.map((animal, index) => (
                                    <div
                                        key={animal.name}
                                        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentAnimalIndex
                                            ? 'opacity-100 scale-100'
                                            : 'opacity-0 scale-105'
                                            }`}
                                    >
                                        <img
                                            src={animal.src}
                                            alt={animal.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                        <div className="absolute bottom-6 left-6 text-white">
                                            <h3 className="text-3xl font-bold">{animal.name}</h3>
                                        </div>
                                    </div>
                                ))}

                                <div className="absolute bottom-6 right-6 flex gap-1.5 flex-wrap max-w-[180px] justify-end">
                                    {animalImages.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentAnimalIndex(index)}
                                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentAnimalIndex
                                                ? 'w-8 bg-white'
                                                : 'bg-white/40 hover:bg-white/70'
                                                }`}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentAnimalIndex((prev) => (prev - 1 + animalImages.length) % animalImages.length)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-all duration-200"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button
                                    onClick={() => setCurrentAnimalIndex((prev) => (prev + 1) % animalImages.length)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-all duration-200"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="about-section"
                    className="py-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden relative"
                >
                    <div className="container mx-auto px-6 lg:px-12 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">

                            <div className="lg:col-span-5">
                                <div className="flex flex-col gap-8">
                                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-emerald-800/60">
                                        The Evolution of Bulusan
                                    </span>
                                    <p className="text-2xl md:text-3xl font-light leading-snug text-slate-800 max-w-xl">
                                        Founded in 2015, Bulusan Wildlife & Nature Park began as a small conservation initiative in Calapan City. Today, we stand as a testament to modern conservation.
                                    </p>

                                    <div className="flex gap-4 mt-2">
                                        <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center rotate-[-3deg] shadow-md border border-emerald-100">
                                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        </div>
                                        <div className="w-12 h-12 bg-emerald-600 rounded-sm flex items-center justify-center rotate-[5deg] shadow-md text-white font-bold text-xs">
                                            AI
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-3 lg:border-l lg:border-emerald-200 lg:pl-12">
                                <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-emerald-800/60 mb-10">Metrics</h4>
                                <ul className="space-y-6">
                                    {[
                                        { num: '8+', label: 'Years' },
                                        { num: '10+', label: 'Animals' }
                                    ].map((stat, i) => (
                                        <li key={i} className="group flex items-center justify-between border-b border-emerald-900/10 pb-3 cursor-default">
                                            <span className="text-xs font-semibold text-emerald-900 uppercase tracking-widest">{stat.label}</span>
                                            <span className="text-lg font-light text-slate-700 flex items-center gap-2">
                                                {stat.num} <span className="text-xs text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="lg:col-span-4 flex flex-col justify-between">
                                <div>
                                    <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-emerald-800/60 mb-10">Information</h4>
                                    <Link to="/about" className="group block">
                                        <span className="text-xs font-bold tracking-[0.15em] uppercase text-emerald-900 block mb-2">Learn More About Us —</span>
                                        <div className="h-px w-full bg-emerald-900/20 group-hover:bg-emerald-600 transition-all duration-300"></div>
                                    </Link>
                                </div>

                                <div className="mt-16 relative group">
                                    <img
                                        src="https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&q=80"
                                        alt="Wildlife Conservation"
                                        className="rounded-sm shadow-xl transition-all duration-700 h-48 w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-emerald-900/10 mix-blend-multiply rounded-sm"></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 pt-16 border-t border-emerald-900/10">
                            <h2 className="text-[10vw] leading-[0.8] font-serif uppercase tracking-tighter text-emerald-950 select-none">
                                Pioneering <span className="inline-block italic font-light text-emerald-800/80">Wildlife</span>
                                <br />
                                Conservation
                            </h2>
                        </div>
                    </div>

                    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-white/40 blur-[120px] rounded-full translate-y-1/2 translate-x-1/4 -z-0"></div>
                </section>

                <section className="relative w-full bg-[#08140e] flex items-center justify-center px-4 sm:px-8 md:px-12 py-16 md:py-24 overflow-hidden">
                    <div className="max-w-[1400px] mx-auto w-full text-center">
                        <h2 className="flex flex-col gap-2 md:gap-4 text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] font-black leading-[0.95] tracking-tighter uppercase select-none">
                            <span
                                className="block bg-cover bg-center bg-no-repeat bg-clip-text text-transparent transition-opacity duration-700 ease-in"
                                style={{
                                    backgroundImage: `url('https://images.unsplash.com/photo-1594220862488-117b78382514?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
                                    WebkitTextFillColor: 'transparent',
                                    backgroundSize: '120% auto'
                                }}
                            >
                                Wild by nature.
                            </span>
                        </h2>
                    </div>
                </section>

                <section id="animals-section" className="py-24 bg-white overflow-hidden">
                    <div className="container mx-auto px-6 lg:px-12">
                        <div className="text-left mb-24">
                            <div className="flex flex-col items-start mb-8">
                                <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-gray-400 mb-5">
                                    Wildlife Exhibition
                                </span>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-emerald-100 bg-emerald-50/50 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.2em]">
                                        Our Wildlife
                                    </span>
                                </div>
                            </div>

                            <h2 className="text-5xl md:text-7xl font-light text-gray-900 mb-8 tracking-tighter">
                                Meet Our Animals
                            </h2>

                            <p className="text-gray-500 text-lg max-w-xl font-light leading-relaxed italic">
                                Discover the incredible wildlife roaming freely at our AI-powered nature park.
                            </p>
                        </div>

                        <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-8 md:gap-12 pb-8 md:pb-0 snap-x snap-mandatory scrollbar-hide">
                            {[
                                {
                                    name: 'African Lions',
                                    category: 'Mammals',
                                    location: 'Savanna Zone',
                                    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80',
                                },
                                {
                                    name: 'Asian Elephants',
                                    category: 'Mammals',
                                    location: 'Forest Habitat',
                                    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80',
                                },
                                {
                                    name: 'Tropical Birds',
                                    category: 'Birds',
                                    location: 'Aviary',
                                    image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&q=80',
                                }
                            ].map((animal, i) => (
                                <div key={i} className="group cursor-pointer min-w-[85vw] md:min-w-0 snap-center">
                                    <div className="relative aspect-[2/3] overflow-hidden mb-8 bg-gray-50">
                                        <img
                                            src={animal.image}
                                            alt={animal.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute top-6 right-6">
                                            <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-[9px] font-bold px-3 py-1 uppercase tracking-widest shadow-sm">
                                                {animal.category}
                                            </span>
                                        </div>
                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-light text-gray-900 leading-none transition-colors group-hover:text-emerald-800">
                                            {animal.name}
                                        </h3>

                                        <div className="flex items-center gap-2 text-gray-400">
                                            <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-[11px] uppercase tracking-widest font-medium italic">{animal.location}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-28">
                            <Link
                                to="/animals"
                                className="inline-flex flex-col items-center gap-5 group transition-all"
                            >
                                <span className="text-gray-900 font-bold uppercase tracking-[0.5em] text-[10px]">
                                    View All Animals
                                </span>
                                <span className="h-[1px] w-20 bg-gray-200 group-hover:w-40 group-hover:bg-emerald-500 transition-all duration-700"></span>
                            </Link>
                        </div>
                    </div>
                </section>

                <section id="events-section" className="relative bg-teal-600 p-3 sm:p-6 md:p-10 min-h-screen flex items-center justify-center overflow-hidden">

                    <div
                        className="absolute inset-0 opacity-[0.2]"
                        style={{
                            backgroundImage: `radial-gradient(#ffffff 1.5px, transparent 1.5px)`,
                            backgroundSize: '32px 32px'
                        }}
                    ></div>

                    <div className="absolute inset-0 pointer-events-none opacity-[0.25] mix-blend-overlay">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <filter id="sectionNoise">
                                <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch" />
                            </filter>
                            <rect width="100%" height="100%" filter="url(#sectionNoise)" />
                        </svg>
                    </div>

                    <div className="relative w-full max-w-7xl min-h-[600px] md:aspect-video bg-[#08140e] rounded-sm flex flex-col items-center justify-center overflow-hidden p-6 sm:p-12 md:p-24 shadow-2xl">

                        <div
                            className="absolute inset-0 pointer-events-none opacity-30"
                            style={{
                                background: `radial-gradient(circle at center, transparent 0%, #08140e 90%), 
                                    repeating-conic-gradient(from 0deg, #555 0deg 0.2deg, transparent 0.2deg 3deg)`
                            }}
                        ></div>

                        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-2xl">
                            <h2 className="text-3xl sm:text-5xl md:text-7xl font-medium text-white mb-6 md:mb-12 tracking-tight leading-[1.1]">
                                Wildlife Events
                            </h2>

                            <p className="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed mb-10 md:mb-14 px-4 sm:px-0 font-light">
                                Experience unforgettable moments with our animals through live feedings and shows.
                            </p>

                            <Link
                                to="/events"
                                className="group flex items-center bg-white rounded-[2px] overflow-hidden transition-all active:scale-95 shadow-2xl hover:bg-gray-100"
                            >
                                <span className="px-5 py-3.5 sm:px-8 sm:py-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-teal-700 border-r border-gray-100">
                                    View All Events
                                </span>
                                <div className="px-4 py-3.5 sm:px-5 sm:py-4 bg-gray-50 flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-teal-700 transition-transform group-hover:translate-x-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </Link>
                        </div>

                        <div className="absolute top-6 left-6 sm:top-12 sm:left-12 opacity-20">
                            <div className="w-12 sm:w-24 h-[1px] bg-white"></div>
                        </div>
                        <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 opacity-20">
                            <div className="w-12 sm:w-24 h-[1px] bg-white"></div>
                        </div>
                    </div>
                </section>

                <section id="tickets-section" className="py-24 bg-white">
                    <div className="container mx-auto px-6 lg:px-12">
                        <div className="mb-14">
                            <span className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase block mb-3">
                                PRICING
                            </span>
                            <h2 className="text-[42px] font-medium text-gray-900 leading-tight">
                                Choose the right ticket for you
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 border border-gray-300 overflow-hidden shadow-sm mb-12">
                            {[
                                {
                                    label: 'SENIOR',
                                    price: '₱80',
                                    desc: 'Ages 60+ with valid ID. Priority access included for our elder community.'
                                },
                                {
                                    label: 'ADULT',
                                    price: '₱100',
                                    desc: 'Ages 18-59. Perfect for those who want the full experience.'
                                },
                                {
                                    label: 'CHILD',
                                    price: '₱50',
                                    desc: 'Ages 5-17. Launch your first visit and start exploring within minutes.'
                                },
                                {
                                    label: 'STUDENT',
                                    price: '₱70',
                                    desc: 'Valid for high school and college students with valid academic ID.'
                                },
                                {
                                    label: 'RESIDENT',
                                    price: 'FREE',
                                    desc: 'Exclusive for local residents. End-to-end community access.'
                                }
                            ].map((t, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col p-9 bg-white border-r border-b border-gray-300 last:border-r-0 lg:border-b-0"
                                >
                                    <span className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-6">
                                        {t.label}
                                    </span>

                                    <div className="text-[44px] font-medium text-gray-900 leading-none mb-6">
                                        {t.price}<span className="text-lg text-gray-400 font-normal"></span>
                                    </div>

                                    <div className="h-[1px] w-full bg-gray-100 mb-8" />

                                    <p className="text-[14px] leading-relaxed text-gray-500 min-h-[80px]">
                                        {t.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <Link to="/tickets">
                                <button className="px-12 py-4 bg-gray-900 text-white text-sm font-bold tracking-widest uppercase rounded-full hover:bg-gray-800 transition-all duration-300 shadow-lg shadow-gray-200">
                                    Book Your Tickets
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        </ReactLenis>
    );
};

export default Home;