import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function LiveCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [latestMarked, setLatestMarked] = useState(null);
  const [statusText, setStatusText] = useState('Camera Offline');
  
  // Start webcam stream
  const startCamera = async () => {
    setError(null);
    setStatusText('Requesting camera permissions...');
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setIsScanning(true);
      setStatusText('Scanner Active - Align face in the frame');
    } catch (err) {
      console.error("Camera start failed:", err);
      setError("Webcam access denied. Please check your browser camera permissions.");
      setStatusText('Camera Error');
    }
  };

  // Stop webcam stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsScanning(false);
    setStatusText('Camera Offline');
    
    // Clear overlay
    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const ctx = overlayCanvas.getContext('2d');
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
  };

  // Auto-start camera when mounting
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Frame Capture and Recognition loop
  useEffect(() => {
    if (!isScanning || !stream) return;

    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const oCtx = overlayCanvas.getContext('2d');

      // Make sure video is ready
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // 1. Draw current video frame to hidden processing canvas at 640x480
        ctx.drawImage(video, 0, 0, 640, 480);
        
        // 2. Export frame as Base64 JPEG (reduced size & quality for fast transfers)
        const frameData = canvas.toDataURL('image/jpeg', 0.65);
        
        try {
          // 3. Post to Flask API for AI scanning
          const res = await fetch('/api/attendance/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: frameData })
          });
          
          if (!res.ok) throw new Error("API scan failed");
          const data = await res.json();
          
          // Clear previous frames bounding boxes
          oCtx.clearRect(0, 0, 640, 480);
          
          if (data.detections && data.detections.length > 0) {
            data.detections.forEach(det => {
              const [top, right, bottom, left] = det.box;
              const width = right - left;
              const height = bottom - top;
              
              // Set glowing styling based on match status
              const color = det.matched ? '#06B6D4' : '#EF4444'; // Neon Cyan or Alert Red
              
              oCtx.strokeStyle = color;
              oCtx.lineWidth = 3;
              oCtx.shadowColor = color;
              oCtx.shadowBlur = 10;
              
              // Draw rounded bounding box
              drawRoundedRect(oCtx, left, top, width, height, 10);
              
              // Draw labeling tag above the box
              oCtx.fillStyle = color;
              oCtx.shadowBlur = 0;
              oCtx.fillRect(left, top - 32, width, 32);
              
              oCtx.fillStyle = '#FFFFFF';
              oCtx.font = 'bold 12px Outfit, Inter, sans-serif';
              const text = det.matched ? `${det.name} (${det.confidence}%)` : 'Unknown User';
              oCtx.fillText(text, left + 10, top - 11);
              
              // Handle attendance marked event
              if (det.matched && det.marked) {
                // Play notification sound
                playBeep(880, 0.1); // High success pitch
                
                setLatestMarked({
                  name: det.name,
                  matric_number: det.matric_number,
                  department: det.department,
                  confidence: det.confidence,
                  status: det.attendance_status,
                  timestamp: new Date().toLocaleTimeString(),
                  success: true
                });
                
                // Clear latest marked popup after 4 seconds
                setTimeout(() => setLatestMarked(prev => {
                  if (prev && prev.matric_number === det.matric_number) return null;
                  return prev;
                }), 4000);
              } else if (!det.matched) {
                // Log unrecognized trigger
                playBeep(220, 0.25); // Lower alert pitch
                setLatestMarked({
                  name: 'Unknown User Detected',
                  matric_number: 'N/A',
                  department: 'Unknown Profile',
                  status: 'Screenshot Captured',
                  timestamp: new Date().toLocaleTimeString(),
                  success: false
                });
                setTimeout(() => setLatestMarked(null), 4000);
              }
            });
            setStatusText(`Detections: ${data.detections.length} active face(s)`);
          } else {
            setStatusText('Scanner Active - Align face in the frame');
          }
        } catch (err) {
          console.error("Frame recognition error:", err);
        }
      }
    }, 1000); // Check once per second

    return () => clearInterval(interval);
  }, [isScanning, stream]);

  // Audio utility: standard synthesized beep (no asset file dependencies!)
  const playBeep = (freq, duration) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Low non-intrusive volume
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.log("Audio not supported or blocked by user gesture:", e);
    }
  };

  // Rounded rectangle drawing utility for canvas
  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Module Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Live Attendance Scan</h2>
          <p className="text-slate-400 text-sm">Face recognition marks attendance instantly and logs visitors.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isScanning ? (
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-all duration-300"
            >
              Stop Scan
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs font-semibold rounded-xl shadow-neon-purple transition-all duration-300"
            >
              Start Scan
            </button>
          )}
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Video Box Container */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/60 border border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            
            {/* Base webcam element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1]" // Mirror display
            />
            
            {/* Hidden canvas for capturing frame arrays */}
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />
            
            {/* Canvas for neon boundary overlays */}
            <canvas
              ref={overlayCanvasRef}
              width="640"
              height="480"
              className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
            />
            
            {/* Futuristic Tech Scanner Overlays */}
            {isScanning && (
              <>
                <div className="scanner-scanline"></div>
                {/* HUD Corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-neon-cyan opacity-60"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-neon-cyan opacity-60"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-neon-cyan opacity-60"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-neon-cyan opacity-60"></div>
              </>
            )}

            {/* Offline/Error Overlays */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-dark-bg/95 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3 animate-bounce" />
                <p className="text-sm font-semibold text-slate-200">{error}</p>
                <button
                  onClick={startCamera}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Setup
                </button>
              </div>
            )}

            {!stream && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-card/90">
                <div className="p-4 bg-slate-800/30 rounded-full border border-slate-700/50 mb-3 animate-pulse">
                  <Camera className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Webcam Scanner Offline</p>
                <button
                  onClick={startCamera}
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs font-bold rounded-xl shadow-neon-purple transition-all duration-300"
                >
                  Initialize Camera
                </button>
              </div>
            )}
          </div>
          
          {/* Scanner Status bar */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/30 border border-slate-800/40 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-neon-cyan animate-pulse shadow-[0_0_8px_#06B6D4]' : 'bg-slate-600'}`}></span>
            <span className="font-semibold tracking-wide uppercase text-[10px] text-slate-500">Scanner Status:</span>
            <span className="text-slate-300">{statusText}</span>
          </div>
        </div>

        {/* Real-time Detections Logs Panel */}
        <div className="flex flex-col gap-4">
          <div className="glass p-5 rounded-2xl flex-1 flex flex-col min-h-[300px]">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider text-slate-400">Live Detection Feed</h3>
            
            {latestMarked ? (
              <div className={`p-4 rounded-xl border flex flex-col gap-3 animate-[slideIn_0.3s_ease-out] ${
                latestMarked.success
                  ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-400'
                  : 'bg-red-950/20 border-red-800/30 text-red-400'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {latestMarked.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm font-bold">{latestMarked.name}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">
                    {latestMarked.timestamp}
                  </span>
                </div>
                
                <div className="text-xs text-slate-300 space-y-1 mt-1 font-medium">
                  <p><span className="text-slate-500">Matric No:</span> {latestMarked.matric_number}</p>
                  <p><span className="text-slate-500">Dept:</span> {latestMarked.department}</p>
                  <p className="mt-2 text-xs font-semibold text-glow-cyan flex items-center gap-1.5">
                    <span className="text-slate-500">Action:</span> 
                    <span className={latestMarked.success ? 'text-emerald-400' : 'text-red-400'}>{latestMarked.status}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl">
                <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-500">No active detection events.</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[180px]">Align a face in front of the camera to verify profiles.</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
