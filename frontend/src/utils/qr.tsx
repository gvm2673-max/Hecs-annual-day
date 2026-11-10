import React, { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
}

export const QRCodeCanvas: React.FC<QRCodeProps> = ({
  value,
  size = 200,
  className = '',
  fgColor = '#16834A',
  bgColor = '#ffffff'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const encoded = encodeURIComponent(value);
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
    };

    img.onerror = () => {
      ctx.fillStyle = fgColor;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', size / 2, size / 2);
    };
  }, [value, size, fgColor, bgColor]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-xl border border-[#E5E7EB] shadow-xs ${className}`}
    />
  );
};
