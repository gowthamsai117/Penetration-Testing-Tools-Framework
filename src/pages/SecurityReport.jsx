import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';


function SecurityReport() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedScan, setSelectedScan] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/history`);

            if (response.ok) {
                const data = await response.json();
                // Add unique keys to handle potential ID collisions from backend
                const processedData = data.map((item, index) => ({
                    ...item,
                    _ui_id: `${item.id}_${index}_${Date.now()}`
                }));
                setHistory(processedData);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = async () => {
        if (!window.confirm("Are you sure you want to clear the entire scan history? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/clear_history`, {
                method: 'POST',
            });

            if (response.ok) {
                setHistory([]);
                setSelectedScan(null);
            } else {
                alert("Failed to clear history.");
            }
        } catch (error) {
            console.error("Failed to clear history:", error);
            alert("Error clearing history.");
        }
    };

    const handleDeleteScan = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this scan entry?")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/delete_history_item/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setHistory(prev => prev.filter(item => item.id !== id));
                if (selectedScan?.id === id) {
                    setSelectedScan(null);
                }
            } else {
                alert("Failed to delete scan.");
            }
        } catch (error) {
            console.error("Failed to delete scan:", error);
            alert("Error deleting scan.");
        }
    };


    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-green-400';
            case 'failed': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-secondary filter drop-shadow-[0_0_10px_rgba(0,243,255,0.3)]">
                        Security Audit Report
                    </h1>
                    <p className="text-gray-400 mt-2">Comprehensive scan history and execution logs.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={clearHistory}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-95 flex items-center gap-2 border border-red-500/20 hover:border-red-500/50"
                        title="Clear History"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline font-bold text-sm">CLEAR HISTORY</span>
                    </button>
                    <button
                        onClick={fetchHistory}
                        className="p-2 rounded-lg bg-cyber-primary/10 text-cyber-primary hover:bg-cyber-primary/20 transition-all active:scale-95 border border-cyber-primary/20 hover:border-cyber-primary/50"
                        title="Refresh History"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* History List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-panel p-4 rounded-xl border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-cyber-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Recent Scans
                        </h2>

                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading history...</div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No scans recorded yet.</div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {history.map((scan) => (
                                    <div
                                        key={scan._ui_id}
                                        onClick={() => setSelectedScan(scan)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border relative group ${selectedScan?._ui_id === scan._ui_id
                                            ? 'bg-cyber-primary/10 border-cyber-primary/50 shadow-[0_0_10px_rgba(0,243,255,0.1)]'
                                            : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                                            }`}
                                    >
                                        <button
                                            onClick={(e) => handleDeleteScan(e, scan.id)}
                                            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all z-10"
                                            title="Delete Scan"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                        <div className="flex justify-between items-start mb-1 pr-6">
                                            <span className="font-bold text-white">{scan.tool}</span>
                                            <span className="text-xs text-gray-500">{scan.timestamp}</span>
                                        </div>
                                        <div className="text-sm text-gray-400 truncate mb-1">
                                            Target: <span className="text-cyber-secondary">{scan.target}</span>
                                        </div>
                                        <div className={`text-xs ${getStatusColor(scan.status)}`}>
                                            {scan.summary || 'No summary available'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Scan Details */}
                <div className="lg:col-span-2">
                    <div className="glass-panel p-6 rounded-xl border border-white/10 h-full min-h-[500px]">
                        {selectedScan ? (
                            <div className="h-full flex flex-col">
                                <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/10">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">{selectedScan.tool} Scan Report</h2>
                                        <div className="flex gap-4 text-sm text-gray-400">
                                            <span>Target: <span className="text-cyber-secondary">{selectedScan.target}</span></span>
                                            <span>ID: #{selectedScan.id}</span>
                                            <span>Time: {selectedScan.timestamp}</span>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedScan.status === 'Completed'
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        {selectedScan.status}
                                    </div>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!window.confirm("Delete this scan report?")) return;
                                            try {
                                                const res = await fetch(`${API_BASE_URL}/delete_history_item/${selectedScan.id}`, { method: 'DELETE' });
                                                if (res.ok) {
                                                    setHistory(prev => prev.filter(item => item.id !== selectedScan.id));
                                                    setSelectedScan(null);
                                                } else {
                                                    alert("Failed to delete item");
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                alert("Error deleting item");
                                            }
                                        }}
                                        className="ml-4 p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                                        title="Delete Report"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>

                                <div className="flex-1 bg-black/80 rounded-lg border border-white/10 p-4 font-mono text-sm overflow-auto custom-scrollbar shadow-inner">
                                    {/* Summary Section */}
                                    <div className="mb-4 text-gray-300">
                                        <span className="text-cyber-primary">➜</span> <span className="font-bold">Summary:</span> {selectedScan.summary}
                                    </div>

                                    {/* Detailed Output */}
                                    {selectedScan.output && (
                                        <div className="whitespace-pre-wrap text-gray-400">
                                            {typeof selectedScan.output === 'object'
                                                ? JSON.stringify(selectedScan.output, null, 2)
                                                : selectedScan.output}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <p>Select a scan from the history to view full report</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SecurityReport;
