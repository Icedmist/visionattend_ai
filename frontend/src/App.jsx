import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import RegistrationForm from './components/RegistrationForm';
import LiveCamera from './components/LiveCamera';
import { Camera, RefreshCw, FileText, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [scannedLogs, setScannedLogs] = useState([]); // Today's dynamic scanner logs

  // Verify auth session token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error("Token verification error:", e);
        setIsAuthenticated(false);
      } finally {
        setIsVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error("Failed to call logout api:", e);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setIsAuthenticated(false);
      setActiveTab('dashboard');
    }
  };

  // Add scan events dynamically to side panel stream
  const handleFaceDetected = (matchResult) => {
    if (matchResult && matchResult.success) {
      // Avoid adding duplicate IDs consecutively in the local log feed
      setScannedLogs(prev => {
        const isDuplicate = prev.length > 0 && prev[0].matric_number === matchResult.matric_number;
        if (isDuplicate) return prev;
        return [{
          id: Date.now(),
          name: matchResult.name,
          matric_number: matchResult.matric_number,
          department: matchResult.department,
          timestamp: new Date().toLocaleTimeString(),
          confidence: matchResult.confidence
        }, ...prev].slice(0, 10); // Limit to last 10 detections
      });
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="absolute inset-0 bg-hud-grid opacity-10" />
        <div className="relative flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-neon-cyan animate-spin" />
          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase animate-pulse">
            Verifying Core Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render components according to active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'scan':
        return (
          <div className="flex flex-col xl:flex-row gap-8 max-w-6xl mx-auto items-stretch">
            {/* Camera Box */}
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Camera className="w-6 h-6 text-neon-cyan" />
                  <span>Biometric Portal Scanner</span>
                </h2>
                <p className="text-slate-400 text-sm">
                  Live facial detection and automated database verification.
                </p>
              </div>
              
              <div className="relative rounded-3xl overflow-hidden glass border border-slate-800 p-4">
                <LiveCamera onFaceDetected={handleFaceDetected} />
              </div>
            </div>

            {/* Dynamic matching feed panel */}
            <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-neon-purple animate-pulse" />
                  <span>Verified Hits Feed</span>
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Real-time biometrics matching sequence updates.
                </p>
              </div>

              <div className="glass p-5 rounded-3xl flex-1 border border-slate-800 flex flex-col gap-4 min-h-[400px]">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  Daily Verification Activity
                </h4>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px]">
                  {scannedLogs.length > 0 ? (
                    scannedLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-neon-cyan/40 hover:shadow-[0_0_10px_rgba(6,182,212,0.1)] transition-all duration-300 flex items-start justify-between gap-3 animate-slideIn"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[130px]">{log.name}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold">{log.matric_number}</p>
                          <p className="text-[9px] text-slate-500 font-medium">{log.department}</p>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-mono text-neon-cyan block font-semibold">
                            {log.timestamp}
                          </span>
                          <span className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-1">
                            {log.confidence}% Conf
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-16 gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center animate-pulse">
                        <Cpu className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Scanner Standby</p>
                        <p className="text-[9px] text-slate-600 max-w-[160px] mx-auto mt-1">
                          Align a student face in the scanner area to initiate biometric validation.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'register':
        return (
          <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-neon-cyan" />
                <span>Student Face Enrollment</span>
              </h2>
              <p className="text-slate-400 text-sm">
                Register new profiles and extract multi-angle facial biometric vectors.
              </p>
            </div>
            
            <div className="glass p-6 rounded-3xl border border-slate-800">
              <RegistrationForm />
            </div>
          </div>
        );
      case 'history':
        return <History />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100 overflow-hidden font-sans">
      
      {/* Background Matrix components */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.04),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-hud-grid opacity-[0.03] pointer-events-none" />
      
      {/* Sidebar Nav Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">
        {renderTabContent()}
      </main>

    </div>
  );
}
