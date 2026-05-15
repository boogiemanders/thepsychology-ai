'use client'

import { useEffect } from 'react'

export default function NavbarAutoHide() {
  useEffect(() => {
    const navbar = document.querySelector<HTMLElement>('[data-site-navbar="true"]')
    if (!navbar) return

    const ORIGINAL_TRANSITION = navbar.style.transition
    const ORIGINAL_OPACITY = navbar.style.opacity
    const ORIGINAL_POINTER = navbar.style.pointerEvents

    let hideTimer: number | null = null

    const hide = () => {
      navbar.style.transition = 'opacity 0.4s ease'
      navbar.style.opacity = '0'
      navbar.style.pointerEvents = 'none'
    }

    const show = () => {
      if (hideTimer) {
        window.clearTimeout(hideTimer)
        hideTimer = null
      }
      navbar.style.transition = 'opacity 0.4s ease'
      navbar.style.opacity = '1'
      navbar.style.pointerEvents = 'auto'
    }

    const scheduleHide = () => {
      if (hideTimer) window.clearTimeout(hideTimer)
      hideTimer = window.setTimeout(hide, 1000)
    }

    // Hot zone at the very top of the viewport - moving the mouse here reveals the nav.
    const hotZone = document.createElement('div')
    hotZone.style.cssText = 'position:fixed;top:0;left:0;right:0;height:12px;z-index:60;pointer-events:auto'
    document.body.appendChild(hotZone)

    hotZone.addEventListener('mouseenter', show)
    navbar.addEventListener('mouseenter', show)
    navbar.addEventListener('mouseleave', scheduleHide)
    hotZone.addEventListener('mouseleave', scheduleHide)

    // Show whenever scrolled to the top; schedule hide once scrolled away.
    const onScroll = () => {
      if (window.scrollY <= 4) show()
      else scheduleHide()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Initial fade after 1 second on page load.
    scheduleHide()

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer)
      window.removeEventListener('scroll', onScroll)
      hotZone.remove()
      navbar.style.transition = ORIGINAL_TRANSITION
      navbar.style.opacity = ORIGINAL_OPACITY
      navbar.style.pointerEvents = ORIGINAL_POINTER
    }
  }, [])

  return null
}
