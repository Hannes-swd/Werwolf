'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'

export default function MotionAtmosphere() {
  const rootRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-motion-orb]', {
          x: 0,
          y: 0,
          xPercent: 0,
          yPercent: 0,
          scale: 1,
        })
      })

      media.add('(prefers-reduced-motion: no-preference)', () => {
        const orbs = gsap.utils.toArray<HTMLElement>('[data-motion-orb]', root)
        const parallaxLayers = gsap.utils.toArray<HTMLElement>('[data-motion-depth]', root)
        const ambientTweens = orbs.map((orb, index) => {
          const direction = index % 2 === 0 ? 1 : -1

          return gsap.fromTo(
            orb,
            {
              xPercent: -direction * (2 + index),
              yPercent: direction * 2,
              scale: 0.97 + index * 0.008,
              opacity: 0.28 + index * 0.035,
            },
            {
              xPercent: direction * (4 + index * 1.5),
              yPercent: -direction * (3 + index),
              scale: 1.035 + index * 0.01,
              opacity: 0.42 + index * 0.025,
              duration: 15 + index * 3,
              delay: -index * 2.1,
              ease: 'sine.inOut',
              force3D: true,
              repeat: -1,
              yoyo: true,
            },
          )
        })

        let animationFrame: number | null = null
        let pointerX = 0
        let pointerY = 0

        const renderParallax = () => {
          animationFrame = null
          parallaxLayers.forEach(layer => {
            const depth = Number(layer.dataset.motionDepth ?? 0)
            gsap.to(layer, {
              x: pointerX * depth,
              y: pointerY * depth,
              duration: 1.15,
              ease: 'power3.out',
              force3D: true,
              overwrite: 'auto',
            })
          })
        }

        const queueParallax = (x: number, y: number) => {
          pointerX = x
          pointerY = y
          if (animationFrame === null) animationFrame = window.requestAnimationFrame(renderParallax)
        }

        const onPointerMove = (event: PointerEvent) => {
          queueParallax(
            event.clientX / Math.max(window.innerWidth, 1) - 0.5,
            event.clientY / Math.max(window.innerHeight, 1) - 0.5,
          )
        }

        const resetParallax = () => queueParallax(0, 0)
        const setPaused = (paused: boolean) => {
          ambientTweens.forEach(tween => tween.paused(paused))
          if (!paused) return

          if (animationFrame !== null) {
            window.cancelAnimationFrame(animationFrame)
            animationFrame = null
          }
          gsap.killTweensOf(parallaxLayers, 'x,y')
        }

        const onVisibilityChange = () => setPaused(document.hidden)
        const onPageHide = () => setPaused(true)
        const onPageShow = () => setPaused(document.hidden)
        const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')

        if (finePointer.matches) {
          window.addEventListener('pointermove', onPointerMove, { passive: true })
          document.documentElement.addEventListener('pointerleave', resetParallax)
        }

        // Keep persistent tabs and bfcache restores from running stale timelines.
        document.addEventListener('visibilitychange', onVisibilityChange)
        window.addEventListener('pagehide', onPageHide)
        window.addEventListener('pageshow', onPageShow)
        onVisibilityChange()

        return () => {
          window.removeEventListener('pointermove', onPointerMove)
          document.documentElement.removeEventListener('pointerleave', resetParallax)
          document.removeEventListener('visibilitychange', onVisibilityChange)
          window.removeEventListener('pagehide', onPageHide)
          window.removeEventListener('pageshow', onPageShow)
          if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
          gsap.killTweensOf(parallaxLayers)
        }
      })
    }, root)

    return () => {
      media.revert()
      context.revert()
    }
  }, [pathname])

  return (
    <div ref={rootRef} className="ww-motion-atmosphere" aria-hidden="true">
      <div className="ww-motion-mesh ww-motion-mesh-primary" data-motion-orb data-motion-depth="12" />
      <div className="ww-motion-mesh ww-motion-mesh-secondary" data-motion-orb data-motion-depth="-9" />
      <div className="ww-motion-mesh ww-motion-mesh-tertiary" data-motion-orb data-motion-depth="7" />
      <div className="ww-motion-mesh ww-motion-mesh-focus" data-motion-orb data-motion-depth="-5" />
    </div>
  )
}
