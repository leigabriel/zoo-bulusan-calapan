import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Center } from '@react-three/drei';
import { useScroll, useSpring, useTransform, motion, AnimatePresence } from 'framer-motion';

const MODEL_URL = '/deer/scene.gltf';

function DeerModel({ spinRotation, scale, setTooltip }) {
    const group = useRef(null);
    const { scene } = useGLTF(MODEL_URL);

    useFrame((state) => {
        if (!group.current) return;
        group.current.rotation.y = spinRotation.get();
        group.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
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

function Scene({ spinRotation, device, setTooltip }) {
    const scale = device === 'mobile' ? 0.53 : device === 'tablet' ? 0.65 : 0.80;
    return (
        <group>
            <ambientLight intensity={0.7} />
            <directionalLight position={[4, 8, 4]} intensity={1.5} />
            <Environment preset="forest" />
            <Suspense fallback={null}>
                <DeerModel spinRotation={spinRotation} scale={scale} setTooltip={setTooltip} />
            </Suspense>
        </group>
    );
}

const TitleBlock = ({ scale, opacity, zIndex, y, tracking }) => (
    <motion.div
        style={{ scale, opacity, zIndex, y }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none origin-center"
    >
        <motion.span className="text-[3vw] sm:text-[2rem] tracking-[0.3em] font-normal uppercase text-[#212631]/80 mb-2 sm:mb-2">
            Wildlife Park
        </motion.span>
        <motion.h1
            style={{ letterSpacing: tracking }}
            className="m-0 text-[11vw] sm:text-[6rem] lg:text-[6rem] leading-none uppercase text-center text-[#212631]"
        >
            Bulusan Zoo
        </motion.h1>
    </motion.div>
);

export default function HeroSection3D() {
    const containerRef = useRef(null);
    const [device, setDevice] = useState('desktop');
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0 });

    useEffect(() => {
        const checkDevice = () => {
            if (window.innerWidth < 640) setDevice('mobile');
            else if (window.innerWidth >= 640 && window.innerWidth < 1024) setDevice('tablet');
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

    const smoothProgress = useSpring(scrollYProgress, { stiffness: 40, damping: 15, restDelta: 0.001 });

    const spinRotation = useTransform(smoothProgress, [0, 0.5], [0, Math.PI * 2]);
    const titleScale = useTransform(smoothProgress, [0.5, 0.95], [1, 5]);
    const titleY = useTransform(smoothProgress, [0.5, 0.95], ['0%', '15%']);
    const titleTracking = useTransform(smoothProgress, [0.5, 0.95], ['0em', '0.08em']);
    const canvasOpacity = useTransform(smoothProgress, [0.75, 0.95], [1, 0]);

    const frontTextOpacity = useTransform(smoothProgress, [0, 0.1, 0.4, 0.5, 0.85, 0.95], [1, 0, 0, 1, 1, 0]);
    const backTextOpacity = useTransform(smoothProgress, [0, 0.1, 0.4, 0.5], [0, 1, 1, 0]);

    return (
        <section ref={containerRef} className="relative block w-full h-[400vh] bg-[#ebebeb]">
            <div className="sticky top-0 left-0 w-full h-[100dvh] overflow-hidden">
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">

                    <TitleBlock scale={titleScale} opacity={backTextOpacity} zIndex={10} y={titleY} tracking={titleTracking} />

                    <motion.div style={{ opacity: canvasOpacity }} className="absolute inset-0 z-20">
                        <Canvas 
                            gl={{ 
                                alpha: true, 
                                antialias: true, 
                                premultipliedAlpha: false  // Suppress alpha-premult deprecation warning
                            }} 
                            camera={{ position: [0, 0, 7], fov: 45 }}
                        >
                            <Scene spinRotation={spinRotation} device={device} setTooltip={setTooltip} />
                        </Canvas>
                    </motion.div>

                    <TitleBlock scale={titleScale} opacity={frontTextOpacity} zIndex={30} y={titleY} tracking={titleTracking} />

                </div>
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