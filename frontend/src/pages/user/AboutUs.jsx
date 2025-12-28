import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const Icons = {
    Calendar: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-600">
            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    Paw: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-600">
            <circle cx="11" cy="4" r="2"/>
            <circle cx="18" cy="8" r="2"/>
            <circle cx="20" cy="16" r="2"/>
            <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
        </svg>
    ),
    Globe: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-600">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM6.262 6.072a8.25 8.25 0 1010.562-.766 4.5 4.5 0 01-1.318 1.357L14.25 7.5l.165.33a.809.809 0 01-1.086 1.085l-.604-.302a1.125 1.125 0 00-1.298.21l-.132.131c-.439.44-.439 1.152 0 1.591l.296.296c.256.257.622.374.98.314l1.17-.195c.323-.054.654.036.905.245l1.33 1.108c.32.267.46.694.358 1.1a8.7 8.7 0 01-2.288 4.04l-.723.724a1.125 1.125 0 01-1.298.21l-.153-.076a1.125 1.125 0 01-.622-1.006v-1.089c0-.298-.119-.585-.33-.796l-1.347-1.347a1.125 1.125 0 01-.21-1.298L9.75 12l-1.64-1.64a6 6 0 01-1.676-3.257l-.172-1.03z" clipRule="evenodd" />
        </svg>
    ),
    Heart: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-600">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
    )
};

const AboutUs = () => {
    const stats = [
        { num: '8+', label: 'Years of Service', icon: Icons.Calendar },
        { num: '250+', label: 'Animals Cared For', icon: Icons.Paw },
        { num: '45', label: 'Species Protected', icon: Icons.Globe },
        { num: '15', label: 'Conservation Programs', icon: Icons.Heart }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <section className="relative text-white py-24 text-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(45,90,39,0.85), rgba(58,140,125,0.85)), url(https://images.unsplash.com/photo-1550358864-518f202c02ba)' }}>
                <div className="relative z-10 animate-fade-in-up">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">About Bulusan Park Zoo</h1>
                    <p className="text-xl max-w-2xl mx-auto opacity-90 font-light">Pioneering the future of wildlife conservation through AI-powered innovation.</p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-16 flex-grow">
                <div className="flex items-center justify-center gap-3 mb-12">
                    <span className="h-px w-12 bg-green-200"></span>
                    <h2 className="text-3xl font-bold text-green-800 tracking-wide uppercase">Our Story</h2>
                    <span className="h-px w-12 bg-green-200"></span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                        <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                            Founded in 2015, Bulusan Wildlife & Nature Park began as a small conservation initiative in Calapan City. Today, we stand as a testament to modern conservation, housing over 250 animals across 45 species.
                        </p>
                        <p className="text-gray-700 text-lg leading-relaxed">
                            Through our innovative AI systems, we monitor animal health and provide real-time educational content to visitors, making every visit an immersive learning experience.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="flex justify-center mb-3">
                                    <stat.icon />
                                </div>
                                <div className="text-4xl font-bold text-green-700 mb-1">{stat.num}</div>
                                <div className="text-teal-600 font-medium text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-3xl p-12 text-center text-white shadow-xl">
                    <h3 className="text-3xl font-bold mb-4">Join Our Conservation Mission</h3>
                    <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                        Every visit supports our wildlife conservation efforts and helps protect endangered species for future generations.
                    </p>
                    <button className="px-10 py-4 bg-white text-green-700 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">
                        Plan Your Visit
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AboutUs;