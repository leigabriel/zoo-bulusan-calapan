import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Center } from '@react-three/drei';
import { useScroll, useSpring, useTransform, motion } from 'framer-motion';

const MODEL_URL = '/gltf/Deer.gltf';

function DeerModel({ spinRotation, scale }) {
    const group = useRef(null);
    const { scene } = useGLTF(MODEL_URL);

    useFrame((state) => {
        if (!group.current) return;
        group.current.rotation.y = spinRotation.get();
        group.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
    });

    return (
        <group ref={group}>
            <Center>
                <primitive object={scene} scale={scale} />
            </Center>
        </group>
    );
}

function Scene({ spinRotation, device }) {
    const scale = device === 'mobile' ? 0.6 : device === 'tablet' ? 0.75 : 0.85;

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
        <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[3vw] sm:text-[0.7rem] tracking-[0.3em] uppercase text-[#212631]/50 mb-2 sm:mb-4"
        >
            Bulusan Wildlife Park
        </motion.span>

        <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ letterSpacing: tracking }}
            className="m-0 text-[14vw] sm:text-[6rem] lg:text-[8rem] font-serif italic leading-none text-center text-[#212631]"
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
    const backTextOpacity = useTransform(smoothProgress, [0.49, 0.5], [1, 0]);
    const frontTextOpacity = useTransform(smoothProgress, [0.49, 0.5, 0.85, 0.95], [0, 1, 1, 0]);
    const canvasOpacity = useTransform(smoothProgress, [0.75, 0.95], [1, 0]);

    return (
        <section ref={containerRef} className="relative block w-full h-[400vh] bg-[#ebebeb]">
            <div className="sticky top-0 left-0 w-full h-[100dvh] overflow-hidden">
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">

                    <TitleBlock scale={titleScale} opacity={backTextOpacity} zIndex={10} y={titleY} tracking={titleTracking} />

                    <motion.div style={{ opacity: canvasOpacity }} className="absolute inset-0 z-20 pointer-events-none">
                        <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 7], fov: 45 }} className="pointer-events-none bg-transparent">
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