import React from 'react';

export default function StatsCard({ title, value, icon, colorClass, shadowClass, suffix = "" }) {
  return (
    <div className="glass glass-hover p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group">
      {/* Decorative Back Light */}
      <div className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${colorClass}`}></div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <h3 className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-0.5">
          {value}
          {suffix && <span className="text-sm font-semibold text-slate-400">{suffix}</span>}
        </h3>
      </div>

      <div className={`p-4 rounded-xl ${colorClass} bg-opacity-10 text-white border border-opacity-20 flex items-center justify-center ${shadowClass} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
    </div>
  );
}

