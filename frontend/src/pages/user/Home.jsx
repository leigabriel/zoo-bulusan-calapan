import React from 'react';
import { ReactLenis } from 'lenis/react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import HeroSection from './home-section/HeroSection';
import BulusanSection from './home-section/BulusanSection';
import AboutSection from './home-section/AboutSection';
import StatsSection from './home-section/StatsSection';
import IntroSection from './home-section/IntroSection';
import WildlifeSection from './home-section/WildlifeSection';
import FloraSection from './home-section/FloraSection';
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

                    <div className="sticky top-0 z-0 flex flex-col h-[100svh] w-full bg-[#007a55]">
                        <AboutSection />
                        <StatsSection />
                    </div>

                    <div className="sticky top-0 z-10 flex flex-col h-[100svh] w-full bg-[#1a1e26] shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
                        <BulusanSection />
                    </div>

                    <div className="relative z-20 w-full bg-[#ebebeb] shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
                        <IntroSection />
                    </div>

                    <div className="sticky top-0 z-30 flex flex-col h-[100svh] w-full bg-[#ebebeb] shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
                        <WildlifeSection />
                    </div>

                    <div className="sticky top-0 z-40 flex flex-col h-[100svh] w-full bg-[#ebebeb] shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
                        <FloraSection />
                    </div>

                    <div className="relative z-50 w-full bg-[#ebebeb] shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
                        <EventsSection />
                        <FaqSection />
                        <PricingSection />
                    </div>
                </main>
                <div className="relative z-50 bg-[#ebebeb] w-full">
                    <Footer />
                </div>
            </div>
        </ReactLenis>
    );
};

export default Home;