/**
 * useScrollReveal — Hidden intelligence motion system
 * Elements enter smoothly as user scrolls. No bounce, no flash.
 * Just natural revelation that guides the eye.
 */
import { useEffect } from 'react'

export function useScrollReveal(threshold = 0.1) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            // Once revealed, unobserve (no re-animation on scroll back)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )

    // Observe all .reveal elements
    const elements = document.querySelectorAll('.reveal')
    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [threshold])
}

// Auto-attach to document — import this once in App.tsx
export function useGlobalScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )

    const attach = () => {
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el))
    }

    attach()
    // Re-attach when DOM changes (for dynamic content)
    const mutation = new MutationObserver(attach)
    mutation.observe(document.body, { childList: true, subtree: true })

    return () => { observer.disconnect(); mutation.disconnect() }
  }, [])
}
