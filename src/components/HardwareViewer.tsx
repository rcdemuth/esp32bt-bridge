import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Layers,
  Cpu,
  Zap,
  Radio,
  Sliders,
  Download,
  Info,
  RotateCw,
  Box,
  Maximize2
} from 'lucide-react';
import { HardwareVariant } from '../types/bluesmirf';

const VARIANTS: {
  id: HardwareVariant;
  name: string;
  sku: string;
  modelGlb: string;
  poster: string;
  headerType: string;
  description: string;
}[] = [
  {
    id: 'pth',
    name: 'SparkFun BlueSMiRF v2 (PTH)',
    sku: 'WRL-24113',
    modelGlb: '/assets/3d_model/web_model-pth.glb',
    poster: '/assets/3d_model/poster-pth.png',
    headerType: 'Plated Through-Hole 1x6 (Unpopulated)',
    description: 'Direct PTH unpopulated pads ready for custom female headers, right-angle headers, or direct wire soldering. Matches classic FTDI & Bluetooth Mate pinouts.'
  },
  {
    id: 'headers',
    name: 'SparkFun BlueSMiRF v2 - Headers',
    sku: 'WRL-23287',
    modelGlb: '/assets/3d_model/web_model-smd.glb',
    poster: '/assets/3d_model/poster-smd.png',
    headerType: 'Pre-soldered 1x6 Right-Angle Male Header',
    description: 'Pre-assembled with right-angle male header pins. Plugs directly into female headers of Arduino Pro, Pro Mini, and breadboards with zero soldering required.'
  },
  {
    id: 'jst',
    name: 'SparkFun BlueSMiRF v2 - JST-GH',
    sku: 'WRL-30414',
    modelGlb: '/assets/3d_model/web_model-jst.glb',
    poster: '/assets/3d_model/poster-jst.png',
    headerType: 'Locking 6-pin JST-GH Connector',
    description: 'Equipped with a secure vibration-resistant 6-pin JST-GH connector. Ideal for UAVs, robotics, GNSS/GPS units, and harsh outdoor environments.'
  }
];

const PINOUT = [
  {
    pin: 1,
    name: 'GND',
    type: 'Power',
    color: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    desc: 'Ground reference for power and logic signals (0V).'
  },
  {
    pin: 2,
    name: 'CTS',
    type: 'Input (Flow Control)',
    color: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    desc: 'Clear to Send. Driven LOW by host when host is ready to accept data from BlueSMiRF. 3.3V - 5V level shifted.'
  },
  {
    pin: 3,
    name: 'VCC',
    type: 'Power In',
    color: 'bg-red-950 text-red-300 border-red-800',
    desc: 'Power input: 3.3V to 5.0V DC. Powers onboard AP2112K 3.3V low-dropout voltage regulator.'
  },
  {
    pin: 4,
    name: 'TXO',
    type: 'Serial Out (3.3V)',
    color: 'bg-sky-950 text-sky-300 border-sky-800',
    desc: 'UART Transmit Output from BlueSMiRF ESP32. Connects to target microcontroller RX pin.'
  },
  {
    pin: 5,
    name: 'RXI',
    type: 'Serial In (5V Safe)',
    color: 'bg-amber-950 text-amber-300 border-amber-800',
    desc: 'UART Receive Input into BlueSMiRF. Connects to target microcontroller TX pin. 3.3V - 5V level shifted.'
  },
  {
    pin: 6,
    name: 'RTS',
    type: 'Output (Flow Control)',
    color: 'bg-purple-950 text-purple-300 border-purple-800',
    desc: 'Request to Send. Driven LOW by BlueSMiRF when internal receive buffer has capacity for more bytes.'
  }
];

