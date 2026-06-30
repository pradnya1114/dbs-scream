import { motion } from "motion/react";

interface RocketProps {
  heightPercent: number; // 0 to 100
  isLaunching: boolean;
}

export const Rocket = ({ heightPercent, isLaunching }: RocketProps) => {
  return (
    <div className="relative w-full h-[80vh] flex flex-col items-center justify-end overflow-visible">
      {/* Launch Pad */}
      <div className="absolute bottom-0 w-64 h-8 bg-gray-800 rounded-t-lg z-0" />
      
      {/* Rocket Container */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ y: 0 }}
        animate={{
          y: `${-(heightPercent * 0.7)}vh`, // Max 70vh up
        }}
        transition={{ 
          type: "spring", 
          stiffness: 250, 
          damping: 35,
          mass: 0.8
        }}
      >
        {/* Rocket Body */}
        <div className="w-24 h-48 relative">
          <img 
            src="./rocket.png" 
            alt="Rocket" 
            className="w-full h-full object-contain grayscale invert brightness-150 contrast-150 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          />
        </div>

        {/* Flames & Smoke */}
        {isLaunching && heightPercent > 5 && (
          <div className="absolute top-full flex flex-col items-center">
            {/* Flames */}
            <motion.div
              className="w-12 h-24 bg-gradient-to-b from-red-600 via-orange-500 to-red-400 rounded-b-full blur-sm"
              animate={{
                scaleY: [1, 1.8, 1],
                opacity: [0.9, 1, 0.9],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.08,
              }}
            />
            {/* Particles (Smoke) */}
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-12 h-12 bg-red-500/20 rounded-full blur-md"
                  animate={{
                    y: [0, 120],
                    x: [0, (i - 2) * 25],
                    scale: [1, 2.5],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.4,
                    delay: i * 0.08,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Altitude Indicators */}
      <div className="absolute left-8 h-full flex flex-col justify-between py-10 pointer-events-none font-mono text-xs">
        <div className="text-white font-bold bg-cyan-600/60 px-3 py-1 rounded-full backdrop-blur-sm shadow-lg">SPACE (90+ dB)</div>
        <div className="text-cyan-300 font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-cyan-500/20">CLOUDS (70 dB)</div>
        <div className="text-white/90 font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">ATMOSPHERE (50 dB)</div>
        <div className="text-orange-400 font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-orange-500/20">LIFT OFF (30 dB)</div>
        <div className="text-white/60 font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">GROUND (0 dB)</div>
      </div>
    </div>
  );
};
