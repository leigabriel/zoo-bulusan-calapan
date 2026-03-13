import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Center } from '@react-three/drei';
import { useScroll, useSpring, useTransform, motion, AnimatePresence } from 'framer-motion';
import AboutSection from './AboutSection';

const MODEL_URL = '/deer/scene.gltf';

function DeerModel({ spinRotation, scale, setTooltip }) {
    const group = useRef(null);
    const { scene } = useGLTF(MODEL_URL);

    useFrame((state) => {
        if (!group.current) return;
        group.current.rotation.y = spinRotation.get();
        group.current.position.y = (Math.sin(state.clock.elapsedTime) * 0.05);
    });

    const handlePointerMove = (e) => {
        e.stopPropagation();
        setTooltip({ show: true, x: e.clientX, y: e.clientY });
    };

    const handlePointerOut = () => {
        setTooltip((prev) => ({ ...prev, show: false }));
    };

    return (
        <group
            ref={group}
            onPointerOver={handlePointerMove}
            onPointerOut={handlePointerOut}
            onPointerMove={handlePointerMove}
            position={[0, 0, 0]}
        >
            <Center>
                <primitive object={scene} scale={scale * 0.7} />
            </Center>
        </group>
    );
}

function Scene({ spinRotation, device, setTooltip }) {
    const scale = device === 'mobile' ? 0.7 : device === 'tablet' ? 1 : 1.2;
    return (
        <group>
            <ambientLight intensity={0.9} />
            <directionalLight position={[4, 8, 4]} intensity={1.5} />
            <Environment preset="forest" />
            <Suspense fallback={null}>
                <DeerModel spinRotation={spinRotation} scale={scale} setTooltip={setTooltip} />
            </Suspense>
        </group>
    );
}

