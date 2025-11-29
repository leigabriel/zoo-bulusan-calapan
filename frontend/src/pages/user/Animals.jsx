import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const Icons = {
    Lion: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-white opacity-90">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4zm-3.5 7h7c.28 0 .5.22.5.5s-.22.5-.5.5H12v1.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V14h-2c-.28 0-.5-.22-.5-.5s.22-.5.5-.5z" />
            <circle cx="9" cy="10" r="1.5" /><circle cx="15" cy="10" r="1.5" />
        </svg>
    ),
    Penguin: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-white opacity-90">
            <path d="M12 2a5 5 0 0 0-5 5v7a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5zm-3 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V7zm-2 6H5v5c0 1.1.9 2 2 2h2v-2H7v-5zm10 0h2v5h-2v2h2c1.1 0 2-.9 2-2v-5h-2z" />
        </svg>
    ),
    Elephant: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-white opacity-90">
            <path d="M20 12V7a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v9h2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4h4v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-6h-2zM8 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4 4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
        </svg>
    ),
    Bird: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-white opacity-90">
            <path d="M21 3v2c0 9.627-5.373 14-12 14H7.098c.21.576.503 1.12.87 1.615.61.82 1.48 1.54 2.632 2.155A14.247 14.247 0 0 0 18 24c1.15 0 2.22-.265 3.19-.73.49-.235.93-.52 1.32-.84.28-.23.53-.49.75-.77.19-.24.35-.49.49-.75.25-.49.43-1.02.52-1.57.06-.34.09-.7.09-1.07V3h-3.36zM3 13c2.67 0 5.14-.94 7.12-2.52A12.08 12.08 0 0 0 14.62 3H3v10z" />
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