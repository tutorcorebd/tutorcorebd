import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, RotateCw, Check, Upload, Camera } from 'lucide-react';

const ImageCropperModal = ({ isOpen, onClose, imageSrc, onCropComplete, title = "Crop Image" }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSaveCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    // Create secondary canvas to draw the cropped portion
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Standard crop dimensions (ideal ID card / document ratio is roughly 1.6:1)
    // We downscale target resolution to max 1000px width to optimize Supabase storage space
    const targetWidth = 1000;
    const targetHeight = 625; // 1.6 ratio
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Bounding container to find crop box dimensions
    const container = containerRef.current;
    const cropBoxWidth = Math.min(container.clientWidth - 40, 400);

    // Scale factor from display to canvas pixels
    const canvasScale = targetWidth / cropBoxWidth;

    // Image rendered size on screen (representing zoom = 1 size)
    const renderedWidth = img.clientWidth;
    const renderedHeight = img.clientHeight;

    // Scaled dimensions on canvas
    const dw = renderedWidth * zoom * canvasScale;
    const dh = renderedHeight * zoom * canvasScale;

    // Translation offsets on canvas (in canvas pixels)
    const dx = position.x * canvasScale;
    const dy = position.y * canvasScale;

    ctx.save();
    // 1. Move canvas origin to center of target crop
    ctx.translate(targetWidth / 2, targetHeight / 2);
    
    // 2. Apply screen panning first (so drag direction maps naturally to screen axis)
    ctx.translate(dx, dy);

    // 3. Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // 4. Draw the image centered at the origin
    ctx.drawImage(
      img,
      -dw / 2,
      -dh / 2,
      dw,
      dh
    );
    ctx.restore();

    // Export canvas image with smart compression quality (0.75 JPEG)
    canvas.toBlob((blob) => {
      if (blob) {
        // Convert Blob to a File object
        const croppedFile = new File([blob], "document-cropped.jpg", { type: 'image/jpeg' });
        console.log(`Smart compression complete: ${(croppedFile.size / 1024).toFixed(1)} KB`);
        onCropComplete(croppedFile);
        onClose();
      }
    }, 'image/jpeg', 0.75);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-150 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Container */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center overflow-hidden">
          <div 
            ref={containerRef}
            className="relative w-full aspect-[1.6] max-h-[300px] bg-slate-100 rounded-2xl border border-dashed border-slate-300 overflow-hidden flex items-center justify-center select-none cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Cropped area window frame */}
            <div className="absolute inset-4 border-2 border-white rounded-lg shadow-[0_0_0_9999px_rgba(15,23,42,0.6)] z-10 pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between w-full">
                <div className="w-3 h-3 border-t-2 border-l-2 border-[#86c240]"></div>
                <div className="w-3 h-3 border-t-2 border-r-2 border-[#86c240]"></div>
              </div>
              <div className="flex justify-between w-full">
                <div className="w-3 h-3 border-b-2 border-l-2 border-[#86c240]"></div>
                <div className="w-3 h-3 border-b-2 border-r-2 border-[#86c240]"></div>
              </div>
            </div>

            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source"
              draggable="false"
              className="max-w-full max-h-full pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            />
          </div>

          {/* Controls */}
          <div className="w-full space-y-4 mt-6">
            <div className="flex items-center gap-3">
              <ZoomIn className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-[#86c240]"
              />
              <span className="text-xs font-bold text-slate-400 w-8">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="flex justify-between items-center gap-4">
              <button
                onClick={rotateImage}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" /> Rotate 90°
              </button>
              
              <div className="text-[10px] text-slate-400 font-semibold text-right">
                Drag to center document info inside the frame
              </div>
            </div>
          </div>
        </div>

        {/* Footer instructions & actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
          <div className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-4">
            ⚠️ **Guidelines**: Ensure the text/details are clearly visible inside the crop box. Compressed size stays &lt; 150KB automatically to save storage. Supports JPG, PNG.
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCrop}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl text-xs font-extrabold shadow-md transition-colors"
            >
              <Check className="w-4 h-4" /> Crop & Save
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImageCropperModal;
