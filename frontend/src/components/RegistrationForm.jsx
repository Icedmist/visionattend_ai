import React, { useRef, useState, useEffect } from 'react';
import { Camera, Trash2, CheckCircle, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';

export default function RegistrationForm({ token }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [formData, setFormData] = useState({ name: '', matric_number: '', department: '' });
  const [stream, setStream] = useState(null);
  const [photos, setPhotos] = useState([null, null, null]); // Three slots for face profiles
  const [cameraActive, setCameraActive] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Start webcam for registration
  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setCameraActive(true);
      setMessage(null);
    } catch (err) {
      console.error("Failed to open camera for registration:", err);
      setMessage("Could not access camera. Please allow webcam permission.");
      setIsSuccess(false);
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Snap photo from stream
  const snapPhoto = () => {
    if (!videoRef.current || !canvasRef.current || currentSlot > 2) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(video, 0, 0, 640, 480);
    const b64Str = canvas.toDataURL('image/jpeg', 0.8);
    
    const updatedPhotos = [...photos];
    updatedPhotos[currentSlot] = b64Str;
    setPhotos(updatedPhotos);
    
    // Auto-advance slot
    if (currentSlot < 2) {
      setCurrentSlot(currentSlot + 1);
    }
  };

  const clearPhotoSlot = (index) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = null;
    setPhotos(updatedPhotos);
    setCurrentSlot(index); // Move slot cursor back to cleared slot
  };

  const resetForm = () => {
    setFormData({ name: '', matric_number: '', department: '' });
    setPhotos([null, null, null]);
    setCurrentSlot(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    if (!formData.name.trim() || !formData.matric_number.trim() || !formData.department.trim()) {
      setMessage("All text fields are required.");
      setIsSuccess(false);
      return;
    }

    // Check if we captured all 3 photos
    const capturedPhotos = photos.filter(p => p !== null);
    if (capturedPhotos.length < 3) {
      setMessage("Please capture all 3 face snaps at different angles to ensure optimal match accuracy.");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/students/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          matric_number: formData.matric_number,
          department: formData.department,
          images: capturedPhotos
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setIsSuccess(true);
        setMessage(data.message || "Student registered successfully!");
        resetForm();
      } else {
        setIsSuccess(false);
        setMessage(data.message || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setIsSuccess(false);
      setMessage("Failed to connect to API server.");
    }
  };

  // Helper titles for face angles
  const slotLabels = ["1. Straight View", "2. Left Profile", "3. Right Profile"];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Register Student Face</h2>
        <p className="text-slate-400 text-sm">Enroll a new student by entering metadata and mapping their facial profiles.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
          isSuccess 
            ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-400' 
            : 'bg-red-950/20 border-red-800/30 text-red-400'
        }`}>
          {isSuccess ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Step 1: Text Credentials */}
        <div className="flex flex-col gap-6">
          <div className="glass p-6 rounded-2xl flex flex-col gap-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">Student Particulars</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Matric / Registration Number</label>
              <input
                type="text"
                name="matric_number"
                value={formData.matric_number}
                onChange={handleInputChange}
                required
                placeholder="e.g. ENG2020042"
                className="px-4 py-3 rounded-xl bg-dark-input border border-slate-800 focus:border-neon-cyan focus:shadow-neon-cyan text-slate-200 placeholder-slate-600 text-sm font-medium outline-none transition-all duration-300"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g. John Doe"
                className="px-4 py-3 rounded-xl bg-dark-input border border-slate-800 focus:border-neon-cyan focus:shadow-neon-cyan text-slate-200 placeholder-slate-600 text-sm font-medium outline-none transition-all duration-300"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Academic Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                className="px-4 py-3 rounded-xl bg-dark-input border border-slate-800 focus:border-neon-cyan focus:shadow-neon-cyan text-slate-200 placeholder-slate-600 text-sm font-medium outline-none transition-all duration-300"
              >
                <option value="">Select Department...</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-neon-purple hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Enrolling Face Encodings...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5" />
                  <span>Enroll Student</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 2: Camera Snapper */}
        <div className="flex flex-col gap-4">
          <div className="glass p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">Face Snapper Engine</h3>
              <span className="text-[10px] bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded-full text-slate-400 font-semibold uppercase">
                Slot {currentSlot + 1} of 3
              </span>
            </div>
            
            {/* Mirror preview container */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1]"
              />
              <canvas ref={canvasRef} width="640" height="480" className="hidden" />
              
              {/* Slot Target Guide Overlay */}
              {cameraActive && currentSlot <= 2 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Oval Face Guide */}
                  <div className="w-[180px] h-[240px] rounded-[50%] border-2 border-dashed border-neon-cyan opacity-50 flex items-center justify-center relative">
                    <span className="absolute -top-6 text-[10px] text-neon-cyan font-bold tracking-wide uppercase bg-black/60 px-2.5 py-0.5 rounded-full border border-neon-cyan/20">
                      {slotLabels[currentSlot]}
                    </span>
                  </div>
                </div>
              )}

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-card/95">
                  <Camera className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400">Camera Offline</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    Activate Camera
                  </button>
                </div>
              )}
            </div>

            {cameraActive && currentSlot <= 2 && (
              <button
                type="button"
                onClick={snapPhoto}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 text-white font-bold text-sm shadow-neon-cyan transition-all duration-300"
              >
                <Camera className="w-4 h-4" />
                <span>Capture {slotLabels[currentSlot]}</span>
              </button>
            )}

            {currentSlot > 2 && (
              <div className="p-3 text-center bg-emerald-950/20 border border-emerald-800/30 rounded-xl text-xs font-bold text-emerald-400">
                ⭐ All 3 photos successfully captured! Ready to submit.
              </div>
            )}

            {/* Picture Roll previews */}
            <div className="grid grid-cols-3 gap-3.5 mt-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="relative aspect-[4/3] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group">
                    {photo ? (
                      <>
                        <img src={photo} className="w-full h-full object-cover scale-x-[-1]" alt={`Capture ${idx + 1}`} />
                        <button
                          type="button"
                          onClick={() => clearPhotoSlot(idx)}
                          className="absolute inset-0 bg-black/75 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <Trash2 className="w-4 h-4 text-red-500 hover:scale-110 transition-transform" />
                        </button>
                      </>
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center bg-dark-bg/60 border border-dashed text-[10px] text-slate-500 font-bold ${
                        currentSlot === idx ? 'border-neon-cyan/40 bg-neon-cyan/5 text-neon-cyan' : 'border-slate-800'
                      }`}>
                        <span>Slot {idx + 1}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-center font-medium text-slate-500">{slotLabels[idx].split(' ')[1]}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}
