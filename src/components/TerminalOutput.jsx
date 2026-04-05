import { useState } from 'react';

function TerminalOutput({ output, title = "Scan Output" }) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!output) return null;

    return (
        <div className="glass-panel p-0 overflow-hidden shadow-neon-blue/20 mt-6">
            <div
                className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="text-sm font-mono text-cyber-primary uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {title}
                </h3>
                <span className="text-gray-400 transform transition-transform duration-200">
                    {isExpanded ? "▼" : "▶"}
                </span>
            </div>

            {isExpanded && (
                <div className="p-4 bg-black/80 font-mono text-sm text-gray-300 overflow-x-auto">
                    <pre className="whitespace-pre-wrap leading-relaxed">{output}</pre>
                </div>
            )}
        </div>
    );
}

export default TerminalOutput;
