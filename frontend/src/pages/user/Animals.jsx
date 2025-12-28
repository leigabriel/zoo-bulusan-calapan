import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// Better recognizable animal icons
const Icons = {
    Lion: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor" className="w-20 h-20 text-white opacity-95">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="32" cy="36" r="16" fill="none" stroke="currentColor" strokeWidth="2.5"/>
            <ellipse cx="26" cy="30" rx="3" ry="4"/>
            <ellipse cx="38" cy="30" rx="3" ry="4"/>
            <ellipse cx="32" cy="38" rx="4" ry="3"/>
            <path d="M28 44 Q32 48 36 44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 20 Q16 12 24 16" fill="none" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M56 20 Q48 12 40 16" fill="none" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M12 32 Q8 24 14 18" fill="none" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M52 32 Q56 24 50 18" fill="none" stroke="currentColor" strokeWidth="2.5"/>
        </svg>
    ),
    Penguin: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor" className="w-20 h-20 text-white opacity-95">
            <ellipse cx="32" cy="38" rx="16" ry="22" fill="none" stroke="currentColor" strokeWidth="3"/>
            <ellipse cx="32" cy="38" rx="10" ry="16" fill="currentColor" opacity="0.3"/>
            <circle cx="32" cy="18" r="12" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="27" cy="16" r="2.5"/>
            <circle cx="37" cy="16" r="2.5"/>
            <path d="M29 22 L32 26 L35 22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 42 Q8 38 10 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M50 42 Q56 38 54 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <ellipse cx="24" cy="58" rx="4" ry="2"/>
            <ellipse cx="40" cy="58" rx="4" ry="2"/>
        </svg>
    ),
    Elephant: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor" className="w-20 h-20 text-white opacity-95">
            <ellipse cx="34" cy="32" rx="22" ry="18" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="16" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="13" cy="22" r="2.5"/>
            <path d="M10 28 Q6 36 8 44 Q10 48 14 46" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M6 18 Q2 14 4 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M26 18 Q30 12 36 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <ellipse cx="22" cy="52" rx="3" ry="6"/>
            <ellipse cx="32" cy="52" rx="3" ry="6"/>
            <ellipse cx="42" cy="52" rx="3" ry="6"/>
            <ellipse cx="52" cy="52" rx="3" ry="6"/>
        </svg>
    ),
    Bird: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor" className="w-20 h-20 text-white opacity-95">
            <ellipse cx="32" cy="32" rx="18" ry="14" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="20" cy="24" r="8" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="18" cy="22" r="2"/>
            <path d="M12 26 L4 24 L6 28 L12 26" fill="currentColor"/>
            <path d="M50 32 Q58 28 62 32 Q58 36 50 32" fill="none" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M50 32 Q58 32 62 28" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M50 32 Q58 36 62 36" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M28 46 L24 56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M36 46 L40 56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <ellipse cx="32" cy="36" rx="6" ry="4" fill="currentColor" opacity="0.3"/>
        </svg>
    )
};

const colorVariants = {
    amber: 'from-amber-400 to-amber-600',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    red: 'from-red-400 to-red-600'
};

const Animals = () => {
    const [filter, setFilter] = useState('All');

    const animals = [
        { name: 'African Lions', category: 'Mammals', loc: 'Savanna', status: 'Live', Icon: Icons.Lion, color: 'amber' },
        { name: 'Penguins', category: 'Birds', loc: 'Cold Water', status: 'Active', Icon: Icons.Penguin, color: 'blue' },
        { name: 'Asian Elephants', category: 'Mammals', loc: 'Forest', status: 'Active', Icon: Icons.Elephant, color: 'green' },
        { name: 'Tropical Birds', category: 'Birds', loc: 'Aviary', status: 'Live', Icon: Icons.Bird, color: 'red' }
    ];

    const filteredAnimals = filter === 'All' ? animals : animals.filter(a => a.category === filter);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <section className="relative text-white py-24 text-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(45,90,39,0.85), rgba(58,140,125,0.85)), url(https://images.unsplash.com/photo-1548013146-72479768bada)' }}>
                <div className="relative z-10 animate-fade-in-up">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">Meet Our Animals</h1>
                    <p className="text-xl max-w-2xl mx-auto opacity-90 font-light">Discover the incredible wildlife roaming freely at our AI-powered nature park.</p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-16 flex-grow">
                <div className="flex flex-wrap justify-center gap-3 mb-16">
                    {['All', 'Mammals', 'Birds'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-8 py-3 rounded-full font-semibold transition-all transform hover:-translate-y-1 shadow-sm ${filter === cat
                                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                                    : 'bg-white text-green-800 hover:bg-green-50 border border-green-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredAnimals.map((animal, idx) => (
                        <div key={idx} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
                            <div className={`h-64 bg-gradient-to-br ${colorVariants[animal.color]} flex items-center justify-center relative overflow-hidden`}>
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="transform group-hover:scale-110 transition duration-500">
                                    <animal.Icon />
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-2xl mb-1">{animal.name}</h3>
                                        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-600">
                                                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                            </svg>
                                            {animal.loc}
                                        </div>
                                    </div>
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        {animal.status}
                                    </span>
                                </div>
                                <button className="w-full mt-2 py-4 rounded-xl bg-gray-50 text-green-800 font-bold hover:bg-green-600 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2 group-hover:shadow-md">
                                    View Details
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Animals;