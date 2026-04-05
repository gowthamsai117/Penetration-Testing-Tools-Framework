import { useState, useRef } from "react";
import axios from "axios";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { API_BASE_URL } from "../config";
import ResultDisplay from "../components/ResultDisplay";

function Dnsenum() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(".gsap-header",
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 }
    )
      .fromTo(".gsap-guide",
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6 },
        "-=0.4"
      )
      .fromTo(".gsap-input",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.4"
      );
  }, { scope: containerRef });

  const handleScan = async () => {
    if (!domain) {
      setError("Please enter a domain name.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/dnsenum`, { domain });
      // Backend returns { Records: {}, Subdomains: [] }
      setResult(response.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch data. Make sure the backend is running.");
    }

    setLoading(false);
  };

  return (
    <div ref={containerRef} className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="gsap-header flex items-center gap-4 opacity-0">
        <div className="p-3 rounded-lg bg-cyber-primary/10 border border-cyber-primary/50 text-cyber-primary shadow-[0_0_15px_rgba(0,243,255,0.2)]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">DNS Enumeration</h2>
          <p className="text-cyber-primary font-mono text-xs tracking-[0.2em] uppercase mt-1">Recursive Subdomain & Record Harvester</p>
        </div>
      </div>

      {/* Usage Guide */}
      <div className="gsap-guide glass-panel p-4 border border-white/5 bg-white/5 rounded-lg opacity-0">
        <h3 className="text-sm font-bold text-cyber-secondary mb-2 uppercase tracking-wider">How to use</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Enter a target domain (e.g., <code className="text-cyber-primary bg-black/30 px-1 rounded">example.com</code>) to perform comprehensive DNS enumeration.
          This tool attempts to find subdomains, zone transfers, and mail servers to map the attack surface.
        </p>
      </div>

      {/* Input Panel */}
      <div className="gsap-input glass-panel p-8 border border-white/10 relative overflow-hidden opacity-0">
        <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">Target Domain</label>
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 font-mono">https://</span>
            </div>
            <input
              type="text"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-20 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all font-mono"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={loading}
            className="bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/50 hover:bg-cyber-primary hover:text-black font-bold py-3 px-8 rounded-lg transition-all duration-300 uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,243,255,0.1)] hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enumerating...
              </>
            ) : "Start Enumeration"}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-3 animate-slide-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}
      </div>

      {result && (
        <ResultDisplay
          title="DNS Enumeration Results"
          status="completed"
          output={result}
        >
          <div className="space-y-6">
            {/* Records Section */}
            <div className="border border-white/5 rounded-lg bg-black/20 overflow-hidden">
              <h3 className="text-xs font-bold text-cyber-secondary p-3 bg-white/5 uppercase tracking-wider border-b border-white/5">DNS Records</h3>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.Records && Object.entries(result.Records).map(([type, data], index) => (
                  <div key={index} className="bg-black/30 rounded p-3 font-mono text-sm border border-white/5 hover:border-cyber-primary/30 transition-colors">
                    <span className="text-cyber-primary font-bold block mb-1">{type.replace('_Records', '')}</span>
                    <span className="text-gray-400 break-all text-xs">
                      {Array.isArray(data) ? data.join(', ') : data}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subdomains Section */}
            <div className="border border-white/5 rounded-lg bg-black/20 overflow-hidden">
              <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-bold text-cyber-accent uppercase tracking-wider">Subdomains Found</h3>
                <span className="text-[10px] bg-cyber-accent/20 text-cyber-accent px-2 py-0.5 rounded font-mono">
                  {result.Subdomains ? result.Subdomains.length : 0} DETECTED
                </span>
              </div>

              <div className="p-4">
                {result.Subdomains && result.Subdomains.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {result.Subdomains.map((sub, i) => (
                      <div key={i} className="bg-black/40 border border-white/5 p-2 rounded text-xs font-mono text-gray-300 hover:text-white hover:border-cyber-accent/50 transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-accent/50"></span>
                        {sub}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm">No subdomains found.</p>
                )}
              </div>
            </div>
          </div>
        </ResultDisplay>
      )}
    </div>
  );
}

export default Dnsenum;
