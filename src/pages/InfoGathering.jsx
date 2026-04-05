import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ToolCard from './ToolCards';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function InfoGathering() {
  const containerRef = useRef(null);
  const tools = [
    {
      name: 'theHarvester',
      description: 'Gather emails, subdomains, hosts, and employee names from public sources like search engines and social media.',
      icon: '📧',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/theharvester',
    },
    {
      name: 'Recon-ng',
      description: 'A modular framework for open-source intelligence (OSINT) gathering with a focus on reconnaissance.',
      icon: '🛠️',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/recon-ng',
    },
    {
      name: 'Dnsenum',
      description: 'Enumerate DNS information of a domain, including subdomains, using brute-forcing and public sources.',
      icon: '🌐',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/dnsenum',
    },
    {
      name: 'Sublist3r',
      description: 'Enumerate subdomains using OSINT, leveraging search engines like Google, Yahoo, and Bing.',
      icon: '🔗',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/sublist3r',
    },
    {
      name: 'Nmap',
      description: 'Network exploration tool and security/port scanner to discover hosts and services on a network.',
      icon: '🔍',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/nmap',
    },
    {
      name: 'Zmap',
      description: 'A fast network scanner designed for Internet-wide network surveys and reconnaissance.',
      icon: '⚡',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/zmap',
    },
    {
      name: 'Shodan',
      description: 'Search engine for Internet-connected devices. Discover devices/hosts using the Shodan API.',
      icon: '👁️',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/shodan',
    },
    {
      name: 'WhatWeb',
      description: 'Identify web technologies, CMS, frameworks, and server details on a target website.',
      icon: '🌐',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/whatweb',
    },
    {
      name: 'Wappalyzer (CLI)',
      description: 'Command-line tool to uncover technologies used on websites, such as CMS, frameworks, and libraries.',
      icon: '🔧',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/wappalyzer',
    },
    {
      name: 'WPScan',
      description: 'Scan WordPress sites for vulnerabilities, enumerate users, and detect outdated plugins.',
      icon: '🖥️',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/wpscan',
    },
    {
      name: 'Wafw00f',
      description: 'Detect and fingerprint web application firewalls (WAFs) protecting a target website.',
      icon: '🛡️',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/wafw00f',
    },
    {
      name: 'Dig',
      description: 'Query DNS servers for information like A, MX, and TXT records for a given domain.',
      icon: '📋',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/dig',
    },
    {
      name: 'Dnsmap',
      description: 'Scan a domain for subdomains using a built-in or external wordlist, focusing on DNS enumeration.',
      icon: '🗺️',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/dnsmap',
    },
    {
      name: 'Traceroute',
      description: 'Trace the route packets take to a network host, identifying intermediate hops and latency.',
      icon: '🛤️',
      category: 'Information Gathering & Reconnaissance',
      route: '/info-gathering/traceroute',
    },
  ];

  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  useGSAP(() => {
    gsap.fromTo('.ig-tool-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
    );
  }, { scope: containerRef, dependencies: [filteredTools] });

  return (
    <div ref={containerRef} className="p-4 sm:p-6 md:p-8 animate-fade-in">
      {/* Tabbed Navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex space-x-2 sm:space-x-4">
          <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Information Gathering & Reconnaissance
          </h2>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Quick find..."
            className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg bg-black/40 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-colors font-mono text-sm"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Tools Section */}
      {filteredTools.length > 0 ? (
        <div className="mb-4 sm:mb-6">
          <h3 className="text-sm sm:text-base font-bold text-cyber-primary uppercase tracking-wider mb-4">Available Modules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTools.map((tool, index) => (
              tool.route ? (
                <Link to={tool.route} key={index} className="ig-tool-card">
                  <ToolCard
                    name={tool.name}
                    description={tool.description}
                    icon={tool.icon}
                  />
                </Link>
              ) : (
                <div key={index} className="ig-tool-card">
                  <ToolCard
                    key={index}
                    name={tool.name}
                    description={tool.description}
                    icon={tool.icon}
                  />
                </div>
              )
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center border-dashed">
          <div className="inline-block p-4 rounded-full bg-white/5 mb-4">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No modules found</h3>
          <p className="text-gray-400">System could not locate requested tool.</p>
        </div>
      )}
    </div>
  );
}

export default InfoGathering;