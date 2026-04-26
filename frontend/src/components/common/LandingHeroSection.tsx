// LandingPage HeroSection - 视频背景 + 滚动视差效果
import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import BlurText from "./BlurText";

const VIDEO_URL = "/videos/herovideo2.mp4";

const LandingHeroSection = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const loopGuardRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Exposure: 优化亮度变化，在滚动到一半时达到最大值并保持，避免过亮
  const brightness = useTransform(scrollYProgress, [0, 0.35, 0.5, 1], [0.7, 1.0, 1.0, 1.0]);
  // Zoom: 在一半时达到最大缩放并保持
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.5, 1], [1.0, 1.12, 1.12, 1.12]);
  // Overlay opacity: 在一半时完全消失
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.35, 0.5, 1], [0.45, 0, 0, 0]);
  // Warm overlay: 在一半时达到最大值并保持
  const warmOpacity = useTransform(scrollYProgress, [0, 0.2, 0.35, 0.5, 1], [0, 0.1, 0.2, 0.2, 0.2]);
  // Content appears: 更早显示内容
  const contentOpacity = useTransform(scrollYProgress, [0, 0.15, 0.25, 1], [0, 0, 1, 1]);
  // Text moves: 调整Logo位置，让它在滚动到底部时到达理想位置（屏幕中心偏上）
  const textY = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [120, 120, 20, 20]);
  const textScale = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0.92, 0.92, 1, 1]);
  
  const videoBrightness = useMotionTemplate`brightness(${brightness})`;
  const flashlightBackground = useMotionTemplate`radial-gradient(600px circle at ${mouseX}% ${mouseY}%, rgba(251, 191, 36, 0.12), transparent 60%)`;

  const setLiquidFrequency = useCallback((value: string) => {
    turbRef.current?.setAttribute("baseFrequency", value);
  }, []);

  // Liquid distortion on scroll, but much more subtle to avoid heavy warping
  useMotionValueEvent(scrollYProgress, "change", () => {
    setLiquidFrequency("0.004 0.006");
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setLiquidFrequency("0 0"), 110);
  });

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Mouse tracking for light effect
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseX.set((e.clientX / window.innerWidth) * 100);
    mouseY.set((e.clientY / window.innerHeight) * 100);
  }, [mouseX, mouseY]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Video loop handling
  const restartVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    loopGuardRef.current = true;
    video.currentTime = 0.04;
    void video.play().catch(() => undefined);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video?.duration) return;

    const remaining = video.duration - video.currentTime;

    if (remaining < 0.12 && !loopGuardRef.current) {
      restartVideo();
      return;
    }

    if (remaining >= 0.12) {
      loopGuardRef.current = false;
    }
  }, [restartVideo]);

  const handleCanPlay = useCallback(() => {
    setLoaded(true);
    void videoRef.current?.play().catch(() => undefined);
  }, []);

  return (
    <div ref={containerRef} className="relative" style={{ height: "220vh" }}>
      {/* SVG Filter for liquid distortion */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="liquid">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0 0"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Fixed viewport */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Video layer */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{
            scale: loaded ? scale : 1,
            filter: `url(#liquid)`,
            transformOrigin: "50% 55%",
          }}
          initial={{ scale: 1.15 }}
          animate={{ scale: loaded ? 1 : 1.15 }}
          transition={{ duration: 3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.video
            ref={videoRef}
            className="w-full h-full object-cover will-change-transform"
            style={{ filter: videoBrightness }}
            src={VIDEO_URL}
            autoPlay
            muted
            playsInline
            preload="auto"
            onCanPlay={handleCanPlay}
            onTimeUpdate={handleTimeUpdate}
            onEnded={restartVideo}
          />
        </motion.div>

        {/* Brightness layer */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: "transparent",
            mixBlendMode: "multiply",
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: `hsl(213, 45%, 10%)`,
              opacity: overlayOpacity,
            }}
          />
        </motion.div>

        {/* Warm soft-light layer */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `hsl(35, 100%, 70%)`,
            mixBlendMode: "soft-light",
            opacity: warmOpacity,
          }}
        />

        {/* Mouse flashlight effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: flashlightBackground,
            mixBlendMode: "soft-light",
          }}
        />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 2.5, ease: "easeOut" }}
        className="fixed top-6 left-0 right-0 z-50 flex items-center justify-between px-6"
      >
        {/* Logo */}
        <div className="flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
          <img
            src="/logo.png"
            alt="LiveTrip Logo"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* CTA */}
        <button 
          onClick={() => navigate('/auth')}
          className="bg-white text-gray-900 rounded-full px-6 py-2.5 text-sm font-sans font-normal tracking-wide hover:opacity-90 transition-opacity"
        >
          开始旅程
        </button>
      </motion.nav>

      {/* Content overlay */}
      <motion.div
        className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: contentOpacity }}
      >
        <motion.div
          className="text-center"
          style={{ y: textY, scale: textScale }}
        >
          {/* Logo 替代文字 */}
          <motion.div
            className="mt-16 mb-6 flex items-center justify-center"
            initial={{ opacity: 0, filter: "blur(12px)", scale: 0.8, y: 30 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
            transition={{
              duration: 1.2,
              delay: 1.8,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <img
              src="/logo.png"
              alt="LiveTrip"
              className="h-24 lg:h-36 w-auto object-contain"
            />
          </motion.div>
          <motion.p
            className="font-sans font-light text-lg lg:text-xl text-white/70 tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.8, ease: "easeOut" }}
          >
            Live to see, Live to go.
          </motion.p>
          
          {/* CTA 按钮 */}
          <motion.div
            className="mt-10 flex items-center justify-center pointer-events-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 3.2, ease: "easeOut" }}
          >
            <button
              onClick={() => navigate('/auth')}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              立即开始
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingHeroSection;
