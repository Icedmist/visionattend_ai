import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, BookOpen, UserCheck, Camera, FileSpreadsheet, Key, HelpCircle } from 'lucide-react';

export default function OnboardingGuide({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "System Overview",
      subtitle: "Welcome to VisionAttend AI Core Hub",
      icon: <Sparkles className="w-8 h-8 text-neon-cyan animate-pulse" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            VisionAttend AI is a state-of-the-art biometric attendance system powered by deep learning facial recognition models. The platform consists of a highly responsive front-end console integrated with a robust high-performance Python computer vision back-end.
          </p>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <span className="font-bold text-neon-cyan block uppercase tracking-wider text-[10px]">🔒 Default Credentials:</span>
            <div className="flex justify-between font-mono">
              <span>Admin Username: <strong className="text-white">admin</strong></span>
              <span>Password: <strong className="text-white">adminpassword123</strong></span>
            </div>
          </div>
        </div>
      ),
      color: "from-neon-cyan/20 to-neon-blue/10",
      accentBorder: "border-neon-cyan/30"
    },
    {
      title: "Face Enrollment",
      subtitle: "Enroll New Student Biometric Profiles",
      icon: <UserCheck className="w-8 h-8 text-neon-purple animate-bounce" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            Register students into the secure system registry. Navigate to the <span className="text-neon-purple font-semibold">Enroll Student</span> sidebar tab, fill in the student metadata (Matric Number, Full Name, and Department), and utilize the webcam target guide to extract three key angles:
          </p>
          <ul className="grid grid-cols-3 gap-2 text-[10px] text-center font-bold text-slate-400 uppercase">
            <li className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">1. Straight View</li>
            <li className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">2. Left Profile</li>
            <li className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">3. Right Profile</li>
          </ul>
        </div>
      ),
      color: "from-neon-purple/20 to-violet-500/10",
      accentBorder: "border-neon-purple/30"
    },
    {
      title: "Real-time Scan Portal",
      subtitle: "Launch Autonomous Face Recognition Scanning",
      icon: <Camera className="w-8 h-8 text-emerald-400 animate-pulse" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            Navigate to the <span className="text-emerald-400 font-semibold">Scan Portal</span> tab to launch the live biometric verification engine:
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-slate-400">
              <strong className="text-emerald-400 block mb-0.5">✓ Registered Students</strong>
              Face bounding boxes are drawn in real-time, names are matched, and attendance is registered instantly.
            </div>
            <div className="p-2.5 rounded-xl bg-red-950/10 border border-red-500/20 text-slate-400">
              <strong className="text-red-400 block mb-0.5">⚠️ Unregistered Intruders</strong>
              Perimeter security logs flag the unknown face, save a high-res capture snapshot, and display an alert.
            </div>
          </div>
        </div>
      ),
      color: "from-emerald-500/20 to-teal-500/10",
      accentBorder: "border-emerald-400/30"
    },
    {
      title: "Export & Analytics",
      subtitle: "Track Telemetry Streams & Download Data",
      icon: <FileSpreadsheet className="w-8 h-8 text-amber-400 animate-pulse" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            Our real-time dashboard handles live synchronization. Review daily enrollment stats, attendance rate velocity vectors, and department ratios:
          </p>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div>
              <strong className="text-white block">Download Attendance Spreadsheet</strong>
              Navigate to the <span className="text-amber-400 font-semibold">Attendance Logs</span> tab to filter logs by date and export fully compiled CSVs.
            </div>
          </div>
        </div>
      ),
      color: "from-amber-500/20 to-orange-500/10",
      accentBorder: "border-amber-400/30"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${steps[currentStep].accentBorder} bg-gradient-to-br ${steps[currentStep].color} backdrop-blur-md p-6 md:p-8 flex flex-col md:flex-row justify-between items-stretch gap-6 transition-all duration-500 animate-fade-in`}>
      
      {/* Interactive step content */}
      <div className="flex-1 flex flex-col justify-between gap-6">
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center">
              {steps[currentStep].icon}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Step {currentStep + 1} of {steps.length}</span>
              <h3 className="text-lg font-extrabold text-white leading-tight">{steps[currentStep].title}</h3>
            </div>
          </div>
          
          <p className="text-xs font-bold text-neon-cyan uppercase tracking-wider mb-3">{steps[currentStep].subtitle}</p>
          
          {steps[currentStep].content}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
              className="px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentStep === steps.length - 1 ? (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple hover:scale-105 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              >
                Launch Console Dashboard
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Skip Onboarding
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mini Interactive step progress sidebar */}
      <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-800/80 md:pl-6 pt-6 md:pt-0 flex flex-col justify-between">
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-neon-cyan" />
            <span>Onboarding Modules</span>
          </h4>
          
          {steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-full text-left p-2 rounded-xl border text-xs transition-all flex items-center gap-2.5 ${
                idx === currentStep
                  ? 'bg-slate-900/80 border-slate-700/80 text-white font-bold shadow-[0_0_10px_rgba(0,0,0,0.3)]'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 font-medium'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${idx === currentStep ? 'bg-neon-cyan animate-ping' : 'bg-slate-700'}`} />
              <span className="truncate">{step.title}</span>
            </button>
          ))}
        </div>

        {/* Dynamic dismiss header icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
