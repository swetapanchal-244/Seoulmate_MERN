import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uSrcA;
  uniform vec2 uSrcB;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.0, 9.0);
      a *= 0.5;
    }
    return v;
  }

  // Ek steam plume: source se upar uthta hai, upar jaake phailta aur gayab hota hai
  float plume(vec2 uv, vec2 src, float seed, float strength) {
    vec2 p = vec2((uv.x - src.x) * uAspect, uv.y - src.y);
    float h = max(p.y, 0.0);
    float width = 0.09 + h * 0.34;
    float lateral = exp(-pow(p.x / width, 2.0));
    float vert = smoothstep(0.0, 0.10, p.y) * (1.0 - smoothstep(0.38, 0.85, p.y));

    vec2 q = vec2(p.x * 3.2 + seed, p.y * 2.4 - uTime * 0.12);
    float warp = fbm(q + vec2(0.0, uTime * 0.05));
    float d = fbm(q * 1.3 + warp * 1.6 + vec2(uTime * 0.03, 0.0));
    d = smoothstep(0.36, 0.80, d);

    return d * lateral * vert * strength;
  }

  void main() {
    float a = plume(vUv, uSrcA, 0.0, 0.85) + plume(vUv, uSrcB, 7.3, 0.70);
    a = clamp(a, 0.0, 0.65);
    gl_FragColor = vec4(vec3(1.0, 0.95, 0.88), a); // halka warm-white
  }
`

export default function HeroScene() {
    const mountRef = useRef(null)

    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const isMobile = window.innerWidth < 768

        let renderer
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' })
        } catch (err) {
            return 
        }
        
        renderer.setPixelRatio(isMobile ? 0.4 : 0.5)
        renderer.setClearColor(0x000000, 0)
        mount.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        const srcA = isMobile ? new THREE.Vector2(0.55, 0.38) : new THREE.Vector2(0.70, 0.44)
        const srcB = isMobile ? new THREE.Vector2(0.72, 0.34) : new THREE.Vector2(0.80, 0.40)

        const material = new THREE.ShaderMaterial({
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            uniforms: {
                uTime: { value: 4.0 },
                uAspect: { value: 1.0 },
                uSrcA: { value: srcA },
                uSrcB: { value: srcB },
            },
        })
        const geometry = new THREE.PlaneGeometry(2, 2)
        scene.add(new THREE.Mesh(geometry, material))

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            renderer.setSize(w, h, false)
            material.uniforms.uAspect.value = w / h
            renderer.render(scene, camera)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(mount)

        const clock = new THREE.Clock()
        let rafId = 0
        let running = false

        const loop = () => {
            material.uniforms.uTime.value = clock.getElapsedTime() + 4.0
            renderer.render(scene, camera)
            rafId = requestAnimationFrame(loop)
        }
        const start = () => {
            if (running || reduceMotion) return
            running = true
            clock.start()
            loop()
        }
        const stop = () => {
            running = false
            cancelAnimationFrame(rafId)
        }

        const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0 })
        io.observe(mount)
        const onVisibility = () => (document.hidden ? stop() : start())
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            stop()
            io.disconnect()
            ro.disconnect()
            document.removeEventListener('visibilitychange', onVisibility)
            geometry.dispose()
            material.dispose()
            renderer.dispose()
            if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
        }
    }, [])

    return <div ref={mountRef} className="hero-canvas" aria-hidden="true" />
}