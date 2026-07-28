'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (base64Data: string) => void;
  currentImage?: string | null;
}

export function CameraCapture({ onCapture, currentImage }: CameraCaptureProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(currentImage || null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      // Delay setting srcObject slightly to ensure ref is attached
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      toast.error('Erro ao acessar a câmera. Verifique as permissões.');
      console.error(error);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
        setCapturedImage(base64);
        onCapture(base64);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCapturedImage(base64);
      onCapture(base64);
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    onCapture('');
  };

  return (
    <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            Foto do Aparelho
          </h3>
          <p className="text-xs text-slate-500">Registre o estado visual do aparelho na entrada</p>
        </div>
      </div>

      {capturedImage ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capturedImage} alt="Captura" className="max-h-full max-w-full object-contain" />
          <div className="absolute top-2 right-2 bg-success text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg">
            <CheckCircle2 className="w-3 h-3" />
            CAPTURADO
          </div>
          <button 
            type="button"
            onClick={retake}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 btn-secondary bg-white/90 shadow-xl hover:bg-white text-black"
          >
            Tirar Outra
          </button>
        </div>
      ) : isCameraOpen ? (
        <div className="relative rounded-lg overflow-hidden border bg-black aspect-video flex flex-col items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Controls Overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={stopCamera} 
                className="btn-icon bg-black/50 text-white rounded-full hover:bg-danger pointer-events-auto backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center pb-2">
              <button 
                type="button"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white bg-white/30 hover:bg-white/50 transition-colors pointer-events-auto shadow-2xl backdrop-blur-md"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={startCamera}
            className="flex-1 btn bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 transition-colors py-8 flex flex-col items-center gap-2"
          >
            <Camera className="w-8 h-8" />
            <span>Abrir Câmera</span>
          </button>
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 btn bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors py-8 flex flex-col items-center gap-2"
          >
            <Upload className="w-8 h-8" />
            <span>Enviar Arquivo</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            onChange={handleFileUpload}
          />
        </div>
      )}
    </div>
  );
}
