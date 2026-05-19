import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, RefreshCw, FileDown, ShieldAlert, Sparkles } from 'lucide-react';

export default function AttendanceTable() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    date: new Date().toISOString().split('T')[0], // Default to today's date
    department: ''
  });

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.date) queryParams.append('date', filters.date);
      if (filters.department) queryParams.append('department', filters.department);

      const res = await fetch(`/api/attendance/records?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load records");
      const data = await res.json();
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filters.date, filters.department]); // Automatically fetch on date or department toggle

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleFilterToggle = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const triggerCsvExport = () => {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.date) queryParams.append('date', filters.date);
    if (filters.department) queryParams.append('department', filters.department);
    
    // Open in a new tab to prompt standard browser file download
    window.open(`/api/attendance/export?${queryParams.toString()}`);
  };

  // Helper to format date strings nicely
  const formatTime = (timeStr) => {
    try {
      return timeStr.split(' ')[1] || timeStr;
    } catch (e) {
      return timeStr;
    }
  };

  // Helper to get confidence score CSS badges
  const getConfidenceBadge = (score) => {
    if (score >= 80) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    } else if (score >= 65) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    } else {
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Attendance Logs</h2>
          <p className="text-slate-400 text-sm">Review, filter, and export biometric scanning records.</p>
        </div>
        
        <button
          onClick={triggerCsvExport}
          disabled={records.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs font-bold rounded-xl shadow-neon-purple hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown className="w-4 h-4" />
          <span>Export logs to CSV</span>
        </button>
      </div>

      {/* Query Filters */}
      <div className="glass p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by name or matric number..."
            className="w-full pl-11 pr-20 py-2.5 rounded-xl bg-dark-input border border-slate-800 text-slate-200 placeholder-slate-600 text-xs font-medium outline-none focus:border-neon-cyan transition-all duration-300"
          />
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
          <button
            type="submit"
            className="absolute right-2 top-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-[10px] transition"
          >
            Find
          </button>
        </form>

        {/* Date Filter */}
        <div className="relative w-full md:w-44">
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterToggle}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-input border border-slate-800 text-slate-200 text-xs font-medium outline-none focus:border-neon-cyan transition-all duration-300"
          />
          <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>

        {/* Department Filter */}
        <div className="relative w-full md:w-56">
          <select
            name="department"
            value={filters.department}
            onChange={handleFilterToggle}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-input border border-slate-800 text-slate-200 text-xs font-medium outline-none focus:border-neon-cyan transition-all duration-300 appearance-none"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Civil Engineering">Civil Engineering</option>
          </select>
          <Filter className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchRecords}
          className="p-3 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all duration-300"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-neon-cyan' : ''}`} />
        </button>

      </div>

      {/* Table Records Log */}
      <div className="glass rounded-2xl overflow-hidden border border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="px-6 py-4">Student Profile</th>
                <th className="px-6 py-4">Matric / Reg No</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">Scan Time</th>
                <th className="px-6 py-4 text-center">Biometric Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {records.length > 0 ? (
                records.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-slate-800 flex items-center justify-center font-bold text-neon-cyan uppercase">
                          {row.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-white">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-300">{row.matric_number}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{row.department}</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-300">
                      {formatTime(row.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getConfidenceBadge(row.confidence)}`}>
                        {row.confidence}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500 font-medium">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin" />
                        <p className="text-xs text-slate-400">Querying database registers...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                        <div className="p-4 bg-slate-900/60 rounded-full mb-1">
                          <ShieldAlert className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-sm font-semibold text-slate-300">No attendance records found</p>
                        <p className="text-[10px] text-slate-500">
                          Try shifting your date range filter or checking that face scanners have completed marks for today.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
