import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { useGSAP } from '@gsap/react';

// Register Plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Helper for splitting text into characters
const SplitText = ({ children, className }) => {
    return (
        <span className={`inline-block ${className}`}>
            {children.split('').map((char, i) => (
                <span key={i} className="inline-block split-char opacity-0">
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </span>
    );
};

function Introduction({ onStart }) {
    const containerRef = useRef(null);
    const cursorRef = useRef(null);
    const heroRef = useRef(null);
    const mottoRef = useRef(null);

    // Force scroll to top on mount to prevent starting at "Analyze"
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Custom Cursor
    useGSAP(() => {
        const cursor = cursorRef.current;

        // Move cursor
        const xTo = gsap.quickTo(cursor, "x", { duration: 0.1, ease: "power3" });
        const yTo = gsap.quickTo(cursor, "y", { duration: 0.1, ease: "power3" });

        const moveCursor = (e) => {
            xTo(e.clientX);
            yTo(e.clientY);
        };

        window.addEventListener('mousemove', moveCursor);

        // Hover effects
        const hoverables = document.querySelectorAll('button, a, .feature-card');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => gsap.to(cursor, { scale: 3, opacity: 0.5, duration: 0.3 }));
            el.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3 }));
        });

        return () => window.removeEventListener('mousemove', moveCursor);
    }, { scope: containerRef });



    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // ------------------------------------------------------------------
        // 1. HERO ANIMATION
        // ------------------------------------------------------------------
        // Staggered char reveal for Hero Title
        tl.to('.hero-title .split-char', {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            stagger: 0.02,
            duration: 1,
            ease: "back.out(1.2)"
        })
            .to('.hero-subtitle', { y: 0, opacity: 1, duration: 0.8 }, "-=0.5")
            .to('.hero-desc', { y: 0, opacity: 1, duration: 0.8 }, "-=0.6")
            .fromTo('.magnetic-btn', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 }, "-=0.4");

        // Parallax Orbs
        gsap.to('.orb-1', {
            y: -100,
            scrollTrigger: { trigger: heroRef.current, start: 'top top', scrub: 0.5 }
        });
        gsap.to('.orb-2', {
            y: 50,
            scrollTrigger: { trigger: heroRef.current, start: 'top top', scrub: 0.7 }
        });


        // ------------------------------------------------------------------
        // 2. SYSTEM STATUS (TextPlugin)
        // ------------------------------------------------------------------
        gsap.to('.system-status-text', {
            text: { value: "SYSTEM ONLINE // MONITORING ACTIVE", delimiter: "" },
            duration: 2,
            ease: "none",
            delay: 1
        });

        gsap.to('.status-pulse', {
            scale: 1.5,
            opacity: 0,
            repeat: -1,
            duration: 1.5
        });


        // ------------------------------------------------------------------
        // 3. MOTTO SECTION (Cinematic Scroll)
        // ------------------------------------------------------------------
        const mottoTl = gsap.timeline({
            scrollTrigger: {
                trigger: mottoRef.current,
                start: 'top top',
                end: '+=2500',
                pin: true,
                scrub: 1,
            }
        });

        // SECURE
        mottoTl.fromTo('.motto-1 .split-char',
            { opacity: 0, z: -500, scale: 0 },
            { opacity: 1, z: 0, scale: 1, stagger: 0.1, duration: 1 }
        )
            .to('.motto-1', { opacity: 0, filter: 'blur(10px)', scale: 1.5, duration: 0.5 }); // Fade out

        // ANALYZE
        mottoTl.fromTo('.motto-2 .split-char',
            { opacity: 0, y: 100, rotateX: 90 },
            { opacity: 1, y: 0, rotateX: 0, stagger: 0.1, duration: 1 }
        )
            .to('.motto-2', { opacity: 0, filter: 'blur(10px)', scale: 0.8, duration: 0.5 });

        // FORTIFY (Float & Glow)
        mottoTl.fromTo('.motto-3 .split-char',
            { opacity: 0, scale: 3, filter: 'blur(20px)' },
            { opacity: 1, scale: 1, filter: 'blur(0px)', stagger: 0.1, color: '#00f3ff', duration: 1 }
        )
            .to('.motto-3', { y: -20, duration: 0.5, yoyo: true, repeat: 1 });


        // ------------------------------------------------------------------
        // 4. FEATURES (Tilt & Scroll Reveal)
        // ------------------------------------------------------------------
        const cards = gsap.utils.toArray('.feature-card');
        cards.forEach(card => {
            // Scroll Reveal
            gsap.fromTo(card,
                { y: 100, opacity: 0, rotateX: -15 },
                {
                    y: 0, opacity: 1, rotateX: 0,
                    duration: 0.8,
                    scrollTrigger: { trigger: card, start: "top 85%" }
                }
            );

            // Magnetic Tilt Effect
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg
                const rotateY = ((x - centerX) / centerX) * 10;

                gsap.to(card, {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.4,
                    ease: "power2.out",
                    transformPerspective: 1000
                });

                // Inner Glow
                gsap.to(card.querySelector('.inner-glow'), {
                    left: x,
                    top: y,
                    opacity: 0.6,
                    duration: 0.4
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
                gsap.to(card.querySelector('.inner-glow'), { opacity: 0 });
            });
        });

    }, { scope: containerRef });

    // Magnetic Button Helper
    const handleBtnMove = (e) => {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3 });
    };
    const handleBtnLeave = (e) => {
        gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    };

    return (
        <div ref={containerRef} className="bg-[#050505] text-white overflow-x-hidden w-full relative cursor-none font-sans">

            {/* Custom Cursor */}
            <div ref={cursorRef} className="fixed w-6 h-6 border-2 border-cyber-primary rounded-full pointer-events-none z-[9999] mix-blend-difference top-0 left-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>

            {/* ------------------------------------------------------------------
          HERO SECTION
         ------------------------------------------------------------------ */}
            <section ref={heroRef} className="min-h-screen flex flex-col items-center justify-center relative px-6 pt-20">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="orb-1 absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyber-primary/10 rounded-full blur-[120px]"></div>
                    <div className="orb-2 absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyber-secondary/10 rounded-full blur-[100px]"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                </div>

                {/* System Status Chip */}
                <div className="z-10 mb-8 inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                    <span className="relative flex h-3 w-3">
                        <span className="status-pulse animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="system-status-text font-mono text-xs text-green-400 tracking-wider min-w-[200px]">
                        INITIALIZING...
                    </span>
                </div>

                <h1 className="hero-title text-center text-7xl md:text-9xl font-black tracking-tighter mb-6 leading-[0.9]">
                    <div className="overflow-hidden"><SplitText>COMMAND.</SplitText></div>
                    <div className="overflow-hidden text-gray-500"><SplitText>SCAN.</SplitText></div>
                    <div className="overflow-hidden text-cyber-primary"><SplitText>SECURE.</SplitText></div>
                </h1>

                <p className="hero-subtitle text-xl text-gray-400 mb-8 max-w-2xl text-center opacity-0 translate-y-10">
                    Pentesting Framework Tools is a centralized security assessment platform that brings industry-standard pentesting tools under one intelligent interface.
                </p>

                <div className="hero-desc text-center opacity-0 translate-y-10 mb-12">
                    <p className="text-gray-500 text-sm mb-6">Execute scans, monitor activity, and analyze results — all from a single command center.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onMouseMove={handleBtnMove} onMouseLeave={handleBtnLeave}
                            onClick={(e) => {
                                console.log("Intro: LAUNCH DASHBOARD clicked");
                                if (onStart) onStart();
                            }}
                            className="magnetic-btn relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden group cursor-pointer z-50 pointer-events-auto"
                        >
                            <span className="relative z-10">LAUNCH DASHBOARD</span>
                            <div className="absolute inset-0 bg-cyber-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        </button>

                        <button
                            onMouseMove={handleBtnMove} onMouseLeave={handleBtnLeave}
                            className="magnetic-btn px-8 py-4 border border-white/20 rounded-full hover:bg-white/5 transition-colors"
                        >
                            VIEW TOOLS
                        </button>
                    </div>
                </div>
            </section>


            {/* ------------------------------------------------------------------
          MOTTO SECTION (Pinned)
         ------------------------------------------------------------------ */}
            <section ref={mottoRef} className="h-screen bg-black flex items-center justify-center overflow-hidden relative border-y border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black"></div>

                <div className="motto-container text-[12vw] font-black leading-none tracking-tighter text-center relative w-full pointer-events-none select-none">
                    <div className="motto-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white whitespace-nowrap">
                        <SplitText>SECURE</SplitText>
                    </div>
                    <div className="motto-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white whitespace-nowrap">
                        <SplitText>ANALYZE</SplitText>
                    </div>
                    <div className="motto-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-secondary filter drop-shadow-[0_0_20px_rgba(0,243,255,0.5)] whitespace-nowrap">
                        <SplitText>FORTIFY</SplitText>
                    </div>
                </div>
            </section>


            {/* ------------------------------------------------------------------
          WHY THIS FRAMEWORK
         ------------------------------------------------------------------ */}
            <section className="py-32 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <h2 className="text-4xl font-bold mb-6">Unified Security. <span className="text-gray-500">Centralized Control.</span></h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Modern penetration testing involves multiple tools and complex workflows. This framework unifies execution, logging, and analysis into one professional workspace.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: "⚡", title: "Centralized Execution", desc: "Run Nmap, Shodan, and more from one UI." },
                        { icon: "📡", title: "Real-time Monitoring", desc: "Watch live scan outputs and logs." },
                        { icon: "📂", title: "Structured Management", desc: "Categorized tools for efficient workflow." },
                        { icon: "🛡️", title: "Professional Interface", desc: "Designed for researchers and ethical hackers." }
                    ].map((item, i) => (
                        <div key={i} className="feature-card p-8 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                            <div className="inner-glow absolute w-40 h-40 bg-cyber-primary/20 blur-[50px] rounded-full pointer-events-none opacity-0"></div>
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{item.icon}</div>
                            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                            <p className="text-gray-500 text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>


            {/* ------------------------------------------------------------------
          CORE MODULES
         ------------------------------------------------------------------ */}
            <section className="py-24 px-6 bg-white/5 border-y border-white/5 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-16 mb-24 items-center">
                        <div className="flex-1">
                            <span className="text-cyber-primary font-mono text-xs uppercase tracking-widest mb-2 block">MODULE 01</span>
                            <h3 className="text-5xl font-bold mb-6">Reconnaissance</h3>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Discover and map the attack surface using automated OSINT and DNS enumeration tools. Identify assets before the first packet is sent.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['Dig', 'Dnsenum', 'Sublist3r', 'theHarvester', 'Shodan', 'Recon-ng'].map(t => (
                                    <span key={t} className="px-3 py-1 bg-black/50 border border-white/10 rounded text-sm text-gray-300">{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 feature-card bg-black/40 p-12 rounded-3xl border border-white/10 relative group">
                            <div className="inner-glow absolute w-60 h-60 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none opacity-0"></div>
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-100 animate-shimmer"></div>
                            <div className="text-8xl text-center">🔍</div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row-reverse gap-16 mb-24 items-center">
                        <div className="flex-1">
                            <span className="text-cyber-secondary font-mono text-xs uppercase tracking-widest mb-2 block">MODULE 02</span>
                            <h3 className="text-5xl font-bold mb-6">Web Scanning</h3>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Identify technologies, frameworks, CMS platforms, and security defenses. Detect vulnerabilities in web applications with precision.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['WhatWeb', 'Wappalyzer', 'WPScan', 'Wafw00f'].map(t => (
                                    <span key={t} className="px-3 py-1 bg-black/50 border border-white/10 rounded text-sm text-gray-300">{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 feature-card bg-black/40 p-12 rounded-3xl border border-white/10 relative group">
                            <div className="inner-glow absolute w-60 h-60 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none opacity-0"></div>
                            <div className="text-8xl text-center">🌐</div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="flex-1">
                            <span className="text-cyber-accent font-mono text-xs uppercase tracking-widest mb-2 block">MODULE 03</span>
                            <h3 className="text-5xl font-bold mb-6">Network Scanning</h3>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Analyze network exposure, open ports, and routing paths efficiently. Map the infrastructure layout.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['Nmap', 'Traceroute', 'Zmap'].map(t => (
                                    <span key={t} className="px-3 py-1 bg-black/50 border border-white/10 rounded text-sm text-gray-300">{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 feature-card bg-black/40 p-12 rounded-3xl border border-white/10 relative group">
                            <div className="inner-glow absolute w-60 h-60 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none opacity-0"></div>
                            <div className="text-8xl text-center">🌍</div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ------------------------------------------------------------------
          COMMAND CENTER
         ------------------------------------------------------------------ */}
            <section className="py-24 px-6 text-center max-w-5xl mx-auto">
                <h2 className="text-4xl font-bold mb-8">Command Center Dashboard</h2>
                <p className="text-xl text-gray-400 mb-12">
                    A real-time command center designed for clarity and control. Monitor live system status, active tools, and mission logs from one unified interface.
                </p>

                <div className="feature-card relative rounded-xl overflow-hidden border border-white/20 shadow-2xl group">
                    {/* Abstract Dashboard Representation */}
                    <div className="aspect-video bg-[#0a0a0a] relative p-8 flex flex-col gap-4">
                        <div className="h-8 bg-white/5 rounded w-full flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex-1 flex gap-4">
                            <div className="w-1/4 bg-white/5 rounded animate-pulse"></div>
                            <div className="flex-1 bg-white/5 rounded grid grid-cols-2 gap-4 p-4">
                                <div className="bg-black/30 rounded"></div>
                                <div className="bg-black/30 rounded"></div>
                                <div className="col-span-2 bg-black/30 rounded mt-auto h-32"></div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onStart} className="px-8 py-3 bg-cyber-primary text-black font-bold rounded-full transform scale-90 group-hover:scale-100 transition-transform cursor-pointer relative z-20">
                            ENTER CONSOLE
                        </button>
                    </div>
                </div>
            </section>


            {/* ------------------------------------------------------------------
          HOW IT WORKS & TECH STACK
         ------------------------------------------------------------------ */}
            <section className="py-24 px-6 bg-gradient-to-b from-[#050505] to-black">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div>
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-cyber-primary text-black flex items-center justify-center text-sm font-bold">1</span>
                            Workflow
                        </h3>
                        <ul className="space-y-6 border-l border-white/10 ml-4 pl-8">
                            {[
                                "User selects a tool from the dashboard",
                                "Target input is validated by the backend",
                                "Tool executes securely in the environment",
                                "Results are parsed and logged",
                                "Output is visualized in real time"
                            ].map((step, i) => (
                                <li key={i} className="text-gray-400 relative">
                                    <span className="absolute -left-[39px] top-1 w-4 h-4 rounded-full bg-[#111] border border-white/20"></span>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-cyber-secondary text-black flex items-center justify-center text-sm font-bold">2</span>
                            Tech Stack
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-white mb-2">Frontend</h4>
                                <p className="text-gray-400 text-sm">React.js • Tailwind CSS • GSAP Animations</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2">Backend</h4>
                                <p className="text-gray-400 text-sm">Python (Flask) • Dockerized Environment</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2">System</h4>
                                <p className="text-gray-400 text-sm">Kali Linux Tools Integration</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ------------------------------------------------------------------
          ETHICAL & FOOTER
         ------------------------------------------------------------------ */}
            <section className="pt-24 pb-12 px-6 text-center border-t border-white/5">
                <div className="max-w-3xl mx-auto mb-20 p-8 bg-red-900/10 border border-red-500/20 rounded-2xl">
                    <h3 className="text-red-400 font-bold mb-4 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Ethical & Educational Focus
                    </h3>
                    <p className="text-gray-400 text-sm">
                        This framework is designed strictly for authorized penetration testing, educational, and research purposes.
                        Unauthorized usage is strictly discouraged.
                    </p>
                </div>

                <div className="mb-12">
                    <h2 className="text-6xl md:text-8xl font-black text-white/5 mb-4">EXECUTE</h2>
                    <h3 className="text-2xl font-bold mb-4">Explore. Analyze. Secure.</h3>
                    <p className="text-gray-500 mb-8">Experience a smarter way to perform penetration testing.</p>

                    <button
                        onMouseMove={handleBtnMove} onMouseLeave={handleBtnLeave}
                        onClick={(e) => {
                            console.log("Intro: OPEN DASHBOARD clicked");
                            if (onStart) onStart();
                        }}
                        className="magnetic-btn px-10 py-4 bg-cyber-primary text-black font-bold rounded-full hover:shadow-[0_0_50px_rgba(0,243,255,0.4)] transition-shadow cursor-pointer relative z-50 pointer-events-auto"
                    >
                        OPEN DASHBOARD
                    </button>
                </div>

                <footer className="text-xs text-gray-700 font-mono">
                    PENTEST FRAMEWORK v2.0 • SYSTEM SECURE
                </footer>
            </section>

        </div>
    );
}

export default Introduction;
