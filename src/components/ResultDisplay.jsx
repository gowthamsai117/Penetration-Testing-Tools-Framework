import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function ResultDisplay({ title, status, duration, output, type = 'text', children }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const containerRef = useRef(null);

    useGSAP(() => {
        gsap.fromTo(containerRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
        );
    }, { scope: containerRef });

    const handleCopy = () => {
        let textToCopy = '';
        if (typeof output === 'string') {
            textToCopy = output;
        } else if (typeof output === 'object') {
            textToCopy = JSON.stringify(output, null, 2);
        }

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExport = () => {
        const element = document.createElement("a");
        const file = new Blob([typeof output === 'object' ? JSON.stringify(output, null, 2) : output], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${title.toLowerCase().replace(/\s+/g, '_')}_result_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div ref={containerRef} className="group opacity-0">
            {/* Header */}
            <div className="glass-panel p-0 overflow-hidden border border-white/10 hover:border-cyber-primary/30 transition-all duration-300">
                <div className="bg-white/5 border-b border-white/10 p-4 flex justify-between items-center bg-gradient-to-r from-transparent via-transparent to-cyber-primary/5">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${status === 'completed' ? 'text-green-400 bg-green-400' :
                            status === 'failed' ? 'text-red-400 bg-red-400' : 'text-cyber-primary bg-cyber-primary'
                            }`} />
                        <h3 className="font-mono font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                            {title}
                            <span className="text-xs text-gray-500 font-normal normal-case opacity-0 group-hover:opacity-100 transition-opacity">
                // {new Date().toLocaleTimeString()}
                            </span>
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Copy to Clipboard"
                        >
                            {copied ? (
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={handleExport}
                            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Export Result"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {expanded && (
                    <div className="bg-black/40 backdrop-blur-sm relative font-mono text-sm group-hover:bg-black/30 transition-colors">
                        {/* Decorative Grid Background */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

                        <div className="p-4 overflow-x-auto custom-scrollbar max-h-[600px]">
                            {children ? children : (
                                <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {typeof output === 'object' ? JSON.stringify(output, null, 2) : output}
                                </pre>
                            )}
                        </div>

                        {/* Footer Status Line */}
                        <div className="px-4 py-2 border-t border-white/5 bg-white/5 text-xs text-gray-500 font-mono flex justify-between">
                            <span>EXECUTION_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                            <span className="text-cyber-primary">{status === 'completed' ? 'SUCCESS' : 'FAILED'}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResultDisplay;
