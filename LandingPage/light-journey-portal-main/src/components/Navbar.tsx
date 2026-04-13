import { motion } from "framer-motion";

const navLinks = ["Explore", "Plan", "AI Guide", "About"];

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 2.5, ease: "easeOut" }}
      className="fixed top-6 left-0 right-0 z-50 flex items-center justify-center px-6"
    >
      <div className="flex items-center justify-between w-full max-w-5xl">
        {/* Logo */}
        <span className="font-heading italic text-2xl text-primary-foreground tracking-tight select-none">
          LiveTrip
        </span>

        {/* Center pill */}
        <div className="liquid-glass rounded-full px-8 py-3 flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(" ", "-")}`}
              className="text-sm font-body font-light text-primary-foreground/80 hover:text-primary-foreground transition-colors tracking-wide"
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA */}
        <button className="bg-primary-foreground text-primary rounded-full px-6 py-2.5 text-sm font-body font-normal tracking-wide hover:opacity-90 transition-opacity">
          Start Journey
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
