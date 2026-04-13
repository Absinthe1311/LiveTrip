import { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import Navbar from "./Navbar";
import BlurText from "./BlurText";

const VIDEO_URL = "/videos/herovideo2.mp4";

const HeroSection = () => {
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

  // Exposure: reaches peak around the middle, then stays there
  const brightness = useTransform(scrollYProgress, [0, 0.52, 1], [0.7, 1.2, 1.2]);
  // Zoom: settles earlier to shorten the perceived scroll distance
  const scale = useTransform(scrollYProgress, [0, 0.52, 1], [1.0, 1.16, 1.16]);
  // Overlay opacity (deep blue fades out earlier)
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.52, 1], [0.45, 0, 0]);
  // Warm overlay fades in and holds
  const warmOpacity = useTransform(scrollYProgress, [0, 0.26, 0.52, 1], [0, 0.1, 0.3, 0.3]);
  // Content appears around the first quarter and stays visible
  const contentOpacity = useTransform(scrollYProgress, [0, 0.18, 0.32, 1], [0, 0, 1, 1]);
  // Text moves into center, then stays centered
  const textY = useTransform(scrollYProgress, [0, 0.2, 0.38, 1], [80, 80, 0, 0]);
  const textScale = useTransform(scrollYProgress, [0, 0.2, 0.42, 1], [0.92, 0.92, 1, 1]);
  const videoBrightness = useMotionTemplate`brightness(${brightness})`;
  const flashlightBackground = useMotionTemplate`radial-gradient(600px circle at ${mouseX}% ${mouseY}%, hsl(var(--accent-warm) / 0.12), transparent 60%)`;

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
              background: `hsl(var(--foreground))`,
              opacity: overlayOpacity,
            }}
          />
        </motion.div>

        {/* Warm soft-light layer */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `hsl(var(--accent-warm))`,
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
      <Navbar />

      {/* Content overlay */}
      <motion.div
        className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: contentOpacity }}
      >
        <motion.div
          className="text-center"
          style={{ y: textY, scale: textScale }}
        >
          <h1 className="text-8xl lg:text-[10rem] font-heading italic tracking-tighter text-primary-foreground leading-none mb-6">
            <BlurText text="LiveTrip" delay={1.8} />
          </h1>
          <motion.p
            className="font-body font-light text-lg lg:text-xl text-primary-foreground/70 tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.8, ease: "easeOut" }}
          >
            Your journey, reimagined by light and AI.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