export const HardwareViewer: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<HardwareVariant>('pth');
  const [activePin, setActivePin] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const currentVariant = VARIANTS.find(v => v.id === selectedVariant) || VARIANTS[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize Three.js Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090d16);

    const width = canvas.clientWidth || 600;
    const height = canvas.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 30, 45);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      rendererRef.current = renderer;
    } catch (e) {
      console.warn('WebGL not supported, falling back to 2D poster', e);
      setModelError(true);
      return;
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.0);
    dirLight2.position.set(-20, -10, -20);
    scene.add(dirLight2);

    // Subtle grid platform
    const gridHelper = new THREE.GridHelper(50, 20, 0x334155, 0x1e293b);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    // Render loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate;
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvas || !rendererRef.current) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
    };
  }, []);

  // Load 3D GLB model when variant changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setModelLoading(true);
    setModelError(false);

    if (currentModelRef.current) {
      scene.remove(currentModelRef.current);
      currentModelRef.current = null;
    }

    const loader = new GLTFLoader();
    loader.load(
      currentVariant.modelGlb,
      gltf => {
        const model = gltf.scene;

        // Auto center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 25 / (maxDim || 1);

        model.scale.set(scale, scale, scale);
        model.position.sub(center.clone().multiplyScalar(scale));
        model.position.y += 2;

        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (wireframe && child.material) {
              child.material.wireframe = true;
            }
          }
        });

        scene.add(model);
        currentModelRef.current = model;
        setModelLoading(false);
      },
      undefined,
      err => {
        console.warn('Could not load GLB model, fallback to poster', err);
        setModelLoading(false);
        setModelError(true);
      }
    );
  }, [selectedVariant, wireframe]);

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="space-y-6">
      {/* Variant Selector Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-red-500" />
              Hardware Variants & 3D Interactive Viewer
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select between the 3 hardware form-factors to inspect pinout specifications, 3D geometry, and jumpers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {VARIANTS.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedVariant === v.id
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {v.name.replace('SparkFun BlueSMiRF v2', '').trim() || 'PTH (Unpopulated)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: 3D Viewer & Hardware Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Model Display */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-semibold text-slate-200">{currentVariant.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {currentVariant.sku}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                  autoRotate ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400'
                }`}
                title="Toggle Auto-Rotation"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Spin</span>
              </button>
              <button
                onClick={() => setWireframe(!wireframe)}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                  wireframe ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400'
                }`}
                title="Toggle Wireframe Mesh"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mesh</span>
              </button>
              <button
                onClick={resetView}
                className="p-1.5 rounded text-xs bg-slate-800 text-slate-400 hover:text-white"
                title="Reset Camera View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-[420px] bg-slate-950 flex items-center justify-center">
            {modelLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs text-slate-400 font-mono">Loading 3D CAD mesh...</span>
              </div>
            )}

            {modelError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <img
                  src={currentVariant.poster}
                  alt={currentVariant.name}
                  className="max-h-[300px] object-contain rounded-lg shadow-md mb-4"
                />
                <p className="text-xs text-slate-400 max-w-sm">
                  Interactive 3D preview rendered via high-resolution CAD snapshot.
                </p>
              </div>
            ) : (
              <canvas ref={canvasRef} className="w-full h-full min-h-[420px] cursor-grab active:cursor-grabbing" />
            )}

            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400 pointer-events-none">
              Left Click + Drag: Orbit • Right Click: Pan • Scroll: Zoom
            </div>
          </div>

          <div className="p-4 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400">
            {currentVariant.description}
          </div>
        </div>

        {/* Pinout & Specs Section */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pinout Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              Standard 1x6 FTDI-Compatible Pinout
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              BlueSMiRF v2 uses the industry-standard FTDI/Bluetooth Mate pinout sequence. Hover over any pin for electrical details:
            </p>

            <div className="space-y-2">
              {PINOUT.map(p => {
                const isSelected = activePin === p.pin;
                return (
                  <div
                    key={p.pin}
                    onMouseEnter={() => setActivePin(p.pin)}
                    onMouseLeave={() => setActivePin(null)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-red-500/60 shadow'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                          {p.pin}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${p.color}`}>
                          {p.name}
                        </span>
                        <span className="text-xs text-slate-400">{p.type}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <p className="mt-2 text-xs text-slate-300 pl-7 leading-relaxed animate-fadeIn">
                        {p.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solder Jumpers Guide */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-emerald-400" />
              On-Board Solder Jumpers
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
                  <span>PWR (VCC Bypass Jumper)</span>
                  <span className="text-emerald-400 font-mono">Open by default</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Located on top of the board. By default, VCC feeds the onboard AP2112K 3.3V 600mA regulator (safe for 3.3V-5V). Close this jumper with solder ONLY if supplying an already-regulated pure 3.3V DC to bypass the regulator.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
                  <span>BTN (Pair Button Jumper)</span>
                  <span className="text-sky-400 font-mono">Closed by default</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Located on the back of the board. Connects the physical PAIR push-button to ESP32 GPIO 0. Cut this trace with an X-Acto knife if you need to permanently lock or disable physical button pairing in field deployments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Specs & Downloads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-red-500" />
            Key Technical Specifications
          </h3>

          <div className="divide-y divide-slate-800 text-xs">
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Microcontroller / Radio</span>
              <span className="text-slate-200 font-mono font-medium">Espressif ESP32-PICO-MINI-02</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Bluetooth Support</span>
              <span className="text-slate-200 font-medium">Bluetooth Classic SPP & BLE (Bluetooth Low Energy)</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Supported Baud Rates</span>
              <span className="text-slate-200 font-mono">2400 to 921,600 bps (Duplex)</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Logic Levels</span>
              <span className="text-slate-200 font-medium">3.3V - 5V Logic Tolerant (Bi-directional Level Shifting)</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Operating Voltage</span>
              <span className="text-slate-200 font-mono">3.3V to 5.0V DC</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Wireless Range</span>
              <span className="text-slate-200 font-medium">Up to 100 ft (33m) indoors</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">OTA Firmware Updates</span>
              <span className="text-slate-200 font-medium">2.4GHz Wi-Fi 802.11 b/g/n</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Download className="w-4 h-4 text-sky-400" />
            Design Files & Documentation
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Direct access to all open-source hardware schematics, Gerber archives, CAD step files, and datasheets from this repository:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <a
              href="/assets/board_files/schematic-pth.pdf"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
              <Info className="w-4 h-4 text-red-400 shrink-0" />
              <span>PTH Schematic (PDF)</span>
            </a>
            <a
              href="/assets/board_files/schematic-smd.pdf"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>SMD Schematic (PDF)</span>
            </a>
            <a
              href="/assets/board_files/schematic-jst.pdf"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>JST Schematic (PDF)</span>
            </a>
            <a
              href="/assets/board_files/dimensions-pth.pdf"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Dimensions Guide</span>
            </a>
            <a
              href="/assets/component_documentation/esp32-pico-mini-02_datasheet_en.pdf"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
              <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
              <span>ESP32 Datasheet</span>
            </a>
            <a
              href="/assets/3d_model/step_files.zip"
              className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
              <Download className="w-4 h-4 text-red-500 shrink-0" />
              <span>3D CAD Step Models</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
