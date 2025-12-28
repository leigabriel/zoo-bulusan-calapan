import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import InteractiveMap from '../../components/features/zoo-map/InteractiveMap';

const MapPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <section className="relative text-white py-24 text-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(45,90,39,0.85), rgba(58,140,125,0.85)), url(https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a)' }}>
                <div className="relative z-10 animate-fade-in-up">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">Interactive Zoo Map</h1>
                    <p className="text-xl max-w-2xl mx-auto opacity-90 font-light">Navigate our park with ease and discover all the amazing exhibits.</p>
                </div>
            </section>

            <main className="flex-1 py-16">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center gap-3 mb-12">
                        <span className="h-px w-12 bg-green-200"></span>
                        <h2 className="text-3xl font-bold text-green-800 tracking-wide uppercase">Park Layout</h2>
                        <span className="h-px w-12 bg-green-200"></span>
                    </div>
                    <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
                        <InteractiveMap />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default MapPage;
