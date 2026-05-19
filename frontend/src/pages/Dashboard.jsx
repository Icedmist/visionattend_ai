import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, UserCheck, TrendingUp, ShieldAlert, AlertTriangle, Eye, ShieldCheck, Sparkles, RefreshCw, HelpCircle } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import OnboardingGuide from '../components/OnboardingGuide';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_students: 0,
    present_today: 0,
    attendance_rate: 0,
    unknown_today: 0,
    daily_trends: [],
    department_distribution: []
  });
  const [unknownRecords, setUnknownRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(localStorage.getItem('onboarding_completed') !== 'true');

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load general stats
      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Load unknown detections
      const unknownRes = await fetch('/api/unknown/records');
      if (unknownRes.ok) {
        const unknownData = await unknownRes.json();
        setUnknownRecords(unknownData);
      }
    } catch (e) {
      console.error("Dashboard failed to retrieve telemetry details:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh stats every 15 seconds to simulate real-time attendance streams
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  // Format date labels nicely for the trend axis
  const formatTrendDate = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // e.g. "2026-05-19" -> "May 19"
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return `${months[monthIndex]} ${day}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // Process daily trend data
  const formattedTrends = stats.daily_trends.map(t => ({
    ...t,
    displayDate: formatTrendDate(t.date),
    "Present Students": t.count
  }));

  // Process department data
  const formattedDepts = stats.department_distribution.map(d => ({
    name: d.department,
    "Registered": d.total,
    "Attended": d.present
  }));

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto font-sans">
      
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">System Status & Telemetry</h2>
            <Sparkles className="w-5 h-5 text-neon-cyan animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm">
            Biometric network analysis and enrollment status summaries.
          </p>
        </div>
        
        {/* Realtime stream indicator & Help Toggle */}
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-300"
          >
            <HelpCircle className="w-3.5 h-3.5 text-neon-cyan" />
            <span>Help Guide</span>
          </button>

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-300 animate-fade-in"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-neon-cyan' : ''}`} />
            <span>Real-time Stream</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block ml-1" />
          </button>
        </div>
      </div>

      {/* Onboarding Wizard Panel */}
      {showOnboarding && (
        <OnboardingGuide onClose={handleCloseOnboarding} />
      )}


      {/* Stats Cards Dashboard Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Enrolled Students"
          value={stats.total_students}
          description="Total active system registry"
          icon={<Users className="w-6 h-6 text-neon-cyan" />}
          gradient="from-neon-blue/10 to-neon-cyan/5"
          borderColor="group-hover:border-neon-cyan/50"
        />
        <StatsCard
          title="Present Today"
          value={stats.present_today}
          description="Biometrics validated today"
          icon={<UserCheck className="w-6 h-6 text-emerald-400" />}
          gradient="from-emerald-500/10 to-emerald-400/5"
          borderColor="group-hover:border-emerald-400/50"
        />
        <StatsCard
          title="Attendance Rate"
          value={`${stats.attendance_rate}%`}
          description="Daily ratio of attendance"
          icon={<TrendingUp className="w-6 h-6 text-neon-purple" />}
          gradient="from-neon-purple/10 to-violet-500/5"
          borderColor="group-hover:border-neon-purple/50"
        />
        <StatsCard
          title="Flagged Alerts"
          value={stats.unknown_today}
          description="Unrecognized face events"
          icon={<ShieldAlert className="w-6 h-6 text-amber-500" />}
          gradient="from-amber-500/10 to-amber-600/5"
          borderColor="group-hover:border-amber-500/50"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Trend Area Chart */}
        <div className="glass p-6 rounded-2xl border border-slate-800/50 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Attendance Frequency Velocity</h3>
            <p className="text-[11px] text-slate-500">Biometric scanner hits over the last 7 sessions</p>
          </div>
          
          <div className="h-64 w-full text-xs font-semibold">
            {formattedTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="displayDate" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                    itemStyle={{ color: '#06b6d4' }}
                  />
                  <Area type="monotone" dataKey="Present Students" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                <p className="text-xs">Waiting for scanner data streams...</p>
              </div>
            )}
          </div>
        </div>

        {/* Department Overview Bar Chart */}
        <div className="glass p-6 rounded-2xl border border-slate-800/50 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Departmental Metrics</h3>
            <p className="text-[11px] text-slate-500">Registered vs Present ratios for today</p>
          </div>
          
          <div className="h-64 w-full text-xs font-semibold">
            {formattedDepts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedDepts} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="Registered" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.4} />
                  <Bar dataKey="Attended" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                <p className="text-xs">No department distribution registers active.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Flagged Unknown Intruder feed */}
      <div className="glass p-6 rounded-2xl border border-slate-800/50 flex flex-col gap-5">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Flagged Perimeter Security Logs</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Realtime Intruder Alerts
          </span>
        </div>

        {unknownRecords.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[300px] overflow-y-auto pr-1">
            {unknownRecords.map((rec) => {
              const filename = rec.image_path.split('/').pop();
              return (
                <div
                  key={rec.id}
                  className="group relative p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 hover:border-red-500/40 shadow-[0_0_10px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] flex flex-col items-center gap-2"
                >
                  {/* Photo Frame Container */}
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center relative">
                    <img
                      src={`/static/unknown_faces/${filename}`}
                      alt="Unrecognized face snapshot capture"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Bounding box scanning guide overlay */}
                    <div className="absolute inset-0 border border-red-500/20 group-hover:border-red-500/50 transition-colors pointer-events-none" />
                    
                    <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[8px] font-bold text-red-400 uppercase tracking-wider">
                      Flagged
                    </div>
                  </div>

                  {/* Telemetry info */}
                  <div className="text-center w-full">
                    <p className="text-[9px] font-mono text-slate-500 tracking-wider">
                      {rec.timestamp.split(' ')[1]}
                    </p>
                    <p className="text-[8px] font-bold text-red-400/90 truncate uppercase mt-0.5">
                      Unregistered Target
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl bg-slate-900/10 border border-dashed border-slate-800/80">
            <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Biometric Perimeter Secure</p>
              <p className="text-[10px] text-slate-500 mt-1">Zero unauthorized access attempts flagged today.</p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
