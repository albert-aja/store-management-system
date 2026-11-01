// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ArRoomPreviewModal } from './ArRoomPreviewModal';
import { ProductDetail } from '../types';
import { I18nProvider } from '../i18n';

const mockProduct: ProductDetail = {
  id: 'prod-sofa-001',
  name: 'Sofa Bed L-Shape Scandinavian 3 Seater',
  code: 'FURN-SOFA-01',
  description: 'Sofa minimalis rangka kayu solid mahoni',
  brandName: 'Comfort Living',
  categoryName: 'Furniture & Living',
  minPrice: 4500000,
  maxPrice: 4500000,
  primaryImageUrl: 'https://example.com/sofa.jpg',
  imageUrls: ['https://example.com/sofa.jpg'],
  commercialAvailability: 'IN_STOCK',
  leadTimeDays: 1,
  totalStockCount: 5,
  variants: [],
  specifications: {
    'Rangka': 'Kayu Solid',
    'Bahan': 'Kain Fabric Premium',
  },
  arModel: {
    isSupported: true,
    furnitureType: 'SOFA',
    modelGlbUrl: 'https://example.com/sofa.glb',
    modelUsdzUrl: 'https://example.com/sofa.usdz',
    widthCm: 210,
    depthCm: 90,
    heightCm: 85,
    defaultColor: 'Charcoal Grey',
    colorVariants: [
      { name: 'Charcoal Grey', hexCode: '#374151', materialFinish: 'Woven Fabric' },
      { name: 'Cream White', hexCode: '#F3F4F6', materialFinish: 'Boucle Fabric' },
    ],
    hotspots: [
      { title: 'Busa High-Density 30', description: 'Tahan kempes 5 tahun', relativeX: 0, relativeY: 0.4, relativeZ: 0 },
    ],
    roomPlacement: 'FLOOR',
    recommendedRoom: 'LIVING_ROOM',
  },
};

describe('ArRoomPreviewModal', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      ellipse: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      setLineDash: vi.fn(),
      fillText: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders modal with 3D Studio, dimensions, and color swatches when open', () => {
    const handleClose = vi.fn();
    render(
      <I18nProvider>
        <ArRoomPreviewModal
          isOpen={true}
          onClose={handleClose}
          product={mockProduct}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/Pratinjau Ruangan 3D & AR/i)).toBeDefined();
    expect(screen.getByText(/210 × 90 × 85/i)).toBeDefined();
    expect(screen.getAllByText(/Charcoal Grey/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Cream White/i)).toBeDefined();
  });

  it('switches to Room Fit Calculator and evaluates clearance', () => {
    render(
      <I18nProvider>
        <ArRoomPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          product={mockProduct}
        />
      </I18nProvider>
    );

    // Click "Cek Ukuran Ruangan"
    const fitTab = screen.getByRole('button', { name: /Cek Ukuran Ruangan/i });
    fireEvent.click(fitTab);

    expect(screen.getByText(/Kalkulator Muat Ruangan & Akses Sirkulasi/i)).toBeDefined();
    expect(screen.getByText(/Sisa Ruang Panjang:/i)).toBeDefined();
    expect(screen.getByText(/Sisa Ruang Lebar:/i)).toBeDefined();
  });

  it('switches to AR Camera tab and displays QR code and WebXR links', () => {
    render(
      <I18nProvider>
        <ArRoomPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          product={mockProduct}
        />
      </I18nProvider>
    );

    // Click "Kamera AR"
    const arTab = screen.getByRole('button', { name: /Kamera AR/i });
    fireEvent.click(arTab);

    expect(screen.getByText(/Pindai dengan Smartphone untuk AR Nyata/i)).toBeDefined();
    expect(screen.getByText(/Buka di Google Scene Viewer/i)).toBeDefined();
    expect(screen.getByText(/Buka di Apple Quick Look/i)).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <I18nProvider>
        <ArRoomPreviewModal
          isOpen={true}
          onClose={handleClose}
          product={mockProduct}
        />
      </I18nProvider>
    );

    const closeBtn = screen.getByLabelText(/Tutup|Close/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
