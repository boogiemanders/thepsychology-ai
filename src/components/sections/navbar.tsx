"use client";

import { NavMenu } from "@/components/nav-menu";
import { LOGGED_IN_NAVS } from "@/components/nav-menu";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useScroll } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

const INITIAL_WIDTH = "70rem";
const MAX_WIDTH = "800px";

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const drawerVariants = {
  hidden: { opacity: 0, y: 100 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring" as const,
      damping: 15,
      stiffness: 200,
      staggerChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: 100,
    transition: { duration: 0.1 },
  },
};

const drawerMenuContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerMenuVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function Navbar() {
  const { scrollY } = useScroll();
  const { user, signOut } = useAuth();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [mounted, setMounted] = useState(false);

  // Set mounted flag to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = siteConfig.nav.links.map((item) =>
        item.href.substring(1),
      );

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setHasScrolled(latest > 10);
    });
    return unsubscribe;
  }, [scrollY]);

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const handleOverlayClick = () => setIsDrawerOpen(false);

  const mobileNavItems = user ? LOGGED_IN_NAVS : siteConfig.nav.links;

  const handleStartFree = useCallback(() => {
    setIsDrawerOpen(false); // Close mobile drawer if open

    const pricing = document.getElementById("get-started")
    if (!pricing) return

    // Two-stage scroll (same as mini pricing bar)
    pricing.scrollIntoView({ behavior: "smooth", block: "center" })
    setTimeout(() => {
      pricing.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 220)

    // Dispatch custom event to trigger accordion expansion with 800ms delay
    const event = new CustomEvent("mini-pricing-select", { detail: { tierName: "Pro" } })
    window.dispatchEvent(event)
  }, []);

  return (
    <header
      className={cn(
        "sticky z-50 flex justify-center transition-all duration-300",
        hasScrolled ? "top-2 mx-2 md:top-8 md:mx-0" : "top-2 mx-2 md:top-6 md:mx-0",
      )}
    >
      <motion.div
        initial={{ width: INITIAL_WIDTH }}
        animate={{ width: hasScrolled ? MAX_WIDTH : INITIAL_WIDTH }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-2xl transition-all duration-300  xl:px-0",
            hasScrolled
              ? "px-2 border border-border backdrop-blur-lg bg-background/75"
              : "shadow-none px-3 sm:px-7 border border-border/60 backdrop-blur-lg bg-background/70",
          )}
        >
          <div className="flex h-[60px] sm:h-[64px] items-center justify-between px-4 sm:px-5">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="size-7 md:size-10 invert dark:invert-0"
              />
              <p className="text-lg font-semibold text-primary">thePsychology.ai</p>
            </Link>

            <NavMenu isLoggedIn={!!user} />

            <div className="flex flex-row items-center gap-1 md:gap-3 shrink-0">
              <div className="flex items-center space-x-6">
                {mounted && user ? (
                  <button
                    onClick={async () => {
                      try {
                        await signOut()
                        if (typeof window !== "undefined") {
                          window.location.href = "/"
                        }
                      } catch (err) {
                        console.error('Logout failed:', err)
                      }
                    }}
                    className="border border-foreground/40 h-8 hidden md:flex items-center justify-center text-sm font-normal tracking-wide rounded-sm text-foreground w-fit px-4 hover:bg-foreground/5 hover:border-foreground/60 transition-colors"
                  >
                    Logout
                  </button>
                ) : mounted ? (
                  <button
                    onClick={handleStartFree}
                    className="border border-foreground/40 h-8 hidden md:flex items-center justify-center text-sm font-normal tracking-wide rounded-sm text-foreground w-fit px-4 hover:bg-foreground/5 hover:border-foreground/60 transition-colors cursor-pointer"
                  >
                    Get Started
                  </button>
                ) : null}
              </div>
              <AnimatedThemeToggler />
              <button
                className="md:hidden border border-border size-8 rounded-md cursor-pointer flex items-center justify-center"
                onClick={toggleDrawer}
              >
                {isDrawerOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={overlayVariants}
              transition={{ duration: 0.2 }}
              onClick={handleOverlayClick}
            />

            <motion.div
              className="fixed inset-x-0 w-[95%] mx-auto bottom-3 bg-background border border-border p-4 rounded-xl shadow-lg"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={drawerVariants}
            >
              {/* Mobile menu content */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-3">
                    <Image
                      src="/images/logo.png"
                      alt="Logo"
                      width={40}
                      height={40}
                      className="size-7 md:size-10 invert dark:invert-0"
                    />
                    <p className="text-lg font-semibold text-primary">
                      thePsychology.ai
                    </p>
                  </Link>
                  <button
                    onClick={toggleDrawer}
                    className="border border-border rounded-md p-1 cursor-pointer"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <motion.ul
                  className="flex flex-col text-sm mb-4 border border-border rounded-md"
                  variants={drawerMenuContainerVariants}
                >
                  <AnimatePresence>
                    {mobileNavItems.map((item: any) => (
                      <motion.li
                        key={String(item.id ?? item.href ?? item.name)}
                        className="p-2.5 border-b border-border last:border-b-0"
                        variants={drawerMenuVariants}
                      >
                        <a
                          href={item.href}
                          onClick={(e) => {
                            // Logged-in items are normal routes; let them navigate.
                            if (!item.href?.startsWith("#")) {
                              setIsDrawerOpen(false);
                              return;
                            }

                            e.preventDefault();

                            const targetId = item.href.substring(1);
                            const element = document.getElementById(targetId);

                            // If element doesn't exist on current page, navigate to home page with hash.
                            if (!element) {
                              window.location.href = "/" + item.href;
                              return;
                            }

                            element.scrollIntoView({ behavior: "smooth" });
                            setIsDrawerOpen(false);
                          }}
                          className={`underline-offset-4 hover:text-primary/80 transition-colors ${
                            activeSection === item.href.substring(1)
                              ? "text-primary font-medium"
                              : "text-primary/60"
                          }`}
                        >
                          {item.name}
                        </a>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  {mounted && user ? (
                    <button
                      onClick={async () => {
                        try {
                          await signOut()
                          if (typeof window !== "undefined") {
                            window.location.href = "/"
                          }
                        } catch (err) {
                          console.error('Logout failed:', err)
                        }
                      }}
                      className="bg-secondary h-8 flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-full px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12] hover:bg-secondary/80 transition-all ease-out active:scale-95"
                    >
                      Logout
                    </button>
                  ) : mounted ? (
                    <button
                      onClick={handleStartFree}
                      className="bg-secondary h-8 flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-full px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12] hover:bg-secondary/80 transition-all ease-out active:scale-95 cursor-pointer"
                    >
                      Get Started
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
