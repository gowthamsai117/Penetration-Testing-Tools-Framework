import { useState, useRef } from "react";
import axios from "axios";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { API_BASE_URL } from "../config";
import ResultDisplay from "../components/ResultDisplay";

const parseWPScanOutput = (text) => {
  if (!text) return null;

  const sections = {
    info: [],
    version: null,
    plugins: [],
    themes: [],
    users: [],
    raw: text
  };

  const lines = text.split('\n');
  let currentSection = 'info';

  lines.forEach(line => {
    const l = line.trim();
    if (!l) return;

    if (l.includes('Enumerating plugins')) {
      currentSection = 'plugins';
      return;
    } else if (l.includes('Enumerating themes')) {
      currentSection = 'themes';
      return;
    } else if (l.includes('Users (from REST API)')) {
      currentSection = 'users';
      return;
    } else if (l.includes('WordPress version')) {
      // Extract version
      const match = l.match(/WordPress version:? ([\d.]+)/i);
      if (match) sections.version = match[1];
      else sections.info.push(l);
      return;
    }

    if (l.startsWith('[+]') || l.startsWith('[!]') || l.startsWith('[i]')) {
      if (currentSection === 'info' && !l.includes('WordPress version')) {
        sections.info.push(l);
      }
      // Don't change section based on these prefixes alone as they appear everywhere
    }

    if (l.startsWith('-')) {
      const content = l.substring(1).trim();
      if (currentSection === 'plugins') sections.plugins.push(content);
      else if (currentSection === 'themes') sections.themes.push(content);
      else if (currentSection === 'users') sections.users.push(content);
    }
  });

  return sections;
};

const WPScanResults = ({ output }) => {
  const data = parseWPScanOutput(output);

  if (!data) return <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">{output}</pre>;

  return (
    <div className="space-y-6 font-mono text-sm">
      {/* General Info & Version */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-cyber-primary font-bold uppercase tracking-wider mb-2 text-xs">Target Info</h4>
          {data.version && (
            <div className="mb-2">
              <span className="text-gray-400">WordPress Version: </span>
              <span className="text-white font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">{data.version}</span>
            </div>
          )}
          {data.info.map((info, i) => (
            <div key={i} className="text-gray-300 text-xs py-0.5">{info}</div>
          ))}
        </div>
      </div>

      {/* Plugins */}
      {data.plugins.length > 0 && (
        <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
            <h4 className="text-cyber-secondary font-bold uppercase tracking-wider text-xs">Plugins Found</h4>
            <span className="text-xs bg-cyber-secondary/20 text-cyber-secondary px-2 py-0.5 rounded-full">{data.plugins.length}</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.plugins.map((plugin, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300 bg-black/20 p-2 rounded border border-white/5">
                <svg className="w-4 h-4 text-cyber-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                <span>{plugin}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Themes */}
      {data.themes.length > 0 && (
        <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
            <h4 className="text-pink-400 font-bold uppercase tracking-wider text-xs">Themes Found</h4>
            <span className="text-xs bg-pink-400/20 text-pink-400 px-2 py-0.5 rounded-full">{data.themes.length}</span>
          </div>
          <div className="p-4">
            {data.themes.map((theme, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300 mb-1">
                <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                {theme}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {data.users.length > 0 && (
        <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
            <h4 className="text-yellow-400 font-bold uppercase tracking-wider text-xs">Users Found</h4>
            <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">{data.users.length}</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.users.map((user, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300 bg-black/20 p-2 rounded border border-white/5">
                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span>{user}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Backup (Hidden by default or in a toggle could be better, but let's just not show it if we parsed something, render logic is up to us) */}
      {/* If nothing relevant found but data parsed, we might want to show raw to be safe? */}
      {(!data.plugins.length && !data.themes.length && !data.users.length && !data.version) && (
        <div className="opacity-70">
          <h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-2">Raw Output</h4>
          <pre className="text-gray-400 font-mono text-xs whitespace-pre-wrap">{data.raw}</pre>
        </div>
      )}
    </div>
  );
};


function WPScan() {
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
      const response = await axios.post(`${API_BASE_URL}/wpscan`, { url });
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
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">WPScan</h2>
          <p className="text-cyber-primary font-mono text-xs tracking-[0.2em] uppercase mt-1">WordPress Vulnerability Scanner</p>
        </div>
      </div>

      {/* Usage Guide */}
      <div className="gsap-guide glass-panel p-4 border border-white/5 bg-white/5 rounded-lg opacity-0">
        <h3 className="text-sm font-bold text-cyber-secondary mb-2 uppercase tracking-wider">How to use</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Enter a WordPress website URL (e.g., <code className="text-cyber-primary bg-black/30 px-1 rounded">https://example.com</code>) to enumerate users, plugins, themes, and detect known vulnerabilities.
        </p>
      </div>

      {/* Input Panel */}
      <div className="gsap-input glass-panel p-8 border border-white/10 relative overflow-hidden opacity-0">
        <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">WordPress URL</label>
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
                Scanning...
              </>
            ) : "Scan Target"}
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
          title="WPScan Results"
          status="completed"
          output={result}
        >
          <WPScanResults output={result} />
        </ResultDisplay>
      )}
    </div>
  );
}

export default WPScan;
