import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function Sidebar() {
  const containerRef = useRef(null);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    reconnaissance: true,
    webScanners: true,
    networkScanners: true,
  });

  useGSAP(() => {
    // Stagger in links
    gsap.fromTo('.sidebar-link',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.2 }
    );
  }, { scope: containerRef });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const tools = {
    reconnaissance: [
      { name: 'Dig', path: '/info-gathering/dig' },
      { name: 'Dnsenum', path: '/info-gathering/dnsenum' },
      { name: 'Dnsmap', path: '/info-gathering/dnsmap' },
      { name: 'Sublist3r', path: '/info-gathering/sublist3r' },
      { name: 'theHarvester', path: '/info-gathering/theharvester' },
      { name: 'Recon-ng', path: '/info-gathering/recon-ng' },
      { name: 'Shodan', path: '/info-gathering/shodan' },
    ],
    webScanners: [
      { name: 'WhatWeb', path: '/info-gathering/whatweb' },
      { name: 'Wappalyzer', path: '/info-gathering/wappalyzer' },
      { name: 'WPScan', path: '/info-gathering/wpscan' },
      { name: 'Wafw00f', path: '/info-gathering/wafw00f' },
    ],
    networkScanners: [
      { name: 'Nmap', path: '/info-gathering/nmap' },
      { name: 'Traceroute', path: '/info-gathering/traceroute' },
      { name: 'Zmap', path: '/info-gathering/zmap' },
    ],
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const NavLink = ({ to, children, onClick }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`sidebar-link flex items-center gap-3 p-3 rounded-lg text-sm transition-all duration-300 font-medium
          ${isActive
            ? 'bg-white text-black shadow-md'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
      >
        {children}
      </Link>
    );
  };

  return (
    <>
      {/* Hamburger Menu Button (Visible on Mobile) */}
      <button
        className="md:hidden fixed top-6 left-6 z-50 p-2 bg-cyber-card border border-cyber-primary text-cyber-primary rounded-lg shadow-[0_0_15px_rgba(255,56,56,0.3)] hover:shadow-[0_0_20px_rgba(255,56,56,0.5)] transition-all"
        onClick={toggleSidebar}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        ref={containerRef}
        className={`fixed top-0 left-0 h-screen w-3/4 sm:w-1/2 md:w-64 glass-panel border-r border-white/10 flex flex-col 
          transform transition-transform duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 pt-16 md:pt-0 overflow-y-auto rounded-none`}
      >
        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 mt-4 md:mt-0">
          {/* Dashboard */}
          <NavLink to="/" onClick={() => setIsOpen(false)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </NavLink>

          {/* Security Report */}
          <NavLink to="/security-report" onClick={() => setIsOpen(false)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Security Report
          </NavLink>


          {/* Tools (Parent) */}
          <NavLink to="/tools" onClick={() => setIsOpen(false)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            All Tools
          </NavLink>

          <div className="my-4 border-t border-white/10"></div>

          {/* Reconnaissance Section */}
          <div>
            <button
              onClick={() => toggleSection('reconnaissance')}
              className="w-full flex items-center justify-between p-2 text-xs font-semibold uppercase text-gray-500 hover:text-cyber-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>Reconnaissance</span>
              </div>
              <svg className={`w-3 h-3 transition-transform ${expandedSections.reconnaissance ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections.reconnaissance && (
              <div className="pl-2 mt-1 space-y-1">
                {tools.reconnaissance.map((tool, idx) => (
                  <NavLink key={idx} to={tool.path} onClick={() => setIsOpen(false)}>
                    <span className="text-lg leading-none opacity-70">›</span> {tool.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Web Scanners Section */}
          <div className="mt-4">
            <button
              onClick={() => toggleSection('webScanners')}
              className="w-full flex items-center justify-between p-2 text-xs font-semibold uppercase text-gray-500 hover:text-cyber-secondary transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>Web Scanners</span>
              </div>
              <svg className={`w-3 h-3 transition-transform ${expandedSections.webScanners ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.webScanners && (
              <div className="pl-2 mt-1 space-y-1">
                {tools.webScanners.map((tool, idx) => (
                  <NavLink key={idx} to={tool.path} onClick={() => setIsOpen(false)}>
                    <span className="text-lg leading-none opacity-70">›</span> {tool.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Network Scanners Section */}
          <div className="mt-4">
            <button
              onClick={() => toggleSection('networkScanners')}
              className="w-full flex items-center justify-between p-2 text-xs font-semibold uppercase text-gray-500 hover:text-cyber-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>Network</span>
              </div>
              <svg className={`w-3 h-3 transition-transform ${expandedSections.networkScanners ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.networkScanners && (
              <div className="pl-2 mt-1 space-y-1">
                {tools.networkScanners.map((tool, idx) => (
                  <NavLink key={idx} to={tool.path} onClick={() => setIsOpen(false)}>
                    <span className="text-lg leading-none opacity-70">›</span> {tool.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}

export default Sidebar;