const TitleBlock = ({ scale, opacity, zIndex, y }) => (
    <motion.div
        style={{ scale, opacity, zIndex, y }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none origin-center"
    >
        <span className="text-[4vw] sm:text-[2rem] tracking-[0.3em] font-normal uppercase text-[#212631]/80 mb-2 sm:mb-4">
            Wildlife Park
        </span>
        <h1 className="m-0 text-[11vw] sm:text-[6rem] lg:text-[8rem] leading-none uppercase text-center text-[#212631] font-normal">
            Bulusan Zoo
        </h1>
    </motion.div>
);

const HeroDecorations = ({ opacity }) => (
    <motion.div
        style={{ opacity }}
        className="absolute inset-0 pointer-events-none z-40 p-6 md:p-12 flex flex-col justify-between"
    >
        <div className="flex justify-between items-start mt-16 md:mt-20">
            <div className="flex flex-col gap-1.5">
                <span className="text-[9px] md:text-[10px] font-bold tracking-[0.25em] text-[#212631]/70 uppercase">
                    Est. 2015
                </span>
                <span className="text-[9px] md:text-[10px] font-bold tracking-[0.25em] text-[#212631]/40 uppercase">
                    Calapan City
                </span>
            </div>
            <div className="flex flex-col gap-1.5 text-right">
                <span className="text-[9px] md:text-[10px] font-bold tracking-[0.25em] text-[#212631]/70 uppercase">
                    Mindoro, PH
                </span>
                <span className="text-[9px] md:text-[10px] font-bold tracking-[0.25em] text-[#212631]/40 uppercase">
                    Wildlife Reserve
                </span>
            </div>
        </div>
        <div className="flex justify-between items-end mb-4 md:mb-8">
            <div className="flex items-center gap-3 origin-bottom-left -rotate-90">
                <span className="text-[9px] md:text-[10px] font-semibold tracking-[0.25em] text-[#212631]/70 uppercase whitespace-nowrap">
                    Scroll to Explore
                </span>
                <motion.div
                    animate={{ x: [0, 15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-8 md:w-12 h-[1px] bg-[#212631]/70"
                />
            </div>
            <div className="flex flex-col gap-1.5 text-right">
                <span className="text-[9px] md:text-[10px] font-semibold tracking-[0.25em] text-[#212631]/70 uppercase">
                    13.4115° N
                </span>
                <span className="text-[9px] md:text-[10px] font-semibold tracking-[0.25em] text-[#212631]/40 uppercase">
                    121.1803° E
                </span>
            </div>
        </div>
    </motion.div>
);

export default function HeroSection() {
    const containerRef = useRef(null);
    const [device, setDevice] = useState('desktop');
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0 });

    useEffect(() => {
        const checkDevice = () => {
            if (window.innerWidth < 768) setDevice('mobile');
            else if (window.innerWidth >= 768 && window.innerWidth < 1024) setDevice('tablet');
            else setDevice('desktop');
        };
        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20, restDelta: 0.001 });

    const titleScale = useTransform(smoothProgress, [0, 0.2], [1, 3.5]);
    const titleY = useTransform(smoothProgress, [0, 0.2], ['0%', '10%']);

    const spinRotation = useTransform(smoothProgress, [0, 0.2, 0.3, 0.8], [0, Math.PI, Math.PI, 0]);

    const frontTextOpacity = useTransform(smoothProgress, [0, 0.1, 0.15, 0.2], [1, 0, 0, 0]);
    const backTextOpacity = useTransform(smoothProgress, [0, 0.1, 0.15, 0.2], [0, 1, 1, 0]);
    const decorOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);

    const aboutOpacity = useTransform(smoothProgress, [0.2, 0.3], [0, 1]);
    const aboutPointerEvents = useTransform(smoothProgress, (p) => p > 0.2 ? 'auto' : 'none');

    const canvasX = useTransform(smoothProgress, [0.2, 0.3], ['0vw', device === 'mobile' ? '0vw' : '25vw']);
    const canvasY = useTransform(smoothProgress, [0.2, 0.3], ['0vh', device === 'mobile' ? '25vh' : '0vh']);
    const canvasScale = useTransform(smoothProgress, [0.2, 0.3], [1, device === 'mobile' ? 0.9 : 1]);
    const canvasPointerEvents = useTransform(smoothProgress, (p) => p > 0.2 ? 'none' : 'auto');

    const heroContentOpacity = useTransform(smoothProgress, [0.85, 0.95], [1, 0]);

    return (
        <section ref={containerRef} className="relative block w-full h-[600vh] bg-[#ebebeb]">
            <div className="sticky top-0 left-0 w-full h-[100svh] overflow-hidden">
                <motion.div style={{ opacity: heroContentOpacity }} className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <HeroDecorations opacity={decorOpacity} />
                    <TitleBlock scale={titleScale} opacity={backTextOpacity} zIndex={10} y={titleY} />

                    <motion.div
                        style={{ opacity: aboutOpacity, pointerEvents: aboutPointerEvents }}
                        className="absolute inset-0 z-15 w-full h-full flex flex-col bg-[#ebebeb]"
                    >
                        <AboutSection />
                    </motion.div>

                    <motion.div
                        style={{ x: canvasX, y: canvasY, scale: canvasScale, pointerEvents: canvasPointerEvents }}
                        className="absolute inset-0 z-20"
                    >
                        <Canvas
                            dpr={device === 'mobile' ? 1 : [1, 1.5]}
                            gl={{
                                alpha: true,
                                antialias: true,
                                premultipliedAlpha: false
                            }}
                            camera={{ position: [0, 0, 8], fov: 40 }}
                        >
                            <Scene spinRotation={spinRotation} device={device} setTooltip={setTooltip} />
                        </Canvas>
                    </motion.div>

                    <TitleBlock scale={titleScale} opacity={frontTextOpacity} zIndex={30} y={titleY} />
                </motion.div>
            </div>
            <AnimatePresence>
                {tooltip.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="fixed z-[100] pointer-events-none w-52 p-4 bg-white/95 backdrop-blur-md rounded shadow-xl border border-gray-200/60"
                        style={{ left: tooltip.x + 20, top: tooltip.y + 20 }}
                    >
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-2">
                            Deer Wildlife
                        </h3>
                        <p className="text-[11px] leading-relaxed text-gray-500">
                            Representing the serene biodiversity of <strong className="text-gray-900 font-semibold">Bulusan Zoo</strong>.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

useGLTF.preload(MODEL_URL);