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
            <div className="min-h-screen flex flex-col bg-white overflow-hidden">
                <Header />

                <AIFloatingButton />

                <section className="relative min-h-screen overflow-hidden pt-24 pb-12 sm:pb-16 md:pb-24">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
                        style={{ backgroundImage: `url('https://i.pinimg.com/736x/cf/be/f7/cfbef7ee6088cac3e2e6c01cfe57bfed.jpg')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-transparent" />

                    <FloatingIcon
                        icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>}
                        className="top-32 left-[10%] lg:left-[15%] hidden md:flex"
                        delay={0}
                    />
                    <FloatingIcon
                        icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>}
                        className="top-44 right-[10%] lg:right-[18%] hidden md:flex"
                        delay={0.5}
                    />
                    <FloatingIcon
                        icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" /></svg>}
                        className="top-56 left-[15%] lg:left-[22%] hidden lg:flex"
                        delay={1}
                    />
                    <FloatingIcon
                        icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>}
                        className="top-36 right-[5%] lg:right-[12%] hidden lg:flex"
                        delay={1.5}
                    />
                    <FloatingIcon
                        icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>}
                        className="top-64 left-[5%] lg:left-[10%] hidden lg:flex"
                        delay={2}
                    />

                    <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-32 pb-8 flex flex-col items-center">
                        <div className="flex justify-center mb-6 sm:mb-8">
                            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full shadow-md border border-gray-100">
                                <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">AI-Powered Wildlife Experience</span>
                                <span className="text-base sm:text-lg text-amber-500"><Icons.Lion /></span>
                            </div>
                        </div>

                        <div className="text-center w-full max-w-4xl mx-auto px-4"> <br />
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight sm:leading-none tracking-tight break-words">
                                Welcome to <br />
                                <span
                                    className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent block sm:inline-block"
                                    style={{ fontFamily: '"Segoe Script", "cursive"' }}
                                >
                                    Bulusan Zoo
                                </span>
                            </h1>
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-600 max-w-5xl mx-auto mb-8 sm:mb-10 leading-normal sm:leading-snug px-2 sm:px-4 break-words">
                                Experience wildlife like never before with AI-powered tools that make exploring, planning your visit, and discovering amazing animals effortless and unforgettable.
                            </p>
                        </div>

                        <div className="relative mt-8 sm:mt-12 lg:mt-16 flex justify-center pb-8 w-full px-4 sm:px-6">
                            <div className="relative w-full max-w-7xl aspect-square sm:aspect-[4/3] md:aspect-video rounded-2xl sm:rounded-3xl lg:rounded-4xl overflow-hidden shadow-2xl shadow-gray-900/30 border-2 sm:border-4 border-white/50 bg-gray-100">
                                {animalImages.map((animal, index) => (
                                    <div
                                        key={animal.name}
                                        className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${index === currentAnimalIndex
                                            ? 'opacity-100 scale-100'
                                            : 'opacity-0 scale-105'
                                            }`}
                                    >
                                        <img
                                            src={animal.src}
                                            alt={animal.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-white p-2">
                                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-md">{animal.name}</h3>
                                        </div>
                                    </div>
                                ))}

                                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex gap-1.5 flex-wrap max-w-[120px] sm:max-w-[180px] justify-end">
                                </div>

                                <button
                                    onClick={() => setCurrentAnimalIndex((prev) => (prev - 1 + animalImages.length) % animalImages.length)}
                                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-all duration-200 z-10 min-h-[44px] min-w-[44px]"
                                    aria-label="Previous animal"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button
                                    onClick={() => setCurrentAnimalIndex((prev) => (prev + 1) % animalImages.length)}
                                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-all duration-200 z-10 min-h-[44px] min-w-[44px]"
                                    aria-label="Next animal"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="about-section"
                    className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden relative w-full"
                >
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-12 mb-16 md:mb-24">

                            <div className="lg:col-span-5 flex flex-col justify-center">
                                <div className="flex flex-col gap-6 md:gap-8">
                                    <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-emerald-800/60 break-words">
                                        The Evolution of Bulusan
                                    </span>
                                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light leading-relaxed text-slate-800 max-w-xl break-words">
                                        Founded in 2015, Bulusan Wildlife & Nature Park began as a small conservation initiative in Calapan City. Today, we stand as a testament to modern conservation.
                                    </p>

                                    <div className="flex gap-4 mt-2 sm:mt-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-sm flex items-center justify-center rotate-[-3deg] shadow-md border border-emerald-100">
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        </div>
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-sm flex items-center justify-center rotate-[5deg] shadow-md text-white font-bold text-xs sm:text-sm">
                                            AI
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-3 lg:border-l lg:border-emerald-200 lg:pl-8 xl:pl-12 mt-8 lg:mt-0">
                                <h4 className="text-[10px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-emerald-800/60 mb-6 sm:mb-8 md:mb-10">Metrics</h4>
                                <ul className="space-y-4 sm:space-y-6">
                                    {[
                                        { num: '8+', label: 'Years' },
                                        { num: '10+', label: 'Animals' }
                                    ].map((stat, i) => (
                                        <li key={i} className="group flex items-center justify-between border-b border-emerald-900/10 pb-2 sm:pb-3 cursor-default">
                                            <span className="text-xs sm:text-sm font-semibold text-emerald-900 uppercase tracking-widest">{stat.label}</span>
                                            <span className="text-base sm:text-lg font-light text-slate-700 flex items-center gap-2">
                                                {stat.num} <span className="text-xs text-emerald-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">→</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="lg:col-span-4 flex flex-col justify-between mt-8 lg:mt-0">
                                <div>
                                    <h4 className="text-[10px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-emerald-800/60 mb-6 sm:mb-8 md:mb-10">Information</h4>
                                    <Link to="/about" className="group block min-h-[44px]">
                                        <span className="text-xs sm:text-sm font-bold tracking-[0.1em] sm:tracking-[0.15em] uppercase text-emerald-900 block mb-2 break-words">Learn More About Us —</span>
                                        <div className="h-px w-full bg-emerald-900/20 group-hover:bg-emerald-600 transition-all duration-300"></div>
                                    </Link>
                                </div>

                                <div className="mt-8 sm:mt-12 md:mt-16 relative group w-full">
                                    <img
                                        src="https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&q=80"
                                        alt="Wildlife Conservation"
                                        className="rounded-sm shadow-xl transition-all duration-700 h-40 sm:h-48 md:h-56 lg:h-48 w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-emerald-900/10 mix-blend-multiply rounded-sm"></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 sm:mt-16 md:mt-20 pt-10 sm:pt-12 md:pt-16 border-t border-emerald-900/10 w-full overflow-hidden">
                            <h2 className="text-[12vw] sm:text-[10vw] leading-[0.9] sm:leading-[0.8] font-serif uppercase tracking-tighter text-emerald-950 select-none break-words">
                                Pioneering <span className="inline-block italic font-light text-emerald-800/80">Wildlife</span>
                                <br />
                                Conservation
                            </h2>
                        </div>
                    </div>

                    <div className="absolute bottom-0 right-0 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] bg-white/40 blur-[80px] sm:blur-[120px] rounded-full translate-y-1/2 translate-x-1/4 -z-0"></div>
                </section>

                <section className="relative w-full bg-[#08140e] flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 md:py-24 overflow-hidden">
                    <div className="max-w-[1400px] mx-auto w-full text-center">
                        <h2 className="flex flex-col gap-2 md:gap-4 text-4xl sm:text-5xl md:text-7xl lg:text-[8rem] font-black leading-[1.2] tracking-tighter select-none break-words">
                            <span
                                className="block bg-cover bg-center bg-no-repeat bg-clip-text text-transparent transition-opacity duration-700 ease-in"
                                style={{
                                    backgroundImage: `url('https://images.unsplash.com/photo-1594220862488-117b78382514?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
                                    WebkitTextFillColor: 'transparent',
                                    backgroundSize: '80% auto',
                                    fontFamily: '"Segoe Script", "cursive"'
                                }}
                            >
                                Wild by nature.
                            </span>
                        </h2>
                    </div>
                </section>

                <section id="animals-section" className="py-16 sm:py-20 md:py-24 bg-white overflow-hidden w-full">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-left mb-12 sm:mb-16 md:mb-24">
                            <div className="flex flex-col items-start mb-6 sm:mb-8">
                                <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.5em] font-bold text-gray-400 mb-4 sm:mb-5 break-words">
                                    Wildlife Exhibition
                                </span>
                                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 border border-emerald-100 bg-emerald-50/50 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 uppercase tracking-[0.1em] sm:tracking-[0.2em] whitespace-nowrap">
                                        Our Wildlife
                                    </span>
                                </div>
                            </div>

                            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-light text-gray-900 mb-4 sm:mb-6 md:mb-8 tracking-tighter break-words">
                                Meet Our Animals
                            </h2>

                            <p className="text-sm sm:text-base md:text-lg text-gray-500 max-w-xl font-light leading-relaxed italic break-words">
                                Discover the incredible wildlife roaming freely at our AI-powered nature park.
                            </p>
                        </div>

                        <div className="flex overflow-x-auto lg:grid lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12 pb-8 lg:pb-0 snap-x snap-mandatory scrollbar-hide w-full">
                            {[
                                {
                                    name: 'Monkey',
                                    category: 'Mammal',
                                    location: 'Tropical Exhibit - Forests and grasslands',
                                    image: 'https://images.unsplash.com/photo-1522435229388-6f7a422cd95b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                                },
                                {
                                    name: 'Dove',
                                    category: 'Bird',
                                    location: 'Bird Aviary - Woodlands and urban areas',
                                    image: 'https://images.unsplash.com/photo-1580980407668-6bb45a674180?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                                },
                                {
                                    name: 'Parrot',
                                    category: 'Bird',
                                    location: 'Bird Aviary - Tropical forests',
                                    image: 'https://plus.unsplash.com/premium_photo-1709309432181-bda4a0d17e85?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGFycm90JTIwd2hpdGV8ZW58MHx8MHx8fDA%3D',
                                }

                            ].map((animal, i) => (
                                <div key={i} className="group cursor-pointer min-w-[85vw] sm:min-w-[60vw] md:min-w-[45vw] lg:min-w-0 snap-center">
                                    <div className="relative aspect-[2/3] overflow-hidden mb-6 sm:mb-8 bg-gray-50 w-full">
                                        <img
                                            src={animal.image}
                                            alt={animal.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                                            <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-[8px] sm:text-[9px] font-bold px-2 sm:px-3 py-1 uppercase tracking-widest shadow-sm">
                                                {animal.category}
                                            </span>
                                        </div>
                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
                                    </div>

                                    <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
                                        <h3 className="text-2xl sm:text-3xl font-light text-gray-900 leading-none transition-colors group-hover:text-emerald-800 break-words">
                                            {animal.name}
                                        </h3>

                                        <div className="flex items-start sm:items-center gap-2 text-gray-400">
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-60 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest font-medium italic break-words">{animal.location}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-12 sm:mt-16 md:mt-24 lg:mt-28">
                            <Link
                                to="/animals"
                                className="inline-flex flex-col items-center gap-3 sm:gap-5 group transition-all min-h-[44px]"
                            >
                                <span className="text-gray-900 font-bold uppercase tracking-[0.3em] sm:tracking-[0.5em] text-[9px] sm:text-[10px] break-words">
                                    View All Animals
                                </span>
                                <span className="h-[1px] w-12 sm:w-20 bg-gray-200 group-hover:w-24 sm:group-hover:w-40 group-hover:bg-emerald-500 transition-all duration-700"></span>
                            </Link>
                        </div>
                    </div>
                </section>

                <section id="events-section" className="relative bg-teal-600 p-3 sm:p-4 md:p-6 lg:p-10 min-h-[70vh] sm:min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden w-full">

                    <div
                        className="absolute inset-0 opacity-[0.2]"
                        style={{
                            backgroundImage: `radial-gradient(#ffffff 1.5px, transparent 1.5px)`,
                            backgroundSize: '32px 32px'
                        }}
                    ></div>

                    <div className="relative w-full max-w-7xl min-h-[400px] sm:min-h-[500px] md:aspect-video bg-[#08140e] rounded-xl sm:rounded-2xl md:rounded-sm flex flex-col items-center justify-center overflow-hidden p-6 sm:p-8 md:p-16 lg:p-24 shadow-2xl">

                        <div
                            className="absolute inset-0 pointer-events-none opacity-30"
                            style={{
                                background: `radial-gradient(circle at center, transparent 0%, #08140e 90%), 
                                    repeating-conic-gradient(from 0deg, #555 0deg 0.2deg, transparent 0.2deg 3deg)`
                            }}
                        ></div>

                        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-2xl px-2 sm:px-4">
                            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-medium text-white mb-4 sm:mb-8 md:mb-12 tracking-tight leading-tight md:leading-[1.1] break-words">
                                Wildlife Events
                            </h2>

                            <p className="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed mb-8 sm:mb-10 md:mb-14 px-2 sm:px-4 md:px-0 font-light max-w-lg mx-auto break-words">
                                Experience unforgettable moments with our animals through live feedings and shows.
                            </p>

                            <Link
                                to="/events"
                                className="group flex items-center bg-white rounded-md sm:rounded-[2px] overflow-hidden transition-all active:scale-95 shadow-2xl hover:bg-gray-100 min-h-[44px]"
                            >
                                <span className="px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-teal-700 border-r border-gray-100 whitespace-nowrap">
                                    View All Events
                                </span>
                                <div className="px-3 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4 bg-gray-50 flex items-center justify-center min-h-[44px] min-w-[44px]">
                                    <svg
                                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 transition-transform group-hover:translate-x-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </Link>
                        </div>

                        <div className="absolute top-4 left-4 sm:top-8 sm:left-8 md:top-12 md:left-12 opacity-20">
                            <div className="w-8 sm:w-16 md:w-24 h-[1px] bg-white"></div>
                        </div>
                        <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 md:bottom-12 md:right-12 opacity-20">
                            <div className="w-8 sm:w-16 md:w-24 h-[1px] bg-white"></div>
                        </div>
                    </div>
                </section>

                <section id="faq-section" className="py-16 sm:py-20 md:py-24 bg-white w-full">
                    {(() => {
                        const [activeIndex, setActiveIndex] = React.useState(null);
                        const faqData = [
                            {
                                question: "What are the operating hours of Bulusan Zoo?",
                                answer: "Bulusan Zoo is open daily from 8:00 AM to 5:00 PM. We recommend arriving early to fully experience all our wildlife exhibits and AI-powered features."
                            },
                            {
                                question: "How can I purchase/reserve tickets for my visit?",
                                answer: "Tickets can be purchased/reserved directly through our website or at the main entrance gate. We accept cash only, there's no digital payment for now."
                            },
                            {
                                question: "Is there a special rate for local residents?",
                                answer: "Yes, entrance is free for local residents of Bulusan Calapan City. Please bring a valid government-issued ID or proof of residency to avail of this benefit."
                            },
                            {
                                question: "Are animal feeding sessions open to the public?",
                                answer: "We have scheduled interactive feeding sessions and wildlife shows throughout the day. Check the 'Events' section for the latest daily schedule."
                            },
                            {
                                question: "Is the park accessible for persons with disabilities?",
                                answer: "Yes, Bulusan Zoo features paved pathways suitable for wheelchairs and priority access for PWDs and senior citizens at all major attractions."
                            },
                            {
                                question: "Does the zoo support conservation programs?",
                                answer: "Absolutely. A portion of every ticket sale goes directly toward our local wildlife rescue and rehabilitation initiatives in the region."
                            }
                        ];

                        return (
                            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                                <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold text-gray-900 mb-8 sm:mb-10 md:mb-12 tracking-tight break-words">
                                    FAQ
                                </h2>

                                <div className="border-b border-gray-200">
                                    {faqData.map((item, index) => (
                                        <div key={index} className="border-t border-gray-200">
                                            <button
                                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                                className="w-full py-5 sm:py-6 md:py-9 flex items-center justify-between text-left group transition-all min-h-[44px]"
                                            >
                                                <span className="text-base sm:text-lg md:text-2xl lg:text-3xl font-medium text-gray-800 pr-4 sm:pr-8 leading-snug break-words">
                                                    {item.question}
                                                </span>
                                                <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 border border-gray-200 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-300 min-w-[32px] sm:min-w-[40px] ${activeIndex === index ? 'bg-gray-900 border-gray-900' : 'bg-white'}`}>
                                                    <svg
                                                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${activeIndex === index ? 'text-white rotate-180' : 'text-gray-400'}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </button>

                                            <div
                                                className={`overflow-hidden transition-all duration-500 ease-in-out ${activeIndex === index ? 'max-h-[500px] sm:max-h-96 opacity-100 pb-6 sm:pb-8' : 'max-h-0 opacity-0'}`}
                                            >
                                                <p className="text-gray-500 text-sm sm:text-base md:text-xl lg:text-2xl leading-relaxed max-w-4xl break-words">
                                                    {item.answer}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </section>

                <section id="tickets-section" className="py-16 sm:py-20 md:py-24 bg-white w-full">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-10 sm:mb-12 md:mb-14">
                            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 uppercase block mb-2 sm:mb-3 break-words">
                                PRICING
                            </span>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-medium text-gray-900 leading-tight break-words">
                                Choose the right ticket for you
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 border border-gray-300 overflow-hidden shadow-sm mb-8 sm:mb-10 md:mb-12 rounded-lg lg:rounded-none">
                            {[
                                {
                                    label: 'ADULT',
                                    price: '₱40',
                                    desc: 'Ages 18-59. Perfect for those who want the full experience.'
                                },
                                {
                                    label: 'CHILD',
                                    price: '₱20',
                                    desc: 'Ages 5-17. Launch your first visit and start exploring within minutes.'
                                },
                                {
                                    label: 'RESIDENT',
                                    price: 'FREE',
                                    desc: 'Exclusive for local residents. End-to-end community access.'
                                }
                            ].map((t, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col p-6 sm:p-8 md:p-9 bg-white border-b lg:border-r lg:border-b-0 border-gray-300 last:border-b-0 lg:last:border-r-0"
                                >
                                    <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.1em] sm:tracking-[0.15em] text-gray-400 uppercase mb-4 sm:mb-6 break-words">
                                        {t.label}
                                    </span>

                                    <div className="text-3xl sm:text-4xl md:text-[44px] font-medium text-gray-900 leading-none mb-4 sm:mb-6 break-words">
                                        {t.price}<span className="text-base sm:text-lg text-gray-400 font-normal"></span>
                                    </div>

                                    <div className="h-[1px] w-full bg-gray-100 mb-6 sm:mb-8" />

                                    <p className="text-sm sm:text-base md:text-[18px] leading-relaxed text-gray-500 min-h-0 lg:min-h-[80px] break-words">
                                        {t.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <Link to="/reservations">
                                <button className="px-8 py-3.5 sm:px-10 sm:py-4 md:px-12 md:py-4 bg-gray-900 text-white text-xs sm:text-sm font-bold tracking-wider sm:tracking-widest uppercase rounded-full hover:bg-gray-800 transition-all duration-300 shadow-lg shadow-gray-200 min-h-[44px]">
                                    Reserve Now!
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