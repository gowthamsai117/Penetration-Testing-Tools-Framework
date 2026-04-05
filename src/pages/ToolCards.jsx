import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function ToolCard({ name, description, icon }) {
  const cardRef = useRef(null);
  const contentRef = useRef(null);

  const { contextSafe } = useGSAP({ scope: cardRef });

  const handleMouseMove = contextSafe((e) => {
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10; // Max rotation deg
    const rotateY = ((x - centerX) / centerX) * 10;

    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      duration: 0.5,
      ease: 'power2.out',
      transformPerspective: 1000,
    });
  });

  const handleMouseLeave = contextSafe(() => {
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
  });

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass-panel p-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-shadow duration-300 group cursor-pointer border border-white/5 hover:border-cyber-primary/50 relative overflow-hidden transform-style-3d will-change-transform"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-150 duration-500 pointer-events-none">
        <span className="text-6xl grayscale group-hover:grayscale-0 transition-all">{icon}</span>
      </div>

      <div ref={contentRef} className="relative z-10 pointer-events-none">
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl bg-black/50 p-3 rounded-lg border border-white/10 group-hover:border-cyber-primary/50 transition-colors shadow-lg group-hover:shadow-cyber-primary/20">
            {icon}
          </span>
          <span className="text-xs font-mono text-gray-500 border border-gray-700 rounded px-2 py-1 group-hover:text-cyber-primary group-hover:border-cyber-primary/30 transition-colors">v1.0</span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyber-primary transition-colors">{name}</h3>
        <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
          {description}
        </p>

        <div className="mt-6 flex items-center text-xs font-mono text-gray-500 group-hover:text-cyber-primary transition-colors">
          <span className="mr-2">INITIALIZE</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </div>
      </div>
    </div>
  );
}

export default ToolCard;