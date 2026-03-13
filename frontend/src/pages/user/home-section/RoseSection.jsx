import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Center } from '@react-three/drei';
import { useScroll, useSpring, useTransform, motion, AnimatePresence } from 'framer-motion';

const ROSE_MODEL_URL = '/papa_meilland_rose/scene.gltf';

function RoseModel({ smoothProgress, device, setTooltip }) {
    const group = useRef(null);
    const { scene } = useGLTF(ROSE_MODEL_URL);

    const scale = device === 'mobile' ? 8 : device === 'tablet' ? 12 : 15;
    const basePosY = device === 'mobile' ? 0 : -0.5;

    useFrame((state) => {
        if (!group.current) return;
        const progress = smoothProgress.get();

        group.current.rotation.y = progress * (Math.PI * 2);
        group.current.rotation.x = 0.2 + (progress * 0.5);
        group.current.position.y = basePosY + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
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
        >
            <Center>
                <primitive object={scene} scale={scale} />
            </Center>
        </group>
    );
}

function RoseScene({ smoothProgress, device, setTooltip }) {
    return (
        <group>
            <ambientLight intensity={1.5} />
            <spotLight position={[5, 5, 5]} angle={0.2} penumbra={1} intensity={3} color="#ffb6c1" />
            <Environment preset="dawn" />
            <Suspense fallback={null}>
                <RoseModel smoothProgress={smoothProgress} device={device} setTooltip={setTooltip} />
            </Suspense>
        </group>
    );
}

export default function RoseSection() {
    const containerRef = useRef(null);
    const [device, setDevice] = useState('desktop');
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0 });

    useEffect(() => {
        const checkDevice = () => {
            if (window.innerWidth < 640) setDevice('mobile');
            else if (window.innerWidth < 1024) setDevice('tablet');
            else setDevice('desktop');
        };

        checkDevice();
        window.addEventListener('resize', checkDevice, { passive: true });
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 50,
        damping: 20,
        restDelta: 0.001
    });

    const textY = useTransform(smoothProgress, [0, 0.5], [100, 0]);
    const textOpacity = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

    return (
        <section ref={containerRef} className="relative block w-full h-[250vh] bg-[#1a1a1a]">
            <div className="sticky top-0 left-0 w-full h-[100svh] overflow-hidden flex items-center justify-center">
                <motion.div
                    style={{ y: textY, opacity: textOpacity }}
                    className="absolute z-10 text-center pointer-events-none w-full px-4"
                >
                    <span className="text-[10px] md:text-sm lg:text-lg tracking-[0.4em] md:tracking-[0.5em] text-[#ffb6c1]/60 uppercase mb-2 md:mb-4 block">
                        Botanical Collection
                    </span>
                    <h2 className="text-[15vw] md:text-[8rem] font-serif italic leading-none text-white/90 drop-shadow-lg">
                        Papa Meilland
                    </h2>
                </motion.div>
                <motion.div className="absolute inset-0 z-20">
                    <Canvas
                        dpr={device === 'mobile' ? 1 : [1, 1.5]}
                        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
                        camera={{ position: [0, 0, 5], fov: 45 }}
                    >
                        <RoseScene smoothProgress={smoothProgress} device={device} setTooltip={setTooltip} />
                    </Canvas>
                </motion.div>
                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-30 pointer-events-none text-[#ffb6c1]/70 font-mono text-[9px] md:text-xs tracking-widest uppercase">
                    Specimen: Papa Meilland
                </div>
                <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-30 pointer-events-none flex flex-col items-end gap-2">
                    <div className="w-[1px] h-8 md:h-12 bg-[#ffb6c1]/40 origin-top" />
                    <span className="text-[#ffb6c1]/70 font-mono text-[8px] md:text-[10px] tracking-widest uppercase rotate-90 origin-right translate-y-full mt-2 md:mt-4">
                        Keep Scrolling
                    </span>
                </div>
            </div>
            <AnimatePresence>
                {tooltip.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="fixed z-[100] pointer-events-none w-56 p-4 bg-[#1a1a1a]/95 backdrop-blur-md rounded shadow-2xl border border-[#ffb6c1]/30"
                        style={{
                            left: Math.min(tooltip.x + 20, typeof window !== 'undefined' ? window.innerWidth - 240 : tooltip.x + 20),
                            top: tooltip.y + 20
                        }}
                    >
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#ffb6c1] mb-2">
                            Hybrid Tea Rose
                        </h3>
                        <p className="text-[11px] leading-relaxed text-gray-300">
                            The <strong className="text-white font-semibold">Papa Meilland</strong> is famous for its dark velvet crimson color and intense fragrance.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

useGLTF.preload(ROSE_MODEL_URL);
