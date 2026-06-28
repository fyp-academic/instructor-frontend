import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, type LucideIcon } from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  body: string;
  tip?: string;
  icon?: LucideIcon;
  /** CSS selector for the element to spotlight. Omit for a centered intro/outro card. */
  target?: string;
  /** Route to navigate to before showing this step. */
  route?: string;
  /** Preferred placement of the coach card relative to the target. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Extra padding (px) around the spotlight cut-out. */
  padding?: number;
}

interface Rect { top: number; left: number; width: number; height: number; }

interface SpotlightTourProps {
  steps: TourStep[];
  /** Short label shown in the corner badge, e.g. "Instructor tour". */
  badge?: string;
  onClose: () => void;
  onComplete: () => void;
}

const CARD_WIDTH = 384;
const GAP = 18;

export function SpotlightTour({ steps, badge, onClose, onComplete }: SpotlightTourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState({ w: CARD_WIDTH, h: 220 });

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const padding = step.padding ?? 10;

  const goTo = useCallback((i: number) => {
    setReady(false);
    setIndex(Math.max(0, Math.min(steps.length - 1, i)));
  }, [steps.length]);

  const next = useCallback(() => {
    if (isLast) onComplete();
    else goTo(index + 1);
  }, [isLast, index, goTo, onComplete]);

  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  // Navigate to the step's route if needed.
  useEffect(() => {
    if (step.route && location.pathname !== step.route) {
      navigate(step.route);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Locate + measure the target (polls until it appears after navigation/render).
  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let tries = 0;

    const measure = () => {
      if (cancelled) return;
      if (!step.target) {
        setRect(null);
        setReady(true);
        return;
      }
      const el = document.querySelector(step.target) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        setReady(true);
        return;
      }
      tries += 1;
      if (tries < 120) raf = requestAnimationFrame(measure);
      else { setRect(null); setReady(true); } // graceful fallback → centered card
    };

    const needsNav = step.route && location.pathname !== step.route;
    const timer = setTimeout(() => { raf = requestAnimationFrame(measure); }, needsNav ? 380 : 40);
    return () => { cancelled = true; cancelAnimationFrame(raf); clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, location.pathname]);

  // Keep the spotlight glued to the target while the page scrolls/resizes.
  useEffect(() => {
    if (!step.target) return;
    const update = () => {
      const el = document.querySelector(step.target!) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Keyboard controls.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, next, prev]);

  // Measure card so we can clamp it on-screen.
  useLayoutEffect(() => {
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      setCardSize({ w: r.width, h: r.height });
    }
  }, [index, ready]);

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Spotlight cut-out geometry.
  const sx = rect ? rect.left - padding : 0;
  const sy = rect ? rect.top - padding : 0;
  const sw = rect ? rect.width + padding * 2 : 0;
  const sh = rect ? rect.height + padding * 2 : 0;

  // Rectangle-with-hole clip path → blur/dim everything except the target.
  const clipPath = rect
    ? `polygon(0 0, 0 100%, ${sx}px 100%, ${sx}px ${sy}px, ${sx + sw}px ${sy}px, ${sx + sw}px ${sy + sh}px, ${sx}px ${sy + sh}px, ${sx}px 100%, 100% 100%, 100% 0)`
    : undefined;

  // Coach-card position.
  let cardTop: number;
  let cardLeft: number;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));
  if (!rect) {
    cardTop = vh / 2 - cardSize.h / 2;
    cardLeft = vw / 2 - cardSize.w / 2;
  } else if (step.placement === 'left' || step.placement === 'right') {
    // Horizontal placement — sit beside the target (used for the left sidebar),
    // vertically centred on it. Prefer the requested side, fall back if it
    // doesn't fit (e.g. a collapsed rail near the screen edge).
    const fitsRight = sx + sw + GAP + cardSize.w <= vw - 12;
    const fitsLeft = sx - GAP - cardSize.w >= 12;
    const placeRight = step.placement === 'right' ? (fitsRight || !fitsLeft) : !fitsLeft;
    cardLeft = placeRight ? sx + sw + GAP : sx - GAP - cardSize.w;
    cardLeft = clamp(cardLeft, 12, vw - cardSize.w - 12);
    cardTop = clamp(sy + sh / 2 - cardSize.h / 2, 12, vh - 12 - cardSize.h);
  } else {
    const wantBottom = step.placement === 'bottom'
      || (step.placement !== 'top' && sy + sh + GAP + cardSize.h < vh);
    cardTop = wantBottom ? sy + sh + GAP : sy - cardSize.h - GAP;
    cardTop = clamp(cardTop, 12, vh - 12 - cardSize.h);
    cardLeft = clamp(sx + sw / 2 - cardSize.w / 2, 12, vw - cardSize.w - 12);
  }

  const Icon = step.icon ?? Sparkles;
  const progress = ((index + 1) / steps.length) * 100;

  const overlay = (
    <div className="fixed inset-0 z-[2147483000]" aria-live="polite" role="dialog">
      <style>{`
        @keyframes apes-tour-glow {
          0%, 100% { box-shadow: 0 0 0 2px rgba(129,140,248,0.9), 0 0 0 6px rgba(99,102,241,0.35), 0 0 30px 6px rgba(99,102,241,0.45); }
          50%      { box-shadow: 0 0 0 2px rgba(165,180,252,1), 0 0 0 10px rgba(99,102,241,0.18), 0 0 44px 12px rgba(99,102,241,0.55); }
        }
        @keyframes apes-tour-in {
          from { opacity: 0; transform: translateY(8px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Blurred + dimmed backdrop with a crisp rectangular cut-out over the target. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.62)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          clipPath,
          WebkitClipPath: clipPath,
          transition: 'clip-path 0.55s cubic-bezier(.4,0,.2,1), background-color .3s ease',
          opacity: ready ? 1 : 0,
        }}
      />

      {/* Click-blocker so the page stays inert while the tour is guiding. */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Animated highlight ring around the target. */}
      {rect && (
        <div
          className="absolute rounded-2xl pointer-events-none"
          style={{
            top: sy,
            left: sx,
            width: sw,
            height: sh,
            animation: 'apes-tour-glow 2.4s ease-in-out infinite',
            transition: 'top .55s cubic-bezier(.4,0,.2,1), left .55s cubic-bezier(.4,0,.2,1), width .55s cubic-bezier(.4,0,.2,1), height .55s cubic-bezier(.4,0,.2,1)',
            opacity: ready ? 1 : 0,
          }}
        />
      )}

      {/* Coach card */}
      <div
        ref={cardRef}
        className="absolute"
        style={{
          top: cardTop,
          left: cardLeft,
          width: CARD_WIDTH,
          maxWidth: 'calc(100vw - 24px)',
          transition: ready ? 'top .5s cubic-bezier(.4,0,.2,1), left .5s cubic-bezier(.4,0,.2,1)' : 'none',
          animation: ready ? 'apes-tour-in .4s ease' : undefined,
          opacity: ready ? 1 : 0,
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  {badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">{badge}</span>
                  )}
                  <h2 className="text-base font-bold text-gray-900 leading-tight truncate">{step.title}</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 -mr-1 -mt-1 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0"
                title="Skip tour (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>

            {step.tip && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
                <span className="text-amber-500 flex-shrink-0 text-sm leading-5">💡</span>
                <p className="text-xs text-amber-800 leading-relaxed">{step.tip}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1.5">
                {steps.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => goTo(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-5 bg-indigo-600' : i < index ? 'w-1.5 bg-indigo-300' : 'w-1.5 bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25"
                >
                  {isLast ? (<><Check className="w-4 h-4" /> Finish</>) : (<>Next <ChevronRight className="w-4 h-4" /></>)}
                </button>
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="text-[11px] text-gray-400">Step {index + 1} of {steps.length} · Esc to skip</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
