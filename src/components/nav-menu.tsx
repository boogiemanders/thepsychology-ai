"use client";

import { siteConfig } from "@/lib/config";
import { motion } from "motion/react";
import React, { useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
}

const navs: NavItem[] = siteConfig.nav.links;

const loggedInNavs: NavItem[] = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Practice", href: "/exam-generator" },
  { name: "Prioritize", href: "/prioritizer" },
  { name: "Study", href: "/topic-selector" },
];

export function NavMenu({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  const [left, setLeft] = useState(0);
  const [width, setWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [isManualScroll, setIsManualScroll] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Prevent hydration mismatch by only showing logged-in state after mount
  const currentNavs = mounted && isLoggedIn ? loggedInNavs : navs;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    // Initialize with active nav item based on current path or first item
    let activeSelector: string;

    if (mounted && isLoggedIn) {
      // Find the nav item that matches current pathname
      const activeNav = currentNavs.find(nav => nav.href === pathname);
      activeSelector = activeNav ? `[href="${activeNav.href}"]` : `[href="${currentNavs[0].href}"]`;
    } else {
      activeSelector = `[href="#${currentNavs[0].href.substring(1)}"]`;
    }

    const activeItem = ref.current?.querySelector(activeSelector)?.parentElement;
    if (activeItem) {
      const rect = activeItem.getBoundingClientRect();
      setLeft(activeItem.offsetLeft);
      setWidth(rect.width);
      setIsReady(true);
    }
  }, [mounted, isLoggedIn, currentNavs, pathname]);

  React.useEffect(() => {
    // Skip scroll handling for logged in users (they're on tools page)
    if (isLoggedIn) return;

    const handleScroll = () => {
      // Skip scroll handling during manual click scrolling
      if (isManualScroll) return;

      const sections = currentNavs.map((item) => item.href.substring(1));

      // Find the section closest to viewport top
      let closestSection = sections[0];
      let minDistance = Infinity;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top - 100); // Offset by 100px to trigger earlier
          if (distance < minDistance) {
            minDistance = distance;
            closestSection = section;
          }
        }
      }

      // Update active section and nav indicator
      setActiveSection(closestSection);
      const navItem = ref.current?.querySelector(
        `[href="#${closestSection}"]`,
      )?.parentElement;
      if (navItem) {
        const rect = navItem.getBoundingClientRect();
        setLeft(navItem.offsetLeft);
        setWidth(rect.width);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isManualScroll, isLoggedIn, currentNavs]);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem,
  ) => {
    // For logged in users, just let the link navigate normally
    if (isLoggedIn) {
      return;
    }

    // If href doesn't start with #, let it navigate normally (e.g., /portfolio)
    if (!item.href.startsWith("#")) {
      return;
    }

    e.preventDefault();

    const targetId = item.href.substring(1);
    const element = document.getElementById(targetId);

    // If element doesn't exist on current page, navigate to home page with hash
    if (!element) {
      window.location.href = "/" + item.href;
      return;
    }

    if (element) {
      // Set manual scroll flag
      setIsManualScroll(true);

      // Immediately update nav state
      setActiveSection(targetId);
      const navItem = e.currentTarget.parentElement;
      if (navItem) {
        const rect = navItem.getBoundingClientRect();
        setLeft(navItem.offsetLeft);
        setWidth(rect.width);
      }

      // Calculate exact scroll position
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset

      // Smooth scroll to exact position
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Reset manual scroll flag after animation completes
      setTimeout(() => {
        setIsManualScroll(false);
      }, 500); // Adjust timing to match scroll animation duration
    }
  };

  return (
    <div className="w-full hidden md:block">
      <ul
        className="relative mx-auto flex w-fit rounded-full h-11 px-2 items-center justify-center"
        ref={ref}
      >
        {currentNavs.map((item) => {
          const isActive = mounted && isLoggedIn
            ? pathname === item.href
            : activeSection === item.href.substring(1);

          return (
            <li
              key={item.name}
              className={`z-10 cursor-pointer h-full flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-primary/60 hover:text-primary"
              } tracking-tight`}
            >
              <a href={item.href} onClick={(e) => handleClick(e, item)}>
                {item.name}
              </a>
            </li>
          );
        })}
        {isReady && (
          <motion.li
            animate={{ left, width }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute inset-0 my-1.5 rounded-full bg-accent/60 border border-border"
          />
        )}
      </ul>
    </div>
  );
}
