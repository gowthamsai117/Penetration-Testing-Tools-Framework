import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ToolCard from './ToolCards';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function Tools() {
  const containerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tools = [
    { name: 'Nmap', description: 'Network exploration tool and security / port scanner.', icon: '🛰️', category: 'Network', path: '/info-gathering/nmap' },
    { name: 'Traceroute', description: 'Print the route (path) packets take to network host.', icon: '🧭', category: 'Network', path: '/info-gathering/traceroute' },
    { name: 'Dig', description: 'DNS lookup utility. Queries DNS name servers.', icon: '🔎', category: 'Recon', path: '/info-gathering/dig' },
    { name: 'Dnsenum', description: 'Multithreaded perl script to enumerate DNS information.', icon: '📘', category: 'Recon', path: '/info-gathering/dnsenum' },
    { name: 'Dnsmap', description: 'Scan for subdomains using a wordlist.', icon: '🗺️', category: 'Recon', path: '/info-gathering/dnsmap' },
    { name: 'Sublist3r', description: 'Fast subdomains enumeration tool for penetration testers.', icon: '🔗', category: 'Recon', path: '/info-gathering/sublist3r' },
    { name: 'theHarvester', description: 'Gather emails, subdomains, hosts, employee names, open ports.', icon: '📥', category: 'Recon', path: '/info-gathering/theharvester' },
    { name: 'Recon-ng', description: 'Full-featured mapping and reconnaissance web reconnaissance framework.', icon: '🧩', category: 'Recon', path: '/info-gathering/recon-ng' },
    { name: 'WhatWeb', description: 'Next generation web scanner. Identifies technologies used.', icon: '🧪', category: 'Web', path: '/info-gathering/whatweb' },
    { name: 'Wappalyzer', description: 'Cross-platform utility that uncovers the technologies used on websites.', icon: '🧱', category: 'Web', path: '/info-gathering/wappalyzer' },
    { name: 'WPScan', description: 'WordPress security scanner. black box WordPress vulnerability scanner.', icon: '🗂️', category: 'Web', path: '/info-gathering/wpscan' },
    { name: 'Wafw00f', description: 'Identifies and fingerprints Web Application Firewall (WAF) products.', icon: '🛡️', category: 'Web', path: '/info-gathering/wafw00f' },
    { name: 'Zmap', description: 'Fast single packet network scanner designed for Internet-wide network surveys.', icon: '⚡', category: 'Network', path: '/info-gathering/zmap' },
  ];

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useGSAP(() => {
    gsap.fromTo('.tool-card-item',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
    );
  }, { scope: containerRef, dependencies: [filteredTools] }); // Re-animate when filter changes

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div ref={containerRef} className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Tool Arsenal</h2>
          <p className="text-gray-400 font-mono text-sm">SELECT A MODULE TO INITIATE SEQUENCE</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search tools, categories..."
            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg leading-5 bg-black/40 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary sm:text-sm transition-colors"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="h-px bg-white/10 w-full"></div>

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool, index) => (
            <Link key={index} to={tool.path} className="tool-card-item">
              <ToolCard name={tool.name} description={tool.description} icon={tool.icon} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center">
          <div className="inline-block p-4 rounded-full bg-white/5 mb-4">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No tools found</h3>
          <p className="text-gray-400">Try adjusting your search criteria or clear filters.</p>
        </div>
      )}
    </div>
  );
}

export default Tools;