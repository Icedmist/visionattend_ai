import React from 'react';
import { LayoutDashboard, Camera, UserPlus, FileSpreadsheet, Lock, LogIn, LogOut, ShieldCheck } from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, isAdmin, logout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'scan', label: 'Attendance Scan', icon: Camera, adminOnly: false },
    { id: 'register', label: 'Register Student', icon: UserPlus, adminOnly: true },
    { id: 'history', label: 'Attendance Logs', icon: FileSpreadsheet, adminOnly: true },
  ];

  return (
    <aside className="w-80 glass border-r border-dark-border min-h-screen flex flex-col p-6 z-20 transition-all duration-300">
      {/* Brand Header */}
      <div className="mb-10 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-xl shadow-neon-cyan">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-neon-cyan bg-clip-text text-transparent">
              VisionAttend <span className="text-neon-cyan text-glow-cyan">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Smart Attendance
            </p>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <nav className="flex-1 flex flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isLocked = item.adminOnly && !isAdmin;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isLocked) {
                  setCurrentTab('login');
                } else {
                  setCurrentTab(item.id);
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-neon-blue/15 to-neon-purple/10 border-l-4 border-neon-cyan text-white shadow-[inset_0_0_12px_rgba(6,182,212,0.05)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-neon-cyan' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              
              {item.adminOnly && (
                isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                )
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Status Panel */}
      <div className="mt-auto pt-6 border-t border-slate-800/40">
        {isAdmin ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]"></div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-400">Admin Mode Active</p>
                <p className="text-[10px] text-emerald-500/80 font-medium">Logged in</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-900/30 bg-red-950/10 text-red-400 hover:bg-red-950/30 hover:text-red-300 text-xs font-semibold transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Terminate Session</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCurrentTab('login')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-neon-purple hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] text-sm font-semibold transition-all duration-300"
          >
            <LogIn className="w-4 h-4" />
            <span>Admin Authentication</span>
          </button>
        )}
      </div>
    </aside>
  );
}
