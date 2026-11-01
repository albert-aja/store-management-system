import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { ProductDetail, ArColorVariant, ArHotspot } from '../types';
import {
  X,
  Camera,
  Rotate3d,
  Ruler,
  Sparkles,
  QrCode,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface ArRoomPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDetail;
}

export const ArRoomPreviewModal: React.FC<ArRoomPreviewModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { t } = useI18n();

  // Active Tab: '3d' | 'ar' | 'fit'
  const [activeTab, setActiveTab] = useState<'3d' | 'ar' | 'fit'>('3d');

  // AR model data with sensible fallbacks
  const arModel = product.arModel || {
    isSupported: true,
    furnitureType: product.name.toLowerCase().includes('sofa')
      ? 'SOFA'
      : product.name.toLowerCase().includes('lemari') || product.name.toLowerCase().includes('wardrobe')
      ? 'WARDROBE'
      : product.name.toLowerCase().includes('makan') || product.name.toLowerCase().includes('dining')
      ? 'DINING_SET'
      : 'FURNITURE_GENERAL',
    modelGlbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb',
    modelUsdzUrl: 'https://developer.apple.com/augmented-reality/quick-look/models/chair/chair.usdz',
    widthCm: product.name.toLowerCase().includes('sofa') ? 210 : product.name.toLowerCase().includes('lemari') ? 120 : 160,
    depthCm: product.name.toLowerCase().includes('sofa') ? 90 : product.name.toLowerCase().includes('lemari') ? 60 : 90,
    heightCm: product.name.toLowerCase().includes('sofa') ? 85 : product.name.toLowerCase().includes('lemari') ? 200 : 75,
    defaultColor: 'Charcoal Grey',
    colorVariants: [
      { name: 'Charcoal Grey', hexCode: '#374151', materialFinish: 'Woven Fabric' },
      { name: 'Cream White', hexCode: '#F3F4F6', materialFinish: 'Boucle Fabric' },
      { name: 'Warm Oak', hexCode: '#B45309', materialFinish: 'Wood Grain' },
      { name: 'Navy Blue', hexCode: '#1E3A8A', materialFinish: 'Velvet Fabric' },
    ],
    hotspots: [
      { title: 'Busa High-Density 30', description: 'Bantalan busa cetak tahan kempes', relativeX: 0, relativeY: 0.4, relativeZ: 0 },
      { title: 'Rangka Kayu Solid', description: 'Kayu oven anti-rayap kokoh', relativeX: -0.5, relativeY: 0.2, relativeZ: 0 },
    ],
    roomPlacement: 'FLOOR',
    recommendedRoom: 'LIVING_ROOM',
  };

  const [selectedColor, setSelectedColor] = useState<ArColorVariant>(
    arModel.colorVariants && arModel.colorVariants.length > 0
      ? arModel.colorVariants[0]
      : { name: 'Natural Grey', hexCode: '#4B5563', materialFinish: 'Fabric' }
  );

  const [selectedRoomBg, setSelectedRoomBg] = useState<'minimal' | 'living' | 'bedroom' | 'dining'>('living');
  const [activeHotspot, setActiveHotspot] = useState<ArHotspot | null>(null);
  const [partOpen, setPartOpen] = useState(false);

  // 3D Canvas Orbit State
  const [rotX, setRotX] = useState(25);
  const [rotY, setRotY] = useState(45);
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // AR Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [arScale, setArScale] = useState(1.0);
  const [arPos, setArPos] = useState({ x: 50, y: 65 });
  const [isCopied, setIsCopied] = useState(false);

  // Room Fit Calculator State
  const [roomLengthInput, setRoomLengthInput] = useState<number>(300);
  const [roomWidthInput, setRoomWidthInput] = useState<number>(250);

  // Render 3D Canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background Room Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (selectedRoomBg === 'living') {
      bgGradient.addColorStop(0, '#f1f5f9');
      bgGradient.addColorStop(0.65, '#e2e8f0');
      bgGradient.addColorStop(1, '#cbd5e1');
    } else if (selectedRoomBg === 'bedroom') {
      bgGradient.addColorStop(0, '#fdf4ff');
      bgGradient.addColorStop(0.65, '#fae8ff');
      bgGradient.addColorStop(1, '#f5d0fe');
    } else if (selectedRoomBg === 'dining') {
      bgGradient.addColorStop(0, '#fffbeb');
      bgGradient.addColorStop(0.65, '#fef3c7');
      bgGradient.addColorStop(1, '#fde68a');
    } else {
      bgGradient.addColorStop(0, '#f8fafc');
      bgGradient.addColorStop(0.65, '#e2e8f0');
      bgGradient.addColorStop(1, '#94a3b8');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Floor Perspective Grid
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 1;
    const centerX = width / 2;
    const centerY = height / 2 + 50;

    for (let r = -200; r <= 200; r += 40) {
      ctx.beginPath();
      ctx.moveTo(centerX - 240, centerY + r * 0.4);
      ctx.lineTo(centerX + 240, centerY + r * 0.4);
      ctx.stroke();
    }
    for (let c = -240; c <= 240; c += 40) {
      ctx.beginPath();
      ctx.moveTo(centerX + c, centerY - 80);
      ctx.lineTo(centerX + c * 1.5, centerY + 120);
      ctx.stroke();
    }

    // Shadow on Floor
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 40, 110 * zoom, 40 * zoom, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.fill();

    // Render Furniture Geometry based on type
    const radY = (rotY * Math.PI) / 180;
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);

    const fType = arModel.furnitureType;
    const baseColor = selectedColor.hexCode;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);

    // Helper for 3D Box Face Rendering
    const drawBox = (
      bx: number,
      by: number,
      bz: number,
      bw: number,
      bh: number,
      bd: number,
      color: string,
      highlight: number = 0
    ) => {
      // 8 Vertices
      const v = [
        { x: bx - bw / 2, y: by - bh / 2, z: bz - bd / 2 },
        { x: bx + bw / 2, y: by - bh / 2, z: bz - bd / 2 },
        { x: bx + bw / 2, y: by + bh / 2, z: bz - bd / 2 },
        { x: bx - bw / 2, y: by + bh / 2, z: bz - bd / 2 },
        { x: bx - bw / 2, y: by - bh / 2, z: bz + bd / 2 },
        { x: bx + bw / 2, y: by - bh / 2, z: bz + bd / 2 },
        { x: bx + bw / 2, y: by + bh / 2, z: bz + bd / 2 },
        { x: bx - bw / 2, y: by + bh / 2, z: bz + bd / 2 },
      ];

      // Rotate around Y
      const p = v.map((pt) => {
        const rx = pt.x * cosY - pt.z * sinY;
        const rz = pt.x * sinY + pt.z * cosY;
        const ry = pt.y - (rotX * 0.4);
        return { x: rx, y: ry + rz * 0.2 };
      });

      // Front Face
      ctx.beginPath();
      ctx.moveTo(p[4].x, p[4].y);
      ctx.lineTo(p[5].x, p[5].y);
      ctx.lineTo(p[6].x, p[6].y);
      ctx.lineTo(p[7].x, p[7].y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.stroke();

      // Top Face
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      ctx.lineTo(p[1].x, p[1].y);
      ctx.lineTo(p[5].x, p[5].y);
      ctx.lineTo(p[4].x, p[4].y);
      ctx.closePath();
      ctx.fillStyle = shadeColor(color, 25 + highlight);
      ctx.fill();
      ctx.stroke();

      // Right / Side Face
      ctx.beginPath();
      ctx.moveTo(p[1].x, p[1].y);
      ctx.lineTo(p[2].x, p[2].y);
      ctx.lineTo(p[6].x, p[6].y);
      ctx.lineTo(p[5].x, p[5].y);
      ctx.closePath();
      ctx.fillStyle = shadeColor(color, -25);
      ctx.fill();
      ctx.stroke();
    };

    if (fType === 'SOFA') {
      // Main Base / Seat
      drawBox(0, 10, 0, 140, 24, 65, baseColor);
      // Backrest
      drawBox(0, -25, -25, 140, 50, 20, shadeColor(baseColor, -10));
      // Left Armrest
      drawBox(-72, -5, 0, 16, 40, 70, shadeColor(baseColor, 10));
      // Right Armrest
      drawBox(72, -5, 0, 16, 40, 70, shadeColor(baseColor, -15));
      // Cushions
      drawBox(-35, -2, 0, 60, 16, 55, shadeColor(baseColor, 20));
      drawBox(35, -2, 0, 60, 16, 55, shadeColor(baseColor, 20));
      // Throw Pillows if open
      if (partOpen) {
        drawBox(-45, -22, -10, 22, 22, 12, '#f59e0b', 15);
        drawBox(45, -22, -10, 22, 22, 12, '#10b981', 15);
      }
      // Wooden Legs
      drawBox(-65, 30, -25, 8, 14, 8, '#78350f');
      drawBox(65, 30, -25, 8, 14, 8, '#78350f');
      drawBox(-65, 30, 25, 8, 14, 8, '#78350f');
      drawBox(65, 30, 25, 8, 14, 8, '#78350f');
    } else if (fType === 'WARDROBE') {
      // Main Body
      drawBox(0, -40, 0, 95, 150, 48, baseColor);
      // Sliding Doors
      const doorOffset = partOpen ? 25 : 0;
      drawBox(-24 - doorOffset, -40, 26, 46, 146, 6, shadeColor(baseColor, 15));
      drawBox(24, -40, 28, 46, 146, 6, shadeColor(baseColor, -10));
      // Top Plinth
      drawBox(0, -116, 0, 98, 8, 52, shadeColor(baseColor, 20));
      // Metal Handles
      drawBox(-5 - doorOffset, -40, 31, 2, 28, 2, '#94a3b8');
      drawBox(5, -40, 33, 2, 28, 2, '#94a3b8');
    } else if (fType === 'DINING_SET') {
      // Table Top
      drawBox(0, -10, 0, 130, 10, 75, baseColor, 10);
      // Table Legs
      drawBox(-55, 20, -28, 8, 50, 8, '#1e293b');
      drawBox(55, 20, -28, 8, 50, 8, '#1e293b');
      drawBox(-55, 20, 28, 8, 50, 8, '#1e293b');
      drawBox(55, 20, 28, 8, 50, 8, '#1e293b');
      // Chairs
      const chairShift = partOpen ? 30 : 5;
      // Front Chair
      drawBox(0, 15, 45 + chairShift, 32, 4, 30, shadeColor(baseColor, -20));
      drawBox(0, -5, 60 + chairShift, 32, 38, 4, shadeColor(baseColor, -20));
      // Back Chair
      drawBox(0, 15, -45 - chairShift, 32, 4, 30, shadeColor(baseColor, -20));
      drawBox(0, -5, -60 - chairShift, 32, 38, 4, shadeColor(baseColor, -20));
    } else {
      // General Furniture Box / Cabinet
      drawBox(0, 0, 0, 100, 60, 50, baseColor);
      drawBox(0, -32, 0, 104, 6, 54, shadeColor(baseColor, 25));
    }

    // Dimension Callout Lines & Badges
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Width (Panjang) Dimension Line
    const wY = centerY + 65 * zoom;
    ctx.beginPath();
    ctx.moveTo(centerX - 80 * zoom, wY);
    ctx.lineTo(centerX + 80 * zoom, wY);
    ctx.stroke();

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${t('Panjang')}: ${arModel.widthCm} cm`, centerX, wY + 16);

    // Height (Tinggi) Dimension Line
    const hX = centerX + 115 * zoom;
    ctx.beginPath();
    ctx.moveTo(hX, centerY - 80 * zoom);
    ctx.lineTo(hX, centerY + 30 * zoom);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillText(`${t('Tinggi')}: ${arModel.heightCm} cm`, hX + 6, centerY - 25 * zoom);

    ctx.restore();
  }, [isOpen, rotX, rotY, zoom, selectedColor, selectedRoomBg, partOpen, arModel]);

  // Color shading utility
  const shadeColor = (color: string, percent: number) => {
    let R = parseInt(color.substring(1, 3), 16) || 100;
    let G = parseInt(color.substring(3, 5), 16) || 100;
    let B = parseInt(color.substring(5, 7), 16) || 100;
    R = Math.min(255, Math.max(0, Math.round(R * (1 + percent / 100))));
    G = Math.min(255, Math.max(0, Math.round(G * (1 + percent / 100))));
    B = Math.min(255, Math.max(0, Math.round(B * (1 + percent / 100))));
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  };

  // Mouse / Touch handlers for 3D Orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotY((prev) => (prev + dx * 0.8) % 360);
    setRotX((prev) => Math.max(-10, Math.min(60, prev + dy * 0.5)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Camera AR stream start/stop
  const toggleCameraAr = async () => {
    if (cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      return;
    }

    try {
      setCameraError(false);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError(true);
      }
    } catch (err) {
      console.warn('Camera AR initialization error:', err);
      setCameraError(true);
    }
  };

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen && cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    }
  }, [isOpen, cameraActive]);

  // Copy AR link to clipboard
  const handleCopyArLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Clearance calculations
  const clearanceLength = roomLengthInput - arModel.widthCm;
  const clearanceWidth = roomWidthInput - arModel.depthCm;
  const minClearance = Math.min(clearanceLength, clearanceWidth);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/10 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {t('Pratinjau Ruangan 3D & AR')}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  {t('WebXR')}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {`${product.name} • ${t('Dimensi Realistik')}: ${arModel.widthCm} × ${arModel.depthCm} × ${arModel.heightCm} ${t('cm')}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t('Tutup')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-6 text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('3d')}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === '3d'
                ? 'border-sky-600 text-sky-700 font-extrabold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Rotate3d className="w-4 h-4" />
            {t('3D Interaktif')}
          </button>
          <button
            onClick={() => setActiveTab('ar')}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'ar'
                ? 'border-sky-600 text-sky-700 font-extrabold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            {t('Kamera AR')}
          </button>
          <button
            onClick={() => setActiveTab('fit')}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'fit'
                ? 'border-sky-600 text-sky-700 font-extrabold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Ruler className="w-4 h-4" />
            {t('Cek Ukuran Ruangan')}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-6">
          {/* TAB 1: 3D INTERACTIVE */}
          {activeTab === '3d' && (
            <div className="space-y-6">
              {/* 3D Canvas Box */}
              <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 flex items-center justify-center select-none">
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={420}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                />

                {/* Floating Orbit Toolbar */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-700 shadow-sm flex items-center gap-2">
                    <Rotate3d className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                    <span>{t('Gunakan mouse drag atau touch untuk memutar 360°, scroll untuk zoom.')}</span>
                  </div>
                </div>

                <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                  <button
                    onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
                    title={t('Perbesar')}
                    aria-label={t('Perbesar')}
                    className="p-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-sm text-slate-700 transition"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                    title={t('Perkecil')}
                    aria-label={t('Perkecil')}
                    className="p-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-sm text-slate-700 transition"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setRotX(25);
                      setRotY(45);
                      setZoom(1.0);
                    }}
                    title={t('Reset Tampilan')}
                    aria-label={t('Reset Tampilan')}
                    className="p-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-sm text-slate-700 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Part Animation Toggle */}
                <div className="absolute bottom-4 left-4">
                  <button
                    onClick={() => setPartOpen(!partOpen)}
                    className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-800 flex items-center gap-2 transition"
                  >
                    <Sliders className="w-3.5 h-3.5 text-sky-600" />
                    <span>{partOpen ? t('Tutup Pintu / Bagian') : t('Buka Pintu / Bagian')}</span>
                  </button>
                </div>
              </div>

              {/* Controls: Color Swatches & Room Setting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-2xl border border-slate-200">
                {/* Color & Material Selector */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {t('Pilihan Warna & Bahan:')}
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {arModel.colorVariants.map((col, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(col)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                          selectedColor.name === col.name
                            ? 'border-sky-600 bg-sky-50 text-sky-950 ring-2 ring-sky-600/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: col.hexCode }}
                        />
                        <span>{col.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({col.materialFinish})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room Background Theme */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {t('Latar Ruangan:')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'living', label: t('Ruang Keluarga') },
                      { id: 'bedroom', label: t('Kamar Tidur') },
                      { id: 'dining', label: t('Ruang Makan') },
                      { id: 'minimal', label: t('Studio Minimalis') },
                    ].map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoomBg(room.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                          selectedRoomBg === room.id
                            ? 'border-slate-800 bg-slate-900 text-white font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {room.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hotspots & Key Features */}
              {arModel.hotspots && arModel.hotspots.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {t('Fitur & Konstruksi Mebel:')}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {arModel.hotspots.map((hs, i) => (
                      <div
                        key={i}
                        onClick={() => setActiveHotspot(activeHotspot?.title === hs.title ? null : hs)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          activeHotspot?.title === hs.title
                            ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-sm'
                            : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                          <span>{hs.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {hs.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AR CAMERA & WEBXR */}
          {activeTab === 'ar' && (
            <div className="space-y-6">
              {/* Web Camera Live AR Section */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-sky-600" />
                      <span>{t('Kamera AR')}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('Arahkan kamera ke lantai ruangan Anda lalu geser furnitur untuk memposisikan.')}
                    </p>
                  </div>

                  <button
                    onClick={toggleCameraAr}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
                      cameraActive
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>{cameraActive ? t('Matikan Kamera') : t('Aktifkan Kamera AR')}</span>
                  </button>
                </div>

                {cameraError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>{t('Kamera tidak tersedia atau izin ditolak. Anda dapat mencoba mode 3D Interaktif.')}</span>
                  </div>
                )}

                {/* Viewport Box */}
                <div className="relative w-full h-[380px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />

                  {!cameraActive && (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center border border-slate-700">
                        <Camera className="w-7 h-7" />
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {t('Arahkan kamera ke lantai ruangan Anda lalu geser furnitur untuk memposisikan.')}
                      </p>
                      <button
                        onClick={toggleCameraAr}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition"
                      >
                        {t('Aktifkan Kamera AR')}
                      </button>
                    </div>
                  )}

                  {cameraActive && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${arPos.x}%`,
                        top: `${arPos.y}%`,
                        transform: `translate(-50%, -50%) scale(${arScale})`,
                      }}
                      className="cursor-move pointer-events-auto"
                    >
                      <div className="relative p-2 rounded-2xl bg-black/20 backdrop-blur-xs border border-white/40">
                        <div
                          className="w-36 h-24 rounded-xl shadow-2xl flex items-center justify-center border-2 border-white/60 text-white font-extrabold text-xs"
                          style={{ backgroundColor: selectedColor.hexCode }}
                        >
                          <span className="drop-shadow">{`${product.name.split(' ')[0]} ${t('3D AR')}`}</span>
                        </div>
                        <div className="w-36 h-8 -bottom-3 left-0 absolute bg-black/40 rounded-full blur-md -z-10" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop / Mobile QR Code Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-2xl border border-slate-200">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-sky-600" />
                    <span>{t('Pindai dengan Smartphone untuk AR Nyata')}</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('Buka kamera ponsel Anda dan arahkan ke QR code ini untuk melihat mebel langsung di ruangan Anda melalui WebXR / AR.')}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleCopyArLink}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{isCopied ? t('Tautan AR disalin!') : t('Salin Tautan AR')}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {/* Decorative QR Pattern */}
                  <div className="w-32 h-32 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                      <rect width="100" height="100" fill="white" />
                      <path
                        d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z
                           M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z
                           M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z
                           M45,15 h10 v10 h-10 z M45,35 h10 v10 h-10 z M15,45 h10 v10 h-10 z
                           M35,45 h10 v10 h-10 z M55,45 h20 v10 h-20 z M45,65 h10 v20 h-10 z
                           M65,65 h20 v10 h-20 z M75,75 h15 v15 h-15 z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <span className="text-[11px] font-bold text-slate-800 block">
                      {t('Native WebXR & Scene Viewer')}
                    </span>
                    <a
                      href={`intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(arModel.modelGlbUrl)}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:underline font-semibold block"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('Buka di Google Scene Viewer')}</span>
                    </a>
                    <a
                      href={arModel.modelUsdzUrl}
                      rel="ar"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:underline font-semibold block"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('Buka di Apple Quick Look')}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROOM FIT & CLEARANCE CALCULATOR */}
          {activeTab === 'fit' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-sky-600" />
                  <span>{t('Kalkulator Muat Ruangan & Akses Sirkulasi')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t('Masukkan ukuran area tempat Anda berencana meletakkan mebel ini:')}
                </p>
              </div>

              {/* Input Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t('Panjang Area Ruangan (cm):')}
                  </label>
                  <input
                    type="number"
                    value={roomLengthInput}
                    onChange={(e) => setRoomLengthInput(Math.max(50, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                  />
                  <span className="text-[10px] text-slate-400">
                    {`${t('Panjang')} ${t('mebel:')} ${arModel.widthCm} ${t('cm')}`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t('Lebar Area Ruangan (cm):')}
                  </label>
                  <input
                    type="number"
                    value={roomWidthInput}
                    onChange={(e) => setRoomWidthInput(Math.max(50, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                  />
                  <span className="text-[10px] text-slate-400">
                    {`${t('Lebar')} ${t('mebel:')} ${arModel.depthCm} ${t('cm')}`}
                  </span>
                </div>
              </div>

              {/* Results & Fit Status */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  {t('Hasil Analisis Muat Ruangan:')}
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[11px] block">{t('Sisa Ruang Panjang:')}</span>
                    <span className={`text-base font-extrabold ${clearanceLength >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                      {clearanceLength >= 0 ? `+${clearanceLength} cm` : `${clearanceLength} cm`}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[11px] block">{t('Sisa Ruang Lebar:')}</span>
                    <span className={`text-base font-extrabold ${clearanceWidth >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                      {clearanceWidth >= 0 ? `+${clearanceWidth} cm` : `${clearanceWidth} cm`}
                    </span>
                  </div>
                </div>

                {/* Status Advice Box */}
                {clearanceLength < 0 || clearanceWidth < 0 ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{t('Tidak Muat')}</span>
                      <p className="mt-0.5">
                        {t('Peringatan: Ukuran mebel melebihi area ruangan yang Anda masukkan!')}
                      </p>
                    </div>
                  </div>
                ) : minClearance >= 80 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{t('Ideal')}</span>
                      <p className="mt-0.5">
                        {t('Sangat Ideal: Ruang sirkulasi jalan lebih dari 80 cm, sangat leluasa.')}
                      </p>
                    </div>
                  </div>
                ) : minClearance >= 50 ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{t('Muat')}</span>
                      <p className="mt-0.5">
                        {t('Pas: Cukup untuk sirkulasi jalan standar (50 - 79 cm). Pastikan tidak terhalang pintu.')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-800 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{t('Sempit')}</span>
                      <p className="mt-0.5">
                        {t('Peringatan: Area terlalu sempit (sisa ruang kurang dari 50 cm). Pertimbangkan ukuran varian lebih ringkas.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span>{t('Pilihan Warna & Bahan:')} </span>
            <span className="font-bold text-slate-800">{selectedColor.name}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                `${t('Halo SMS Mart, saya ingin bertanya tentang kesesuaian ukuran furnitur ')}${product.name} (${arModel.widthCm}x${arModel.depthCm}x${arModel.heightCm} cm).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-center"
            >
              {t('Tanya Sales via WhatsApp')}
            </a>

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition text-center"
            >
              {t('Pilih Varian Ini & Beli')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
