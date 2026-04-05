import { useState, useRef } from "react";
import axios from "axios";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { API_BASE_URL } from "../config";
import ResultDisplay from "../components/ResultDisplay";

function Dig() {
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
      const response = await axios.post(`${API_BASE_URL}/dig`, { domain });
      // Backend returns the records object directly
      setResult(response.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch data. Make sure the backend is running.");
    }

    setLoading(false);
  };

  return (
    <div ref={containerRef} className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="gsap-header flex items-center gap-4 opacity-0">
        <div className="p-3 rounded-lg bg-cyber-primary/10 border border-cyber-primary/50 text-cyber-primary shadow-[0_0_15px_rgba(0,243,255,0.2)]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Dig DNS Lookup</h2>
          <p className="text-cyber-primary font-mono text-xs tracking-[0.2em] uppercase mt-1">Domain Information Groper</p>
        </div>
      </div>

      {/* Usage Guide */}
      <div className="gsap-guide glass-panel p-4 border border-white/5 bg-white/5 rounded-lg opacity-0">
        <h3 className="text-sm font-bold text-cyber-secondary mb-2 uppercase tracking-wider">How to use</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Enter a domain name (e.g., <code className="text-cyber-primary bg-black/30 px-1 rounded">example.com</code>) to retrieve detailed DNS records including A, MX, NS, and TXT.
          Use this to verify DNS configurations and identify mail servers.
        </p>
      </div>

      {/* Input Panel */}
      <div className="gsap-input glass-panel p-8 border border-white/10 relative overflow-hidden opacity-0">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
        </div>

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
                Running...
              </>
            ) : "Execute Scan"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-3 animate-slide-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}
      </div>

      {/* Results Panel */}
      {result && (
        <ResultDisplay
          title="DNS Analysis Results"
          status="completed"
          output={result}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(result).map(([recordType, data], index) => (
              <div key={index} className="border border-white/5 rounded-lg overflow-hidden bg-black/20 hover:bg-black/40 transition-colors group/item">
                <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex justify-between items-center group-hover/item:bg-white/10 transition-colors">
                  <span className="font-mono text-cyber-secondary font-bold text-xs uppercase">{recordType.replace('_Records', '')}</span>
                  <span className="text-[10px] text-gray-600 font-mono">REQ_ID_{index}</span>
                </div>
                <div className="p-4 font-mono text-sm text-gray-300">
                  {Array.isArray(data) ? (
                    <ul className="space-y-1">
                      {data.map((item, i) => (
                        <li key={i} className="break-all border-l-2 border-transparent hover:border-cyber-primary pl-2 transition-all text-gray-400 hover:text-white">
                          {typeof item === 'object' ? JSON.stringify(item) : item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-xs">{data}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ResultDisplay>
      )}
    </div>
  );
}

export default Dig;
