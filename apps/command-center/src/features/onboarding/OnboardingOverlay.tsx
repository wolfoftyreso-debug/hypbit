import { useState, useEffect } from 'react'
import { CheckCircle, ChevronRight, ChevronLeft, X, Clock, BookOpen, Lightbulb, AlertTriangle, Info } from 'lucide-react'
import { TOURS } from './onboardingData'

const STORAGE_KEY = 'wavult_onboarding_v3'

function getCalloutStyle(type: 'info' | 'warning' | 'tip') {
  return {
    info:    { bg: '#007AFF10', border: '#007AFF', icon: Info, color: '#007AFF' },
    warning: { bg: '#FF950010', border: '#FF9500', icon: AlertTriangle, color: '#FF9500' },
    tip:     { bg: '#5856D610', border: '#5856D6', icon: Lightbulb, color: '#5856D6' },
  }[type]
}

const STEP_GRADIENTS = [
  'from-purple-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-green-500 to-emerald-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-violet-600',
  'from-teal-500 to-green-600',
]

export function OnboardingOverlay() {
  const tour = TOURS[0]
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'done')
    setVisible(false)
  }

  function next() {
    if (step < tour.steps.length - 1) setStep(s => s + 1)
    else dismiss()
  }

  function prev() {
    if (step > 0) setStep(s => s - 1)
  }

  if (!visible) return null

  const current = tour.steps[step]
  const gradient = STEP_GRADIENTS[step % STEP_GRADIENTS.length]
  const progress = ((step + 1) / tour.steps.length) * 100
  const minutesLeft = Math.ceil(((tour.steps.length - step) / tour.steps.length) * tour.estimatedMinutes)
  const calloutStyle = current.callout ? getCalloutStyle(current.callout.type) : null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
    >
      {/* Modal */}
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#FFFFFF', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Colored header */}
        <div className={`bg-gradient-to-br ${gradient} p-6 relative`}>
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-white opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center text-3xl rounded-xl flex-shrink-0"
              style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
            >
              {current.icon}
            </div>
            <div>
              <p className="text-white opacity-75 text-xs font-semibold uppercase tracking-widest mb-1">
                {tour.name}
              </p>
              <h2 className="text-white text-xl font-bold leading-tight">
                {current.title}
              </h2>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white opacity-70 text-xs">
                Steg {step + 1} av {tour.steps.length}
              </span>
              <span className="text-white opacity-70 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{minutesLeft} min kvar
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'rgba(255,255,255,0.9)' }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Description */}
          <p className="text-gray-700 text-sm leading-relaxed">
            {current.description}
          </p>

          {/* Bullets */}
          {current.bullets && current.bullets.length > 0 && (
            <div className="space-y-2.5">
              {current.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{bullet}</span>
                </div>
              ))}
            </div>
          )}

          {/* Example */}
          {current.example && (
            <div
              className="rounded-xl p-4"
              style={{ background: '#007AFF0A', border: '1px solid #007AFF30' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-3.5 h-3.5" style={{ color: '#007AFF' }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#007AFF' }}>
                  Prova detta
                </span>
              </div>
              <p className="text-sm text-gray-700 font-mono leading-relaxed" style={{ fontSize: 12 }}>
                {current.example}
              </p>
            </div>
          )}

          {/* Callout */}
          {current.callout && calloutStyle && (
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{
                background: calloutStyle.bg,
                borderLeft: `3px solid ${calloutStyle.border}`,
              }}
            >
              <calloutStyle.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: calloutStyle.color }} />
              <p className="text-sm" style={{ color: '#1C1C1E' }}>
                {current.callout.text}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: '#F2F2F7' }}
        >
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </button>

          <button
            onClick={dismiss}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Hoppa över
          </button>

          <button
            onClick={next}
            className="flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: '#5856D6' }}
          >
            {step === tour.steps.length - 1 ? 'Klar!' : 'Nästa'}
            {step < tour.steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY)
}
