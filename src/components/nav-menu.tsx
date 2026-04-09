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

export const LOGGED_IN_NAVS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Practice", href: "/exam-generator" },
  { name: "Prioritize", href: "/prioritize" },
  { name: "Study", href: "/topic-selector" },
];

const labNavs: NavItem[] = siteConfig.nav.labLinks;

function getHashTarget(href: string): string | null {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return null;

  const hash = href.slice(hashIndex + 1);
  return hash || null;
}

function getPathTarget(href: string): string | null {
  if (href.startsWith("#")) return null;

  const [path] = href.split("#");
  return path || null;
}

export function NavMenu({ isLoggedIn, isLabRoute }: { isLoggedIn?: boolean; isLabRoute?: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  const [left, setLeft] = useState(0);
  const [width, setWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [isManualScroll, setIsManualScroll] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Prevent hydration mismatch by only showing logged-in state after mount
  const currentNavs = mounted && isLoggedIn ? LOGGED_IN_NAVS : isLabRoute ? labNavs : navs;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    // Initialize with active nav item based on current path or first item
    let activeHref = currentNavs[0]?.href;

    if (mounted && isLoggedIn) {
      // Find the nav item that matches current pathname
      const activeNav = currentNavs.find(nav => nav.href === pathname);
      activeHref = activeNav?.href ?? currentNavs[0]?.href;
    } else {
      const activeNav = currentNavs.find((nav) => {
        const hashTarget = getHashTarget(nav.href);
        const pathTarget = getPathTarget(nav.href);

        if (hashTarget && hashTarget === activeSection) {
          return !pathTarget || pathTarget === pathname;
        }

        return !hashTarget && pathTarget === pathname;
      }) ?? currentNavs.find((nav) => getPathTarget(nav.href) === pathname) ?? currentNavs[0];

      activeHref = activeNav?.href;
    }

    if (!activeHref) return;

    const activeItem = ref.current?.querySelector(`[href="${activeHref}"]`)?.parentElement;
    if (activeItem) {
      const rect = activeItem.getBoundingClientRect();
      setLeft(activeItem.offsetLeft);
      setWidth(rect.width);
      setIsReady(true);
    }
  }, [activeSection, mounted, isLoggedIn, currentNavs, pathname]);

  React.useEffect(() => {
    // Skip scroll handling for logged in users (they're on tools page)
    if (isLoggedIn) return;

    const sectionNavs = currentNavs
      .map((item) => ({
        href: item.href,
        target: getHashTarget(item.href),
        path: getPathTarget(item.href),
      }))
      .filter((item): item is { href: string; target: string; path: string | null } => Boolean(item.target))
      .filter((item) => !item.path || item.path === pathname);

    if (!sectionNavs.length) return;

    const handleScroll = () => {
      // Skip scroll handling during manual click scrolling
      if (isManualScroll) return;

      // Find the section closest to viewport top
      let closestSection = sectionNavs[0].target;
      let minDistance = Infinity;

      for (const sectionNav of sectionNavs) {
        const element = document.getElementById(sectionNav.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top - 100); // Offset by 100px to trigger earlier
          if (distance < minDistance) {
            minDistance = distance;
            closestSection = sectionNav.target;
          }
        }
      }

      // Update active section and nav indicator
      setActiveSection(closestSection);
      const activeNav = sectionNavs.find((item) => item.target === closestSection);
      const navItem = activeNav
        ? ref.current?.querySelector(`[href="${activeNav.href}"]`)?.parentElement
        : null;
      if (navItem) {
        const rect = navItem.getBoundingClientRect();
        setLeft(navItem.offsetLeft);
        setWidth(rect.width);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isManualScroll, isLoggedIn, currentNavs, pathname]);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem,
  ) => {
    // For logged in users, just let the link navigate normally
    if (isLoggedIn) {
      return;
    }

    const hashTarget = getHashTarget(item.href);
    const pathTarget = getPathTarget(item.href);

    // If there's no hash target, let it navigate normally (e.g., /portfolio)
    if (!hashTarget) {
      return;
    }

    const isSamePageTarget = !pathTarget || pathTarget === pathname;

    // Let the browser navigate to the correct route when the section lives elsewhere.
    if (!isSamePageTarget) {
      return;
    }

    e.preventDefault();

    const element = document.getElementById(hashTarget);

    // Hash-only links should still fall back to the homepage if the section is not on the current route.
    if (!element) {
      if (!pathTarget) {
        window.location.href = "/" + item.href;
      }
      return;
    }

    // Set manual scroll flag
    setIsManualScroll(true);

    // Immediately update nav state
    setActiveSection(hashTarget);
    const navItem = e.currentTarget.parentElement;
    if (navItem) {
      const rect = navItem.getBoundingClientRect();
      setLeft(navItem.offsetLeft);
      setWidth(rect.width);
    }

    const nextHashUrl = pathTarget ? `${pathTarget}#${hashTarget}` : item.href;
    window.history.replaceState(null, "", nextHashUrl);

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
  };

  return (
    <div className="w-full hidden md:block">
      <ul
        className="relative mx-auto flex w-fit rounded-full h-11 px-2 items-center justify-center"
        ref={ref}
      >
        {currentNavs.map((item) => {
          const itemHashTarget = getHashTarget(item.href);
          const itemPathTarget = getPathTarget(item.href);
          const isActive = mounted && isLoggedIn
            ? pathname === item.href
            : itemHashTarget
              ? activeSection === itemHashTarget && (!itemPathTarget || itemPathTarget === pathname)
              : pathname === itemPathTarget;

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
