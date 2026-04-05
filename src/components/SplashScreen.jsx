import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function SplashScreen() {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const progressRef = useRef(null);
    const statusRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline();

        // 1. Initial State
        gsap.set(progressRef.current, { scaleX: 0, transformOrigin: 'left center' });

        // 2. Text Reveal (Slide Up + Fade)
        tl.fromTo(textRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
        );

        // 3. Progress Bar Animation with Status Text cycling
        tl.to(progressRef.current, {
            scaleX: 0.4,
            duration: 0.5,
            ease: 'power2.inOut',
            onStart: () => { if (statusRef.current) statusRef.current.innerText = "Initializing Core Systems..."; }
        })
            .to(progressRef.current, {
                scaleX: 0.7,
                duration: 0.6,
                ease: 'power2.inOut',
                onStart: () => { if (statusRef.current) statusRef.current.innerText = "Loading Security Modules..."; }
            })
            .to(progressRef.current, {
                scaleX: 1,
                duration: 0.4,
                ease: 'power2.inOut',
                onStart: () => { if (statusRef.current) statusRef.current.innerText = "System Ready."; }
            });

        // 4. Exit Animation
        tl.to(containerRef.current, {
            opacity: 0,
            scale: 1.1,
            filter: 'blur(10px)',
            duration: 0.5,
            delay: 0.2, // Hold for a moment on completion
            ease: 'power2.in'
        });

    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="fixed inset-0 bg-[#09090b] flex flex-col items-center justify-center z-50 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyber-primary/5 via-transparent to-transparent opacity-50"></div>

            {/* Branding */}
            <div ref={textRef} className="z-10 text-center mb-12">
                <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-2">
                    Pentest<span className="text-cyber-primary">Tools</span>
                </h1>
                <div className="flex items-center justify-center space-x-2 text-gray-400 font-mono text-sm tracking-[0.3em]">
                    <span>ADVANCED</span>
                    <span className="w-1 h-1 bg-cyber-primary rounded-full"></span>
                    <span>SECURITY</span>
                    <span className="w-1 h-1 bg-cyber-primary rounded-full"></span>
                    <span>SUITE</span>
                </div>
            </div>

            {/* Loading Bar Container */}
            <div className="w-64 md:w-80 h-1 bg-white/10 rounded-full overflow-hidden relative z-10">
                {/* Progress Fill */}
                <div
                    ref={progressRef}
                    className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-cyber-primary to-cyber-secondary shadow-[0_0_15px_rgba(255,56,56,0.5)]"
                ></div>
            </div>

            {/* Status Text */}
            <p ref={statusRef} className="mt-4 text-gray-500 font-mono text-xs uppercase tracking-widest min-h-[20px] z-10">
                System Boot...
            </p>
        </div>
    );
}

export default SplashScreen;
