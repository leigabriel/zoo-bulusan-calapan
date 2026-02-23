import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MiniZooGame = () => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const stickRef = useRef(null);
    const baseRef = useRef(null);
    const [showBackModal, setShowBackModal] = useState(false);
    const navigate = useNavigate();

    // Game state refs to persist across renders
    const gameStateRef = useRef({
        keys: {},
        yaw: 0,
        pitch: 0,
        mX: 0,
        mY: 0,
        sActive: false,
        lActive: false,
        lx: 0,
        ly: 0,
        animationId: null,
        scene: null,
        camera: null,
        renderer: null,
        animals: [],
        clouds: []
    });

    useEffect(() => {
        let mounted = true;

        const loadThreeJS = async () => {
            // Dynamically load Three.js
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
            script.async = true;

            script.onload = () => {
                if (mounted && window.THREE) {
                    initGame();
                }
            };

            document.head.appendChild(script);

            return () => {
                document.head.removeChild(script);
            };
        };

        const initGame = () => {
            const THREE = window.THREE;
            const state = gameStateRef.current;

            // Scene setup
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xa3d8ff);
            scene.fog = new THREE.Fog(0xa3d8ff, 60, 500);
            state.scene = scene;

            // Camera setup
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            state.camera = camera;

            // Renderer setup
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            state.renderer = renderer;

            if (containerRef.current) {
                containerRef.current.appendChild(renderer.domElement);
                canvasRef.current = renderer.domElement;
            }

            // Lighting
            const ambient = new THREE.HemisphereLight(0xffffff, 0x4f7d4d, 1.3);
            scene.add(ambient);

            const sun = new THREE.DirectionalLight(0xfffbe6, 2.8);
            sun.position.set(100, 150, 50);
            sun.castShadow = true;
            sun.shadow.mapSize.set(2048, 2048);
            sun.shadow.camera.left = -300;
            sun.shadow.camera.right = 300;
            sun.shadow.camera.top = 300;
            sun.shadow.camera.bottom = -300;
            scene.add(sun);

            // Terrain texture
            const loader = new THREE.TextureLoader();
            const grassTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
            grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
            grassTex.repeat.set(128, 128);

            // Height function
            const getHeight = (x, z) => {
                return Math.sin(x * 0.04) * 2.5 + Math.cos(z * 0.04) * 2.5 + Math.sin(x * 0.01) * 12;
            };

            // Terrain
            const terrainGeo = new THREE.PlaneGeometry(1000, 1000, 128, 128);
            const posAttr = terrainGeo.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                posAttr.setZ(i, getHeight(posAttr.getX(i), posAttr.getY(i)));
            }
            terrainGeo.computeVertexNormals();

            const ground = new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            scene.add(ground);

            // Cloud creation function
            const createCloud = () => {
                const group = new THREE.Group();
                const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
                for (let i = 0; i < 4; i++) {
                    const mesh = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), mat);
                    mesh.position.set(i * 3, Math.random() * 2, Math.random() * 2);
                    mesh.scale.setScalar(1 + Math.random() * 2);
                    group.add(mesh);
                }
                group.position.set((Math.random() - 0.5) * 800, 70 + Math.random() * 30, (Math.random() - 0.5) * 800);
                scene.add(group);
                return group;
            };
            state.clouds = Array.from({ length: 20 }, createCloud);

            // Tree creation function
            const createBushyTree = (x, z) => {
                const h = getHeight(x, z);
                const group = new THREE.Group();
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 6, 8), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
                trunk.position.y = 3;
                trunk.castShadow = true;
                group.add(trunk);
                const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
                for (let i = 0; i < 8; i++) {
                    const s = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), leafMat);
                    s.position.set((Math.random() - 0.5) * 4, 6 + Math.random() * 4, (Math.random() - 0.5) * 4);
                    s.castShadow = true;
                    group.add(s);
                }
                group.position.set(x, h, z);
                scene.add(group);
            };
            for (let i = 0; i < 300; i++) {
                createBushyTree((Math.random() - 0.5) * 800, (Math.random() - 0.5) * 800);
            }

            // Animal class
            class Animal {
                constructor(type, color, scale = 1) {
                    this.group = new THREE.Group();
                    this.type = type;
                    this.mat = new THREE.MeshStandardMaterial({ color: color });
                    this.legs = [];
                    this.wings = [];
                    this.initModel();
                    this.group.scale.setScalar(scale);
                    this.pos = new THREE.Vector3((Math.random() - 0.5) * 400, 0, (Math.random() - 0.5) * 400);
                    this.angle = Math.random() * Math.PI * 2;
                    this.timer = 0;
                    this.state = 'walk';
                    this.altitude = (['dove', 'parrot', 'eagle'].includes(type)) ? 15 + Math.random() * 15 : 0;
                    scene.add(this.group);
                }

                initModel() {
                    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 0.9, 4, 8), this.mat);
                    body.rotation.z = Math.PI / 2;
                    body.castShadow = true;
                    this.group.add(body);

                    this.head = new THREE.Group();
                    this.head.position.set(0.8, 0.4, 0);
                    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), this.mat);
                    this.head.add(skull);
                    this.group.add(this.head);

                    if (['dove', 'parrot', 'eagle'].includes(this.type)) {
                        const wL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 1.8), this.mat);
                        wL.position.set(0, 0.3, 1);
                        const wR = wL.clone();
                        wR.position.z = -1;
                        this.wings.push(wL, wR);
                        this.group.add(wL, wR);
                    } else {
                        const lp = [[0.5, 0.4], [0.5, -0.4], [-0.5, 0.4], [-0.5, -0.4]];
                        lp.forEach(p => {
                            const l = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1), this.mat);
                            l.position.set(p[0], -0.6, p[1]);
                            l.castShadow = true;
                            this.legs.push(l);
                            this.group.add(l);
                        });
                        if (this.type === 'tiger') this.mat.roughness = 0.5;
                        if (this.type === 'deer') {
                            const antL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), this.mat);
                            antL.position.set(0.2, 0.8, 0.3);
                            this.head.add(antL);
                            const antR = antL.clone();
                            antR.position.z = -0.3;
                            this.head.add(antR);
                        }
                    }
                }

                update(t) {
                    this.timer -= 0.016;
                    if (this.timer < 0) {
                        this.state = Math.random() > 0.4 ? 'walk' : 'idle';
                        this.timer = 2 + Math.random() * 5;
                        this.angle += (Math.random() - 0.5) * 3;
                    }

                    if (this.state === 'walk') {
                        const speed = (this.type === 'tiger' || this.type === 'horse') ? 0.18 : 0.08;
                        this.pos.x += Math.cos(this.angle) * speed;
                        this.pos.z -= Math.sin(this.angle) * speed;
                        this.group.rotation.y = this.angle;
                        this.legs.forEach((l, i) => l.rotation.z = Math.sin(t * 12 + (i % 2 ? 0 : Math.PI)) * 0.5);
                        this.wings.forEach((w, i) => w.rotation.x = Math.sin(t * 18) * (i === 0 ? 1 : -1));
                    }
                    const h = getHeight(this.pos.x, this.pos.z);
                    this.group.position.set(this.pos.x, h + 1.2 + this.altitude, this.pos.z);
                }
            }

            // Create animals
            const animalSpecs = [
                { t: 'monkey', c: 0x6d4c41 },
                { t: 'dove', c: 0xffffff, s: 0.4 },
                { t: 'parrot', c: 0x388e3c, s: 0.5 },
                { t: 'eagle', c: 0x455a64, s: 0.8 },
                { t: 'ostrich', c: 0x212121, s: 1.3 },
                { t: 'deer', c: 0x8d6e63 },
                { t: 'rabbit', c: 0xeeeeee, s: 0.4 },
                { t: 'tiger', c: 0xef6c00 },
                { t: 'horse', c: 0x4e342e, s: 1.2 },
                { t: 'donkey', c: 0x757575 }
            ];
            state.animals = animalSpecs.map(s => new Animal(s.t, s.c, s.s || 1));

            // Movement handler
            const handleMovement = () => {
                const s = 0.55;
                const f = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
                const r = new THREE.Vector3(-Math.cos(state.yaw), 0, Math.sin(state.yaw));

                if (state.keys["w"]) camera.position.add(f.clone().multiplyScalar(s));
                if (state.keys["s"]) camera.position.add(f.clone().multiplyScalar(-s));
                if (state.keys["a"]) camera.position.add(r.clone().multiplyScalar(-s));
                if (state.keys["d"]) camera.position.add(r.clone().multiplyScalar(s));

                camera.position.add(f.clone().multiplyScalar(-state.mY * s));
                camera.position.add(r.clone().multiplyScalar(state.mX * s));
                camera.position.y = getHeight(camera.position.x, camera.position.z) + 4;
                camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
            };

            // Animation loop
            const animate = () => {
                state.animationId = requestAnimationFrame(animate);
                const t = performance.now() * 0.001;
                handleMovement();
                state.animals.forEach(a => a.update(t));
                state.clouds.forEach(c => {
                    c.position.x += 0.05;
                    if (c.position.x > 500) c.position.x = -500;
                });
                renderer.render(scene, camera);
            };
            animate();

            // Resize handler
            const handleResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener("resize", handleResize);

            // Keyboard handlers
            const handleKeyDown = (e) => {
                state.keys[e.key.toLowerCase()] = true;
            };
            const handleKeyUp = (e) => {
                state.keys[e.key.toLowerCase()] = false;
            };
            document.addEventListener("keydown", handleKeyDown);
            document.addEventListener("keyup", handleKeyUp);

            // Touch handlers for joystick
            const handleTouchStart = (e) => {
                if (e.target === baseRef.current || e.target === stickRef.current) {
                    state.sActive = true;
                    e.preventDefault();
                } else {
                    state.lActive = true;
                    state.lx = e.touches[0].clientX;
                    state.ly = e.touches[0].clientY;
                }
            };

            const handleTouchMove = (e) => {
                if (state.sActive && baseRef.current) {
                    const rect = baseRef.current.getBoundingClientRect();
                    let x = e.touches[0].clientX - rect.left - 60;
                    let y = e.touches[0].clientY - rect.top - 60;
                    x = Math.max(-40, Math.min(40, x));
                    y = Math.max(-40, Math.min(40, y));
                    state.mX = x / 40;
                    state.mY = y / 40;
                    if (stickRef.current) {
                        stickRef.current.style.left = (x + 30) + "px";
                        stickRef.current.style.top = (y + 30) + "px";
                    }
                } else if (state.lActive) {
                    state.yaw -= (e.touches[0].clientX - state.lx) * 0.006;
                    state.pitch -= (e.touches[0].clientY - state.ly) * 0.006;
                    state.pitch = Math.max(-1.4, Math.min(1.4, state.pitch));
                    state.lx = e.touches[0].clientX;
                    state.ly = e.touches[0].clientY;
                }
            };

            const handleTouchEnd = () => {
                state.sActive = false;
                state.lActive = false;
                state.mX = 0;
                state.mY = 0;
                if (stickRef.current) {
                    stickRef.current.style.left = "30px";
                    stickRef.current.style.top = "30px";
                }
            };

            // Mouse handlers for look
            const handleMouseMove = (e) => {
                if (!('ontouchstart' in window) && e.buttons === 1) {
                    state.yaw -= e.movementX * 0.004;
                    state.pitch -= e.movementY * 0.004;
                    state.pitch = Math.max(-1.4, Math.min(1.4, state.pitch));
                }
            };

            if (baseRef.current) {
                baseRef.current.addEventListener("touchstart", handleTouchStart, { passive: false });
            }
            window.addEventListener("touchstart", handleTouchStart);
            window.addEventListener("touchmove", handleTouchMove);
            window.addEventListener("touchend", handleTouchEnd);
            window.addEventListener("mousemove", handleMouseMove);

            // Cleanup function stored in state
            state.cleanup = () => {
                if (state.animationId) {
                    cancelAnimationFrame(state.animationId);
                }
                window.removeEventListener("resize", handleResize);
                document.removeEventListener("keydown", handleKeyDown);
                document.removeEventListener("keyup", handleKeyUp);
                if (baseRef.current) {
                    baseRef.current.removeEventListener("touchstart", handleTouchStart);
                }
                window.removeEventListener("touchstart", handleTouchStart);
                window.removeEventListener("touchmove", handleTouchMove);
                window.removeEventListener("touchend", handleTouchEnd);
                window.removeEventListener("mousemove", handleMouseMove);
                if (renderer) {
                    renderer.dispose();
                    if (containerRef.current && renderer.domElement) {
                        containerRef.current.removeChild(renderer.domElement);
                    }
                }
            };
        };

        loadThreeJS();

        return () => {
            mounted = false;
            const state = gameStateRef.current;
            if (state.cleanup) {
                state.cleanup();
            }
        };
    }, []);

    const handleBackClick = () => {
        setShowBackModal(true);
    };

    const handleConfirmBack = () => {
        setShowBackModal(false);
        navigate('/');
    };

    const handleCancelBack = () => {
        setShowBackModal(false);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#a3d8ff]" style={{ touchAction: 'none' }}>
            {/* Canvas container */}
            <div ref={containerRef} className="absolute inset-0" />

            {/* Back Button */}
            <button
                onClick={handleBackClick}
                className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 border border-white/50"
            >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">Back to Home</span>
            </button>

            {/* UI Overlay */}
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 text-white z-10 text-right pointer-events-none">
                <h1 className="text-lg sm:text-xl font-bold drop-shadow-lg">Cartoon Zoo Explorer</h1>
                <p className="text-xs sm:text-sm opacity-80 mt-1 hidden sm:block">PC: WASD to Move | Click-Drag to Look</p>
                <p className="text-xs sm:text-sm opacity-80 hidden sm:block">Mobile: Joystick to Move | Drag to Look</p>
                <p className="text-xs opacity-80 mt-1 sm:hidden">Use joystick to move, drag to look</p>
            </div>

            {/* Joystick Base */}
            <div
                ref={baseRef}
                className="absolute bottom-8 left-8 sm:bottom-10 sm:left-10 w-24 h-24 sm:w-[120px] sm:h-[120px] rounded-full z-10"
                style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                }}
            >
                {/* Joystick Stick */}
                <div
                    ref={stickRef}
                    className="absolute w-12 h-12 sm:w-[60px] sm:h-[60px] rounded-full"
                    style={{
                        left: '30px',
                        top: '30px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                    }}
                />
            </div>

            {/* Back Confirmation Modal */}
            {showBackModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Modal Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleCancelBack}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Leave Game?</h3>
                            <p className="text-gray-600 mb-6">Are you sure you want to go back to home? Your game progress will not be saved.</p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelBack}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                                >
                                    Continue Playing
                                </button>
                                <button
                                    onClick={handleConfirmBack}
                                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
                                >
                                    Yes, Leave
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiniZooGame;
