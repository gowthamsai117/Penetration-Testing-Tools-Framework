import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from './config';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SplashScreen from './components/SplashScreen';
import Home from './pages/Home';
import Tools from './pages/Tools';
import InfoGathering from './pages/InfoGathering';
import TheHarvester from './tools/TheHarvester';
import ReconNg from './tools/ReconNg';
import Dnsenum from './tools/Dnsenum';
import Sublist3r from './tools/Sublist3r';
import Nmap from './tools/Nmap';
import Zmap from './tools/Zmap';
import Shodan from './tools/Shodan';
import WhatWeb from './tools/WhatWeb';
import Wappalyzer from './tools/Wappalyzer';
import WPScan from './tools/WPScan';
import Wafw00f from './tools/Wafw00f';
import Dig from './tools/Dig';
import Dnsmap from './tools/Dnsmap';
import Traceroute from './tools/Traceroute';
import SecurityReport from './pages/SecurityReport';

// Placeholder components for other routes
function WebVulnScanners() {
  return <div className="text-center p-8">Web Vulnerability Scanners Page (Under Construction)</div>;
}

function NetworkVulnScanners() {
  return <div className="text-center p-8">Network & System Vulnerability Scanners Page (Under Construction)</div>;
}

function ExploitationTools() {
  return <div className="text-center p-8">Exploitation Tools Page (Under Construction)</div>;
}

function PasswordCracking() {
  return <div className="text-center p-8">Password Cracking & Brute-Force Page (Under Construction)</div>;
}

function Fuzzing() {
  return <div className="text-center p-8">Fuzzing & Input Validation Testing Page (Under Construction)</div>;
}

function ReportingAutomation() {
  return <div className="text-center p-8">Reporting & Automation Page (Under Construction)</div>;
}

const AnimatedRoutes = () => {
  const containerRef = useRef(null);
  const location = useLocation();

  useGSAP(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 15, filter: 'blur(5px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out' }
    );
  }, { scope: containerRef, dependencies: [location.pathname] });

  return (
    <div ref={containerRef} className="flex-1 p-6 overflow-y-auto w-full">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/info-gathering" element={<InfoGathering />} />
        <Route path="/info-gathering/theharvester" element={<TheHarvester />} />
        <Route path="/info-gathering/recon-ng" element={<ReconNg />} />
        <Route path="/info-gathering/dnsenum" element={<Dnsenum />} />
        <Route path="/info-gathering/sublist3r" element={<Sublist3r />} />
        <Route path="/info-gathering/nmap" element={<Nmap />} />
        <Route path="/info-gathering/zmap" element={<Zmap />} />
        <Route path="/info-gathering/shodan" element={<Shodan />} />
        <Route path="/info-gathering/whatweb" element={<WhatWeb />} />
        <Route path="/info-gathering/wappalyzer" element={<Wappalyzer />} />
        <Route path="/info-gathering/wpscan" element={<WPScan />} />
        <Route path="/info-gathering/wafw00f" element={<Wafw00f />} />
        <Route path="/info-gathering/dig" element={<Dig />} />
        <Route path="/info-gathering/dnsmap" element={<Dnsmap />} />
        <Route path="/info-gathering/traceroute" element={<Traceroute />} />
        <Route path="/web-vuln-scanners" element={<WebVulnScanners />} />
        <Route path="/network-vuln-scanners" element={<NetworkVulnScanners />} />
        <Route path="/exploitation-tools" element={<ExploitationTools />} />
        <Route path="/password-cracking" element={<PasswordCracking />} />
        <Route path="/fuzzing" element={<Fuzzing />} />
        <Route path="/reporting-automation" element={<ReportingAutomation />} />
        <Route path="/security-report" element={<SecurityReport />} />
      </Routes>
    </div>
  );
};

import Introduction from './pages/Introduction';

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // Initially false, triggered after intro
  const [backendStatus, setBackendStatus] = useState('CHECKING...');

  useEffect(() => {
    // Check Backend Status
    const checkStatus = () => {
      fetch(`${API_BASE_URL}/`)
        .then(() => setBackendStatus('ONLINE'))
        .catch(() => setBackendStatus('OFFLINE'));
    };

    checkStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    console.log("App: handleStart called");

    // Force navigation to dashboard root
    window.history.pushState(null, '', '/');

    setShowIntro(false);
    setIsLoading(true);

    // Simulate loading time after intro
    setTimeout(() => {
      setIsLoading(false);
    }, 2500);
  };

  if (showIntro) {
    return <Introduction onStart={handleStart} />;
  }

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen text-cyber-text font-sans selection:bg-cyber-primary selection:text-white bg-cyber-bg">
        <div className="flex flex-1 relative">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col md:ml-64 bg-transparent min-h-screen transition-all duration-300">
            {/* Navbar moved inside to respect sidebar offset */}
            <Navbar backendStatus={backendStatus} />

            {/* Animated Routes Container */}
            <AnimatedRoutes />

            <Footer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;