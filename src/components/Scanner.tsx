import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import jsQR from 'jsqr';
import { Camera, XCircle, ShieldCheck, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
}

// BarcodeDetector is a native browser API, but TS might not know it yet in all environments
declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

export const Scanner: React.FC<ScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [method, setMethod] = useState<'native' | 'jsqr' | null>(null);
  const requestRef = useRef<number | null>(null);

  const processImage = useCallback(async (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);

    // Try Native first
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await barcodeDetector.detect(canvas);
        if (barcodes.length > 0) {
          onScan(barcodes[0].rawValue);
          return true;
        }
      } catch (e) {
        console.warn("Native detection failed for image", e);
      }
    }

    // Fallback to jsQR
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      onScan(code.data);
      return true;
    }
    return false;
  }, [onScan]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const success = await processImage(img);
        if (!success) {
          setError("No QR code found in the uploaded image.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (!file) continue;

          setError(null);
          const reader = new FileReader();
          reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
              const success = await processImage(img);
              if (!success) {
                setError("No QR code found in the pasted image.");
              }
            };
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
          break; // Process only the first image
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImage]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        setIsScanning(true);
        
        // Detect best method
        if ('BarcodeDetector' in window) {
          setMethod('native');
        } else {
          setMethod('jsqr');
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied. Please check your permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    setIsScanning(false);
  }, []);

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 1. Try Native BarcodeDetector (Most Private & Performant)
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(canvas);
          if (barcodes.length > 0) {
            onScan(barcodes[0].rawValue);
            // Optional: Pause or visual feedback
          }
        } catch (e) {
          console.warn("Native detection failed, falling back to jsQR", e);
          setMethod('jsqr');
        }
      }

      // 2. Fallback to jsQR (Local JS processing)
      if (method === 'jsqr' || !('BarcodeDetector' in window)) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          onScan(code.data);
        }
      }
    }

    requestRef.current = requestAnimationFrame(scanFrame);
  }, [isScanning, method, onScan]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (isScanning) {
      requestRef.current = requestAnimationFrame(scanFrame);
    }
  }, [isScanning, scanFrame]);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Privacy Badge */}
      <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
        <ShieldCheck size={14} className="text-green-500" />
        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
          Privacy Mode: Local Processing Only
        </span>
      </div>

      <div className="relative w-full bg-black rounded-2xl overflow-hidden aspect-square shadow-2xl border-4 border-zinc-800">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover"
          muted 
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay UI */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white/20 rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 -mb-1 -mr-1"></div>
                
                {/* Scanning Line Animation */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                />
            </div>
        </div>

        {/* Method Indicator */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", method === 'native' ? "bg-blue-500" : "bg-orange-500")} />
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-tighter">
              {method === 'native' ? 'Native Engine' : 'Local JS Engine'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center space-y-6 w-full">
        <div className="flex flex-col gap-4">
          <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest flex items-center justify-center gap-2">
            <Camera size={16} />
            Align QR code within frame
          </p>

          <div className="flex items-center gap-4 px-4">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl flex items-center justify-center gap-3 transition-all group"
          >
            <div className="w-10 h-10 bg-zinc-800 group-hover:bg-zinc-700 rounded-xl flex items-center justify-center transition-colors">
              <Upload size={20} className="text-zinc-400 group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Upload Image</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Select from gallery or paste directly</p>
            </div>
          </button>
        </div>
        
        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-left">
            <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-zinc-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Your camera feed and uploaded images are processed entirely on this device. No data is ever uploaded to any server.
                </p>
            </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
          <XCircle size={18} />
          {error}
          <button onClick={() => window.location.reload()} className="ml-auto text-white underline">Retry</button>
        </div>
      )}
    </div>
  );
};

// Helper for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
