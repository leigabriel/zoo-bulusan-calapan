import { useRef, useEffect, memo } from 'react';
import * as THREE from 'three';

const vertexShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
uniform float uImageAspect;
uniform float uNoiseStrength;
uniform float uBlur;
uniform float time;
varying vec2 vUv;

float random(vec2 p) {
    vec2 k1 = vec2(23.14069263277926, 2.665144142690225);
    return fract(cos(dot(p, k1)) * 12345.6789);
}

void main() {
  // 1. Aspect Ratio Correction (Background-size: cover)
  float containerAspect = resolution.x / resolution.y;
  vec2 correctedUv = vUv;
  
  if (containerAspect > uImageAspect) {
      float newHeight = uImageAspect / containerAspect;
      correctedUv.y = (correctedUv.y - 0.5) * newHeight + 0.5;
  } else {
      float newWidth = containerAspect / uImageAspect;
      correctedUv.x = (correctedUv.x - 0.5) * newWidth + 0.5;
  }

  // 2. Mouse Distortion Offset
  vec4 offset = texture2D(uDataTexture, vUv);
  vec2 distortedUv = correctedUv - 0.02 * offset.rg;
  
  // 3. Hardware-Safe Custom Blur (Multi-tap Gaussian)
  vec4 baseColor = vec4(0.0);
  float total = 0.0;
  for(float x = -2.0; x <= 2.0; x += 1.0) {
      for(float y = -2.0; y <= 2.0; y += 1.0) {
          float weight = 1.0 - (length(vec2(x, y)) / 3.0); // Center-weighted
          baseColor += texture2D(uTexture, distortedUv + vec2(x, y) * uBlur) * weight;
          total += weight;
      }
  }
  baseColor /= total;

  // 4. Dynamic Film Grain Noise
  float noise = (random(gl_FragCoord.xy + time) - 0.5) * uNoiseStrength;

  // Force alpha to 1.0 to prevent transparency blackouts
  gl_FragColor = vec4(baseColor.rgb + noise, 1.0);
}`;

const GridDistortion = memo(({ grid = 15, mouse = 0.1, strength = 0.15, relaxation = 0.9, noiseStrength = 0.25, blur = 0.015, imageSrc, className = '' }) => {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const planeRef = useRef(null);
    const animationIdRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const isVisibleRef = useRef(true);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            premultipliedAlpha: false  // Suppress alpha-premult deprecation warning
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
        camera.position.z = 2;
        cameraRef.current = camera;

        const uniforms = {
            time: { value: 0 },
            resolution: { value: new THREE.Vector4() },
            uTexture: { value: null },
            uDataTexture: { value: null },
            uImageAspect: { value: 1 },
            uNoiseStrength: { value: noiseStrength },
            uBlur: { value: blur } // Using small decimal for custom UV blur
        };

        const textureLoader = new THREE.TextureLoader();
        // FIX 1: Prevents external images from turning black due to CORS
        textureLoader.setCrossOrigin('anonymous');

        textureLoader.load(imageSrc, texture => {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;

            uniforms.uImageAspect.value = texture.image.width / texture.image.height;
            uniforms.uTexture.value = texture;
            handleResize();
        });

        const size = grid;
        const data = new Float32Array(4 * size * size);
        for (let i = 0; i < size * size; i++) {
            data[i * 4] = Math.random() * 255 - 125;
            data[i * 4 + 1] = Math.random() * 255 - 125;
        }

        const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
        dataTexture.needsUpdate = true;
        uniforms.uDataTexture.value = dataTexture;

        const material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true
        });

        const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
        const plane = new THREE.Mesh(geometry, material);
        planeRef.current = plane;
        scene.add(plane);

        const handleResize = () => {
            if (!container || !renderer || !camera) return;
            const rect = container.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            if (width === 0 || height === 0) return;

            const containerAspect = width / height;
            renderer.setSize(width, height);

            if (plane) {
                plane.scale.set(containerAspect, 1, 1);
            }

            const frustumHeight = 1;
            const frustumWidth = frustumHeight * containerAspect;
            camera.left = -frustumWidth / 2;
            camera.right = frustumWidth / 2;
            camera.top = frustumHeight / 2;
            camera.bottom = -frustumHeight / 2;
            camera.updateProjectionMatrix();

            uniforms.resolution.value.set(width, height, 1, 1);
        };

        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => handleResize());
            resizeObserver.observe(container);
            resizeObserverRef.current = resizeObserver;
        } else {
            window.addEventListener('resize', handleResize);
        }

        const mouseState = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };

        const handlePointerMove = e => {
            const rect = container.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const x = (clientX - rect.left) / rect.width;
            const y = 1 - (clientY - rect.top) / rect.height;
            mouseState.vX = x - mouseState.prevX;
            mouseState.vY = y - mouseState.prevY;
            Object.assign(mouseState, { x, y, prevX: x, prevY: y });
        };

        const handlePointerLeave = () => {
            if (dataTexture) dataTexture.needsUpdate = true;
            Object.assign(mouseState, { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 });
        };

        container.addEventListener('mousemove', handlePointerMove);
        container.addEventListener('touchmove', handlePointerMove);
        container.addEventListener('mouseleave', handlePointerLeave);
        container.addEventListener('touchend', handlePointerLeave);

        handleResize();

        // visibility observer to pause animation when not in view
        let intersectionObserver;
        if (window.IntersectionObserver) {
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    isVisibleRef.current = entries[0].isIntersecting;
                },
                { threshold: 0.1 }
            );
            intersectionObserver.observe(container);
        }

        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);
            
            // skip rendering when not visible
            if (!isVisibleRef.current || !renderer || !scene || !camera) return;

            uniforms.time.value += 0.05;
            uniforms.uNoiseStrength.value = noiseStrength;
            uniforms.uBlur.value = blur;

            const data = dataTexture.image.data;
            for (let i = 0; i < size * size; i++) {
                data[i * 4] *= relaxation;
                data[i * 4 + 1] *= relaxation;
            }

            const gridMouseX = size * mouseState.x;
            const gridMouseY = size * mouseState.y;
            const maxDist = size * mouse;

            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
                    if (distSq < maxDist * maxDist) {
                        const index = 4 * (i + size * j);
                        const power = Math.min(maxDist / Math.sqrt(distSq), 10);
                        data[index] += strength * 100 * mouseState.vX * power;
                        data[index + 1] -= strength * 100 * mouseState.vY * power;
                    }
                }
            }

            dataTexture.needsUpdate = true;
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
            if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
            if (intersectionObserver) intersectionObserver.disconnect();
            else window.removeEventListener('resize', handleResize);

            container.removeEventListener('mousemove', handlePointerMove);
            container.removeEventListener('touchmove', handlePointerMove);
            container.removeEventListener('mouseleave', handlePointerLeave);
            container.removeEventListener('touchend', handlePointerLeave);

            if (renderer) {
                renderer.dispose();
                if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
            }
            if (geometry) geometry.dispose();
            if (material) material.dispose();
            if (dataTexture) dataTexture.dispose();
            if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
        };
    }, [grid, mouse, strength, relaxation, imageSrc, noiseStrength, blur]);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            style={{ width: '100%', height: '100%', minWidth: '0', minHeight: '0' }}
        />
    );
});

export default GridDistortion;
