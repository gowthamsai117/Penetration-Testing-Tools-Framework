import { useState, useRef } from "react";
import axios from "axios";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { API_BASE_URL } from "../config";
import ResultDisplay from "../components/ResultDisplay";

function Nmap() {
  const [target, setTarget] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({});
  // Simplified state - removed options
  // const [options, setOptions] = useState({...});
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
    if (!target) {
      setError("Please enter a target.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/nmap`, {
        target
      });
      console.log("Nmap Data:", response.data);

      // If structured data is available (new backend), use that as the primary result object
      // but ensure 'raw_output' or 'output' is attached for the fallback view
      if (response.data.structured) {
        const combinedResult = {
          ...response.data.structured,
          raw_output: response.data.output // Attach the formatted text log as raw_output
        };
        setResult(combinedResult);
      } else {
        // Fallback for older backend or text-only logic
        setResult(response.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch data. Make sure the backend is running.");
    }

    setLoading(false);
  };

  // Removed client-side parsing - backend will return JSON
  const sections = []; // Placeholder if needed, or remove completely
  // const raw = ""; // Unused

  // Toggle section visibility
  const toggleSection = (sectionTitle) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  return (
    <div ref={containerRef} className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="gsap-header flex items-center gap-4 opacity-0">
        <div className="p-3 rounded-lg bg-cyber-primary/10 border border-cyber-primary/50 text-cyber-primary shadow-[0_0_15px_rgba(0,243,255,0.2)]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Nmap Network Scanner</h2>
          <p className="text-cyber-primary font-mono text-xs tracking-[0.2em] uppercase mt-1">Advanced Port Scanning & OS Detection</p>
        </div>
      </div>

      {/* Usage Guide */}
      <div className="gsap-guide glass-panel p-4 border border-white/5 bg-white/5 rounded-lg opacity-0">
        <h3 className="text-sm font-bold text-cyber-secondary mb-2 uppercase tracking-wider">How to use</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Enter a target IP address or hostname (e.g., <code className="text-cyber-primary bg-black/30 px-1 rounded">192.168.1.1</code> or <code className="text-cyber-primary bg-black/30 px-1 rounded">scanme.nmap.org</code>).
          This tool scans for open ports, running services, and operating system details to identify network vulnerabilities.
        </p>
      </div>

      {/* Input Panel */}
      <div className="gsap-input glass-panel p-8 border border-white/10 relative overflow-hidden opacity-0">
        <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">Target Host</label>
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 font-mono">IP/URL</span>
            </div>
            <input
              type="text"
              placeholder="192.168.1.1 or example.com"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-16 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all font-mono"
            />
            <div className="absolute right-3 top-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyber-primary/50"></span>
              </span>
            </div>
          </div>
          <button
            onClick={handleScan}
            disabled={loading}
            className="bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/50 hover:bg-cyber-primary hover:text-black font-bold py-3 px-8 rounded-lg transition-all duration-300 uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,243,255,0.1)] hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                EXECUTING...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                INITIATE SCAN
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2 animate-slide-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}
      </div>

      {/* Results Panel */}
      {result && (
        <ResultDisplay
          title="Network Scan Results"
          status="completed"
          output={result}
        >
          <div className="space-y-6">
            {result.ports ? (
              <>
                {/* Host Info Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                    <h4 className="text-cyber-secondary text-xs uppercase tracking-widest font-bold mb-2">Host Status</h4>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${result.status === 'up' ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-red-500'}`}></span>
                      <span className="text-xl font-bold text-white capitalize">{result.status || 'Unknown'}</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1 font-mono">{result.host}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                    <h4 className="text-cyber-accent text-xs uppercase tracking-widest font-bold mb-2">Operating System</h4>
                    <p className="text-white font-mono text-sm">{result.os || 'Detection Failed / Unknown'}</p>
                  </div>
                </div>

                {/* Ports Table */}
                <div className="bg-black/30 border border-white/10 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Discovered Ports</h3>
                    <span className="text-xs text-gray-400 font-mono">{result.ports ? result.ports.length : 0} PORTS OPEN</span>
                  </div>

                  {result.ports && result.ports.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-black/40 text-gray-500 text-xs border-b border-white/5">
                            <th className="py-3 px-4 font-mono">PORT</th>
                            <th className="py-3 px-4 font-mono">PROTO</th>
                            <th className="py-3 px-4 font-mono">STATE</th>
                            <th className="py-3 px-4 font-mono">SERVICE</th>
                            <th className="py-3 px-4 font-mono">VERSION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {result.ports.map((port, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors group">
                              <td className="py-3 px-4 font-mono text-cyber-primary font-bold">{port.port}</td>
                              <td className="py-3 px-4 text-gray-400 text-sm uppercase">{port.protocol}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/20 uppercase">
                                  {port.state}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-white text-sm font-medium">{port.service}</td>
                              <td className="py-3 px-4 text-gray-400 text-sm italic">{port.version || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 italic">
                      No open ports found or host is blocking probes.
                    </div>
                  )}
                </div>

                {/* Raw Output Fallback */}
                {result.raw_output && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleSection('raw')}
                      className="text-xs text-cyber-secondary hover:text-white underline transition-colors"
                    >
                      {expandedSections['raw'] ? 'Hide Raw Output' : 'Show Raw Nmap Output'}
                    </button>
                    {expandedSections['raw'] && (
                      <div className="mt-2 p-4 bg-black/50 border border-white/10 rounded font-mono text-xs text-gray-400 whitespace-pre-wrap">
                        {result.raw_output}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Text Output Mode (for user provided code) */
              <div className="bg-black/30 border border-white/10 rounded-lg overflow-hidden p-4">
                <h3 className="text-sm font-bold text-cyber-primary mb-2 uppercase tracking-wider border-b border-white/10 pb-2">Scan Output</h3>
                <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {result.output || result.raw_output || "No output returned."}
                </div>
              </div>
            )}
          </div>
        </ResultDisplay>
      )}

      <div className="mt-8 border-t border-white/10 pt-4 flex justify-between items-center opacity-50 text-[10px]">
        <span className="text-gray-500 font-mono">SEC_LEVEL_HIGH</span>
        <span className="text-gray-500 font-mono">NMAP KERNEL v7.92</span>
      </div>
    </div>
  );
}

export default Nmap;
