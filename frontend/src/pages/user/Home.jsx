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

                <section className="relative min-h-screen flex flex-col items-center pt-54 sm:pt-34 md:pt-60 pb-12 bg-[#ebebeb] text-[#212631] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full opacity-60"
                        style={{ backgroundImage: `url('https://i.pinimg.com/736x/cf/be/f7/cfbef7ee6088cac3e2e6c01cfe57bfed.jpg')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#ebebeb]/20 via-[#ebebeb]/30 to-[#ebebeb]/40" />

                    <div className="relative z-10 flex flex-col items-center text-center w-full px-4 sm:px-6 pt-12 sm:pt-0">
                        <h1 className="flex flex-col items-center w-full">
                            <span className="text-4xl sm:text-[4rem] md:text-[5rem] lg:text-[6rem] font-normal leading-none tracking-wide">
                                Welcome to
                            </span>
                            <span
                                className="text-[2.75rem] sm:text-[5rem] md:text-[6.5rem] lg:text-[7.5rem] italic uppercase leading-[0.9] tracking-wide mt-1 sm:mt-1"
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            >
                                Bulusan Zoo
                            </span>
                        </h1>

                        <p className="mt-4 sm:mt-6 max-w-[90%] sm:max-w-2xl lg:max-w-3xl tracking-tight text-xl sm:text-xl md:text-[1.35rem] sm:font-medium leading-[1.2] sm:leading-[1.4] px-2 sm:px-4">
                            Experience wildlife like never before with AI-powered tools that make exploring, planning your visit, and discovering amazing animals effortless and unforgettable.
                        </p>

                        <div className="flex justify-center gap-6 sm:gap-20 md:gap-32 mt-10 sm:mt-14 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg tracking-widest uppercase font-medium">
                            <Link to="/animals" className="hover:opacity-70 transition-opacity">Animals</Link>
                            <Link to="/plants" className="hover:opacity-70 transition-opacity">Plants</Link>
                            <Link to="/events" className="hover:opacity-70 transition-opacity">Events</Link>
                        </div>

                        <div className="w-full max-w-7xl rounded-xl border-4 border-[#ebebeb] bg-[#1c1e26] aspect-[4/5] sm:aspect-video relative overflow-hidden">
                            {animalImages.map((animal, index) => (
                                <div
                                    key={animal.name}
                                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentAnimalIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                >
                                    <img
                                        src={animal.src}
                                        alt={animal.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4 sm:bottom-10 sm:left-10 text-white p-2">
                                        <h3 className="text-xl sm:text-4xl md:text-5xl font-bold drop-shadow-lg" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                            {animal.name}
                                        </h3>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setCurrentAnimalIndex((prev) => (prev - 1 + animalImages.length) % animalImages.length)}
                                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-all duration-200 z-20"
                                aria-label="Previous animal"
                            >
                                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={() => setCurrentAnimalIndex((prev) => (prev + 1) % animalImages.length)}
                                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-all duration-200 z-20"
                                aria-label="Next animal"
                            >
                                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                </section>

                <section className="bg-[#ebebeb] min-h-[80vh] flex items-center px-6 py-20 md:px-16 md:py-32 w-full">
                    <div className="max-w-[1500px] mx-auto w-full flex flex-col">
                        <h2 className="text-[#212631] text-2xl md:text-3xl lg:text-4xl uppercase tracking-wide mb-16 md:mb-24">
                            About Bulusan Zoo
                        </h2>
                        <p className="text-[#212631] text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.2] md:leading-[1.1] tracking-tight mb-16 md:mb-24">
                            Founded in 2015, Bulusan Wildlife & Nature Park began as a small conservation initiative in Calapan City. Today, we stand as a testament to modern conservation.
                        </p>
                        <div className="self-end">
                            <Link
                                to="/about"
                                className="text-[#ebebeb] bg-green-700 font-light hover:underline text-2xl md:text-4xl lg:text-5xl hover:text-gray-200 transition-colors duration-300"
                            >
                                more about us
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="w-full bg-[#ebebeb] text-[#212631] border-1 border-[#d1d1d1]">
                    <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#d1d1d1]">

                            <article className="py-16 md:py-24 md:pr-12 lg:pr-16 flex flex-col h-full">
                                <div className="text-[#212631]/60 text-xs md:text-sm font-mono font-medium tracking-widest mb-6 lg:mb-8">
                                    <span className="text-[#212631]/40 mr-2">•</span>01
                                </div>
                                <h3 className="text-[1.75rem] md:text-3xl lg:text-4xl font-bold text-[#212631] mb-4 lg:mb-6 tracking-tight">
                                    Philippine Deer
                                </h3>
                                <p className="text-base md:text-lg lg:text-xl text-[#212631]/80 leading-relaxed mb-8 lg:mb-12">
                                    Discover the grace of the endangered Philippine Brown Deer, roaming freely in our carefully reconstructed forest habitat designed to mimic their natural woodland environment.
                                </p>
                                <button className="mt-auto self-start border border-[#212631]/30 text-[#212631] text-xs md:text-sm font-bold tracking-widest uppercase px-6 py-3 md:px-8 md:py-4 hover:bg-[#212631] hover:text-[#ebebeb] transition-all duration-300">
                                    Learn More
                                </button>
                            </article>

                            <article className="py-16 md:py-24 md:px-12 lg:px-16 flex flex-col h-full">
                                <div className="text-[#212631]/60 text-xs md:text-sm font-mono font-medium tracking-widest mb-6 lg:mb-8">
                                    <span className="text-[#212631]/40 mr-2">•</span>02
                                </div>
                                <h3 className="text-[1.75rem] md:text-3xl lg:text-4xl font-bold text-[#212631] mb-4 lg:mb-6 tracking-tight">
                                    Visayan Warty Pig
                                </h3>
                                <p className="text-base md:text-lg lg:text-xl text-[#212631]/80 leading-relaxed mb-8 lg:mb-12">
                                    Observe the highly intelligent and critically endangered Visayan Warty Pigs. Our conservation breeding program is dedicated to protecting this unique native species.
                                </p>
                                <button className="mt-auto self-start border border-[#212631]/30 text-[#212631] text-xs md:text-sm font-bold tracking-widest uppercase px-6 py-3 md:px-8 md:py-4 hover:bg-[#212631] hover:text-[#ebebeb] transition-all duration-300">
                                    Learn More
                                </button>
                            </article>

                            <article className="py-16 md:py-24 md:pl-12 lg:pl-16 flex flex-col h-full">
                                <div className="text-[#212631]/60 text-xs md:text-sm font-mono font-medium tracking-widest mb-6 lg:mb-8">
                                    <span className="text-[#212631]/40 mr-2">•</span>03
                                </div>
                                <h3 className="text-[1.75rem] md:text-3xl lg:text-4xl font-bold text-[#212631] mb-4 lg:mb-6 tracking-tight">
                                    Sailfin Lizard
                                </h3>
                                <p className="text-base md:text-lg lg:text-xl text-[#212631]/80 leading-relaxed mb-8 lg:mb-12">
                                    Spot the prehistoric-looking Philippine Sailfin Lizard basking near our replicated river ecosystems, showcasing the incredible reptilian biodiversity of the region.
                                </p>
                                <button className="mt-auto self-start border border-[#212631]/30 text-[#212631] text-xs md:text-sm font-bold tracking-widest uppercase px-6 py-3 md:px-8 md:py-4 hover:bg-[#212631] hover:text-[#ebebeb] transition-all duration-300">
                                    Learn More
                                </button>
                            </article>

                        </div>
                    </div>
                </section>

                <section id="events-section" className="relative bg-[#ebebeb] p-3 sm:p-4 md:p-6 lg:p-10 min-h-[10vh] sm:min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden w-full">

                    <div className="relative w-full max-w-[1500px] min-h-[400px] sm:min-h-[500px] md:aspect-video bg-[#08140e] rounded-xl sm:rounded-2xl md:rounded-sm flex flex-col items-center justify-center overflow-hidden p-6 sm:p-8 md:p-16 lg:p-24 shadow-2xl">

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
                            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1500px]">
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