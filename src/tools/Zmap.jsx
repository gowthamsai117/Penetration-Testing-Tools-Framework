import { useState, useRef } from "react";
import axios from "axios";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { API_BASE_URL } from "../config";
import ResultDisplay from "../components/ResultDisplay";

function Zmap() {
    const [target, setTarget] = useState("");
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
        if (!target) {
            setError("Please enter a target IP range.");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/zmap`, { ip_range: target });
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
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">ZMap</h2>
                    <p className="text-cyber-primary font-mono text-xs tracking-[0.2em] uppercase mt-1">Single Packet Internet Scanner</p>
                </div>
            </div>

            {/* Usage Guide */}
            <div className="gsap-guide glass-panel p-4 border border-white/5 bg-white/5 rounded-lg opacity-0">
                <h3 className="text-sm font-bold text-cyber-secondary mb-2 uppercase tracking-wider">How to use</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Enter a target IP range or CIDR (e.g., <code className="text-cyber-primary bg-black/30 px-1 rounded">192.168.1.0/24</code>) to scan for open ports.
                    ZMap is designed for performing comprehensive internet-wide scans.
                </p>
            </div>

            {/* Input Panel */}
            <div className="gsap-input glass-panel p-8 border border-white/10 relative overflow-hidden opacity-0">
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">Target Network (CIDR)</label>
                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-mono">CIDR</span>
                        </div>
                        <input
                            type="text"
                            placeholder="192.168.1.0/24"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-16 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all font-mono"
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
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                START SCAN
                            </>
                        )}
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
                    title="ZMap Scan Results"
                    status="completed"
                    output={result}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/30 p-4 rounded border border-white/10">
                                <h4 className="text-xs font-bold text-cyber-secondary uppercase mb-2">Scan Parameters</h4>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-xs">Target:</span>
                                        <span className="text-white text-xs font-mono">{target}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-xs">Port:</span>
                                        <span className="text-white text-xs font-mono">80</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-black/30 p-4 rounded border border-white/10">
                                <h4 className="text-xs font-bold text-cyber-secondary uppercase mb-2">Stats</h4>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-xs">Hosts Found:</span>
                                    <span className="text-cyber-accent text-xs font-mono font-bold">{result.Open_Hosts.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/30 rounded border border-white/10 overflow-hidden">
                            <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                                <h4 className="text-xs font-bold text-gray-300 uppercase">Open Hosts</h4>
                            </div>
                            <div className="divide-y divide-white/5">
                                {result.Open_Hosts.length > 0 ? (
                                    result.Open_Hosts.map((host, i) => (
                                        <div key={i} className="px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                            <span className="text-cyber-primary">●</span>
                                            <span className="text-gray-300 font-mono text-sm">{host}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-gray-500 italic text-sm">No open hosts found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </ResultDisplay>
            )}
        </div>
    );
}

export default Zmap;
