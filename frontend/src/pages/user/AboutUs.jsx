import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <section className="text-white py-20 text-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(45,90,39,0.85), rgba(58,140,125,0.85)), url(https://images.unsplash.com/photo-1550358864-518f202c02ba)' }}>
                <h1 className="text-5xl font-bold mb-6">About Bulusan Park Zoo</h1>
                <p className="text-xl max-w-2xl mx-auto">Pioneering the future of wildlife conservation through AI-powered innovation.</p>
            </section>

            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-green-800 mb-6">Our Story</h2>
                        <p className="text-gray-700 mb-4 text-lg leading-relaxed">
                            Founded in 2015, Bulusan Wildlife & Nature Park began as a small conservation initiative in Calapan City. Today, we stand as a testament to modern conservation, housing over 250 animals across 45 species.
                        </p>
                        <p className="text-gray-700 text-lg leading-relaxed">
                            Through our innovative AI systems, we monitor animal health and provide real-time educational content to visitors.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <div className="grid grid-cols-2 gap-6 text-center">
                            {[
                                { num: '8', label: 'Years' }, { num: '250+', label: 'Animals' },
                                { num: '45', label: 'Species' }, { num: '15', label: 'Programs' }
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className="text-4xl font-bold text-green-700 mb-1">{stat.num}</div>
                                    <div className="text-teal-600 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AboutUs;