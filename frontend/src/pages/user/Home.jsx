import React from 'react';
import { ReactLenis } from 'lenis/react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import HeroSection from './home-section/HeroSection';
import BulusanSection from './home-section/BulusanSection';
import WildlifeSection from './home-section/WildlifeSection';
import FloraSection from './home-section/FloraSection';
import GameSection from './home-section/GameSection';
import EventsSection from './home-section/EventsSection';
import FaqSection from './home-section/FaqSection';
import PricingSection from './home-section/PricingSection';
import '../../App.css';

const Home = () => {
    return (
        <ReactLenis root options={{ lerp: 0.05, duration: 1, smoothWheel: true, smoothTouch: false, wheelMultiplier: 1, touchMultiplier: 2, infinite: false }}>
            <div className="relative min-h-screen bg-[#ebebeb] selection:bg-[#007a55] selection:text-white">
                <Header />
                <AIFloatingButton />
                <main className="relative w-full">
                    <div className="relative z-0">
                        <HeroSection />
                    </div>

                    <div className="sticky top-0 z-10 flex flex-col h-[100svh] w-full bg-[#1a1e26] shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
                        <BulusanSection />
                    </div>

                    <div className="sticky top-0 z-30 flex flex-col h-[100svh] w-full">
                        <WildlifeSection />
                    </div>

                    <div className="sticky top-0 z-40 flex flex-col h-[100svh] w-full">
                        <FloraSection />
                    </div>

                    <div className="relative z-40 flex flex-col w-full shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
                        <GameSection />
                    </div>

                    <div className="relative z-50 w-full shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
                        <EventsSection />
                        <FaqSection />
                        <PricingSection />
                    </div>
                </main>
                <div className="relative z-50 w-full">
                    <Footer />
                </div>
            </div>
        </ReactLenis>
    );
};

export default Home;