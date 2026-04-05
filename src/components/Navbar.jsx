import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function Navbar({ backendStatus = 'CHECKING...' }) {
  const logoRef = useRef(null);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useGSAP(() => {
    gsap.fromTo(logoRef.current,
      { rotate: -180, scale: 0, opacity: 0 },
      { rotate: 0, scale: 1, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.5)' }
    );
  }, { scope: logoRef });

  return (
    <nav className="glass-panel m-4 mb-0 p-4 pl-16 md:pl-4 flex flex-col md:flex-row justify-between items-center sticky top-4 z-30">
      {/* Left Side: Logo */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <Link to="/" className="flex items-center group">
          <div ref={logoRef} className="w-8 h-8 md:w-10 md:h-10 mr-3 rounded-xl bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4m-4-4c0-1.1-.9-2-2-2s-2 .9-2 2 2 4 2 4m4-8V3m0 18v-3m-4 0v3m0-18v3m8 2h3m-18 0h-3m12 8h3m-18 0h-3"
              />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight">Pentest Tools</span>
            <span className="text-xs text-gray-400 font-mono tracking-widest">ADVANCED SECURITY SUITE</span>
          </div>
        </Link>
      </div>

      {/* Right Side: Actions */}
      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mt-2 md:mt-0">
        <div className={`px-3 py-1 rounded-full border text-xs font-mono transition-colors duration-300 ${backendStatus === 'ONLINE'
            ? 'bg-cyber-success/10 border-cyber-success/30 text-cyber-success'
            : backendStatus === 'OFFLINE'
              ? 'bg-cyber-danger/10 border-cyber-danger/30 text-cyber-danger'
              : 'bg-cyber-accent/10 border-cyber-accent/30 text-cyber-accent'
          }`}>
          <span className={`w-2 h-2 inline-block rounded-full mr-2 animate-pulse ${backendStatus === 'ONLINE' ? 'bg-cyber-success' : backendStatus === 'OFFLINE' ? 'bg-cyber-danger' : 'bg-cyber-accent'
            }`}></span>
          SYSTEM {backendStatus}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;