import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Center, Html } from '@react-three/drei';
import { useScroll, useSpring, useTransform, motion, AnimatePresence } from 'framer-motion';

const MODEL_URL = '/deer/scene.gltf';

function DeerModel({ spinRotation, scale }) {
    const group = useRef(null);
    const { scene } = useGLTF(MODEL_URL);
    const [hovered, setHovered] = useState(false);
    const [mousePos, setMousePos] = useState([0, 0, 0]);

    useFrame((state) => {
        if (!group.current) return;
        group.current.rotation.y = spinRotation.get();
        group.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
    });

    const handlePointerMove = (e) => {
        e.stopPropagation();
        const { point } = e;
        setMousePos([point.x + 0.4, point.y + 0.4, point.z]);
    };

    return (
        <group
            ref={group}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerMove={handlePointerMove}
        >
            <Center>
                <primitive object={scene} scale={scale} />
            </Center>

            <Html
                position={mousePos}
                center
                distanceFactor={10}
                // Moves the DOM element to the body so it ignores Canvas z-index
                portal={{ current: document.body }}
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    // Higher than the TitleBlock's zIndex 30
                    zIndex: 100
                }}
            >
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-56 sm:w-64 p-4 bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl shadow-2xl flex flex-col box-border overflow-hidden"
                        >
                            <h3 className="text-sm font-bold uppercase tracking-tighter text-[#212631] leading-tight">
                                Deer Wildlife
                            </h3>
                            <p className="text-[11px] leading-relaxed text-[#212631]/70 mt-2 whitespace-normal break-words">
                                Representing the serene biodiversity of <strong>Bulusan Zoo</strong>.
                                Our sanctuary focuses on conservation and education.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Html>
        </group>
    );
}

function Scene({ spinRotation, device }) {
    const scale = device === 'mobile' ? 0.53 : device === 'tablet' ? 0.65 : 0.80;
    return (
        <group>
            <ambientLight intensity={0.7} />
            <directionalLight position={[4, 8, 4]} intensity={1.5} />
            <Environment preset="forest" />
            <Suspense fallback={null}>
                <DeerModel spinRotation={spinRotation} scale={scale} />
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

    // Layering logic: Title starts at front (30), moves to back (10) during spin, returns to front (30) after.
    const frontTextOpacity = useTransform(smoothProgress, [0, 0.1, 0.4, 0.5, 0.85, 0.95], [1, 0, 0, 1, 1, 0]);
    const backTextOpacity = useTransform(smoothProgress, [0, 0.1, 0.4, 0.5], [0, 1, 1, 0]);

    return (
        <section ref={containerRef} className="relative block w-full h-[400vh] bg-[#ebebeb]">
            <div className="sticky top-0 left-0 w-full h-[100dvh] overflow-hidden">
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">

                    <TitleBlock scale={titleScale} opacity={backTextOpacity} zIndex={10} y={titleY} tracking={titleTracking} />

                    <motion.div style={{ opacity: canvasOpacity }} className="absolute inset-0 z-20">
                        <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 7], fov: 45 }}>
                            <Scene spinRotation={spinRotation} device={device} />
                        </Canvas>
                    </motion.div>

                    <TitleBlock scale={titleScale} opacity={frontTextOpacity} zIndex={30} y={titleY} tracking={titleTracking} />

                </div>
            </div>
        </section>
    );
}

useGLTF.preload(MODEL_URL);