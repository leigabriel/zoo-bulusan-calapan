import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import InteractiveMap from '../../components/features/zoo-map/InteractiveMap';

const MapPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold text-green-900 mb-6">Interactive Zoo Map</h1>
                        <InteractiveMap />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default MapPage;
