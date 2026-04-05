import { useState, useRef } from "react";
import axios from "axios";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { API_BASE_URL } from "../config";
import ResultDisplay from "../components/ResultDisplay";

const parseWafw00fOutput = (text) => {
  if (!text) return null;

  const result = {
    hasWaf: false,
    wafs: [],
    raw: text
  };

  if (text.includes("The site is behind a WAF")) {
    result.hasWaf = true;
    const lines = text.split('\n');
    let capture = false;
    lines.forEach(line => {
      if (line.includes("The site is behind a WAF")) {
        capture = true;
      } else if (capture && line.trim()) {
        result.wafs.push(line.trim());
      }
    });
  }

  return result;
};

const Wafw00fResults = ({ output }) => {
  const data = parseWafw00fOutput(output);

  if (!data) return <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">{output}</pre>;

  return (
    <div className="space-y-6 font-mono text-sm">
      <div className={`p-6 rounded-lg border ${data.hasWaf ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'} flex flex-col items-center justify-center text-center`}>
        {data.hasWaf ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">WAF Detected!</h3>
            <p className="text-red-300 text-sm">This website is protected by a Web Application Firewall.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">No WAF Detected</h3>
            <p className="text-green-300 text-sm">This website does not appear to be protected by a generic WAF.</p>
          </>
        )}
      </div>

      {data.hasWaf && data.wafs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-gray-400 font-bold uppercase tracking-wider text-xs border-b border-white/10 pb-2">Detected Firewalls</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.wafs.map((waf, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg">
                <svg className="w-5 h-5 text-cyber-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="text-white font-medium">{waf}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Output Fallback/Toggle */}
      <div className="opacity-50 hover:opacity-100 transition-opacity">
        <h4 className="text-gray-600 font-bold uppercase tracking-wider text-xs mb-2">Raw Output Log</h4>
        <pre className="text-gray-500 font-mono text-xs whitespace-pre-wrap bg-black/20 p-2 rounded">{data.raw}</pre>
      </div>
    </div>
  );
};


function Wafw00f() {
  const [url, setUrl] = useState("");
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
    if (!url) {
      setError("Please enter a URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/wafw00f`, { url });
      setResult(response.data.output);
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
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Wafw00f</h2>
          <p className="text-cyber-primary font-mono text-xs tracking-[0.2em] uppercase mt-1">WAF Detection & Fingerprinting</p>
        </div>
      </div>

      {/* Usage Guide */}
      <div className="gsap-guide glass-panel p-4 border border-white/5 bg-white/5 rounded-lg opacity-0">
        <h3 className="text-sm font-bold text-cyber-secondary mb-2 uppercase tracking-wider">How to use</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Enter a URL (e.g., <code className="text-cyber-primary bg-black/30 px-1 rounded">https://example.com</code>) to detect if the site is protected by a Web Application Firewall (WAF) and identify its type.
        </p>
      </div>

      {/* Input Panel */}
      <div className="gsap-input glass-panel p-8 border border-white/10 relative overflow-hidden opacity-0">
        <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">Target URL</label>
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all font-mono"
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
                Detecting...
              </>
            ) : "Start Detection"}
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
          title="WAF Detection Results"
          status={result.includes("No WAF detected") ? "completed" : "completed"}
          output={result}
        >
          <Wafw00fResults output={result} />
        </ResultDisplay>
      )}
    </div>
  );
}

export default Wafw00f;
