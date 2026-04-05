import { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../config';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-white/10 p-4 rounded-lg shadow-[0_0_15px_rgba(0,243,255,0.2)] backdrop-blur-md">
        <p className="text-gray-400 text-xs mb-2 font-mono">DATE: {label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}
              />
              <span className="text-gray-300 w-20 font-medium">{entry.name}:</span>
              <span className="font-bold text-white font-mono">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function Home() {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [activeTools] = useState(14);
  const [stats, setStats] = useState({
    success: 0,
    threats: 0,
    scans: []
  });
  const [chartData, setChartData] = useState([]);

  // GSAP Advanced Animations
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 1. Title Reveal
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0, clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' },
      { y: 0, opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 1, ease: 'expo.out' }
    );

    // 2. Stagger in Status Cards with elastic pop
    tl.fromTo('.status-card',
      { y: 50, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.7)' },
      "-=0.5"
    );

    // 3. Slide in Analytics Section
    tl.fromTo('.analytics-section',
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8 },
      "-=0.6"
    );

    // 4. Slide in Mission Log
    tl.fromTo('.mission-log',
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8 },
      "<" // Start at same time as analytics
    );

    // 5. Quick Actions stagger up
    tl.fromTo('.action-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
      "-=0.4"
    );

  }, { scope: containerRef });

  useEffect(() => {
    // Check Backend
    fetch(`${API_BASE_URL}/`)
      .then(() => setBackendStatus('Online'))
      .catch(() => setBackendStatus('Offline'));

    // Fetch History for Stats
    fetch(`${API_BASE_URL}/history`)
      .then(res => res.json())
      .then(data => {
        // Process Stats
        const successful = data.filter(item => item.status !== 'Failed').length;

        // Enhanced heuristic for threats
        const threats = data.filter(item => {
          // Check all possible fields where output data might be stored
          const content = (
            JSON.stringify(item.summary || "") +
            JSON.stringify(item.output || "") +
            JSON.stringify(item.data || "")
          ).toLowerCase();

          return content.includes('vulnerable') ||
            content.includes('critical') ||
            content.includes('high') ||
            content.includes('threat') ||
            content.includes('danger') ||
            content.includes('risk') ||
            content.includes('exploit') ||
            content.includes('cve-') ||
            content.includes('open port') || // Open ports can be considered partial threats/exposure
            content.includes('self-signed');
        }).length;

        setStats({
          success: successful,
          threats: threats,
          scans: data
        });

        // Process Chart Data
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailyCounts = last7Days.map(date => {
          return {
            date: date.substring(5),
            scans: data.filter(item => item.timestamp.startsWith(date)).length,
            threats: data.filter(item => item.timestamp.startsWith(date) && (
              (JSON.stringify(item.summary || "") + JSON.stringify(item.output || "") + JSON.stringify(item.data || "")).toLowerCase().match(/vulnerable|critical|high|threat|danger|risk|exploit|cve-|open port|self-signed/))
            ).length
          };
        });

        setChartData(dailyCounts);
      })
      .catch(err => console.error("Failed to load stats", err));
  }, []);

  return (
    <div ref={containerRef} className="p-4 sm:p-6 md:p-8 space-y-8 overflow-hidden">
      <div>
        <h2 ref={titleRef} className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 mb-2 tracking-tight">
          Command Center
        </h2>
        <p className="text-gray-400 text-sm sm:text-base font-mono opacity-0 animate-[fadeIn_0.5s_ease-out_1s_forwards]">
          SYSTEM STATUS: <span className="text-cyber-primary">OPTIMAL</span> // SECURITY LEVEL: <span className="text-cyber-danger">HIGH</span>
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="status-card glass-panel p-6 relative overflow-hidden group hover:border-cyber-primary/50 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(255,56,56,0.3)]">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
          </div>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-1 group-hover:text-cyber-primary transition-colors">Backend Uplink</p>
          <p className={`text-2xl font-bold ${backendStatus === 'Online' ? 'text-cyber-success' : 'text-cyber-danger'}`}>{backendStatus}</p>
        </div>

        <div className="status-card glass-panel p-6 relative overflow-hidden group hover:border-cyber-secondary/50 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
          </div>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-1 group-hover:text-cyber-secondary transition-colors">Tools Active</p>
          <p className="text-2xl font-bold text-white">{activeTools}</p>
        </div>

        <div className="status-card glass-panel p-6 relative overflow-hidden group hover:border-cyber-accent/50 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-1 group-hover:text-cyber-accent transition-colors">Recent Success</p>
          <p className="text-2xl font-bold text-white">{stats.success}</p>
        </div>

        <div className="status-card glass-panel p-6 relative overflow-hidden group hover:border-cyber-danger/50 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-1 group-hover:text-cyber-danger transition-colors">Threats Detected</p>
          <p className="text-2xl font-bold text-white">{stats.threats}</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="analytics-section glass-panel p-6 lg:col-span-2 hover:border-white/10 transition-colors">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center">
            <span className="w-2 h-2 rounded-full bg-cyber-secondary mr-2 animate-pulse"></span>
            Scan Activity Flow
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3838" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff3838" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#4b5563"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#4b5563"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="scans"
                  name="Scans"
                  stroke="#00f3ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorScans)"
                />
                <Area
                  type="monotone"
                  dataKey="threats"
                  name="Threats"
                  stroke="#ff3838"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorThreats)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Scans List */}
        <div className="mission-log glass-panel p-6 flex flex-col hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Mission Log</h3>
            <Link to="/security-report" className="text-xs font-mono px-3 py-1 bg-white/5 text-gray-300 border border-white/10 rounded hover:bg-white/10 transition-colors">
              VIEW ARCHIVES
            </Link>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
            {stats.scans.slice(0, 5).map((scan, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-cyber-primary/30 transition-all group hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${scan.status === 'Completed' ? 'bg-cyber-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-cyber-accent animate-pulse'}`}></div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-cyber-primary transition-colors">{scan.tool}</p>
                    <p className="text-10px text-gray-400 font-mono truncate max-w-[120px]">{scan.target}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${scan.status === 'Completed' ? 'bg-cyber-success/10 text-cyber-success border-cyber-success/30' : 'bg-cyber-accent/10 text-cyber-accent border-cyber-accent/30'}`}>
                    {scan.status}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono mt-0.5">{scan.timestamp.split(' ')[1]}</span>
                </div>
              </div>
            ))}
            {stats.scans.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8 italic">
                No missions recorded today.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions at bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/info-gathering/nmap" className="action-card glass-panel p-4 hover:border-cyber-primary/50 transition-all group flex items-center justify-between hover:translate-y-[-2px] duration-300">
          <span className="font-bold text-gray-300 group-hover:text-cyber-primary transition-colors">Launch Nmap Protocol</span>
          <svg className="w-5 h-5 text-gray-500 group-hover:text-cyber-primary transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
        <Link to="/info-gathering/sublist3r" className="action-card glass-panel p-4 hover:border-cyber-secondary/50 transition-all group flex items-center justify-between hover:translate-y-[-2px] duration-300">
          <span className="font-bold text-gray-300 group-hover:text-cyber-secondary transition-colors">Subdomain Engagements</span>
          <svg className="w-5 h-5 text-gray-500 group-hover:text-cyber-secondary transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
        <Link to="/info-gathering/whatweb" className="action-card glass-panel p-4 hover:border-cyber-accent/50 transition-all group flex items-center justify-between hover:translate-y-[-2px] duration-300">
          <span className="font-bold text-gray-300 group-hover:text-cyber-accent transition-colors">Tech Stack Analysis</span>
          <svg className="w-5 h-5 text-gray-500 group-hover:text-cyber-accent transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
      </div>
    </div>
  );
}

export default Home;