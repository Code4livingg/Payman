'use client';

import { useEffect, useRef, useState } from 'react';

const PHRASES = [
  'Autonomous payments.',
  'That must justify',
  'every action.'
];

const FULL_TEXT = PHRASES.join('\n');
const BASE_DELAY = 28;
const JITTER = 30; // ±ms for human rhythm
const PAUSE_AFTER_COMPLETE = 800;

export function TypewriterHeadline() {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let index = 0;

    const type = () => {
      if (index >= FULL_TEXT.length) {
        timeoutRef.current = setTimeout(() => setDone(true), PAUSE_AFTER_COMPLETE);
        return;
      }

      setDisplayed(FULL_TEXT.slice(0, index + 1));
      index++;

      // Human-like rhythm: slightly faster at start, random jitter
      const progress = index / FULL_TEXT.length;
      const eased = BASE_DELAY + JITTER * progress + Math.random() * JITTER;

      timeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(type);
      }, eased);
    };

    rafRef.current = requestAnimationFrame(type);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const renderLine = (line: string, idx: number) => {
    if (line.includes('justify')) {
      const [before, after] = line.split('justify');
      return (
        <span
          key={idx}
          style={{
            display: 'block',
            opacity: 1,
            transform: 'translateY(0)',
            transition: 'opacity 250ms ease-out, transform 250ms ease-out',
            willChange: 'transform, opacity'
          }}
        >
          {before}
          <span
            style={{
              textDecoration: 'underline',
              textDecorationColor: '#00c896',
              textDecorationThickness: '3px',
              textUnderlineOffset: '6px',
              animation: done ? 'justifyPulse 3s ease-in-out infinite' : undefined
            }}
          >
            justify
          </span>
          {after}
        </span>
      );
    }
    return (
      <span
        key={idx}
        style={{
          display: 'block',
          willChange: 'transform, opacity'
        }}
      >
        {line}
      </span>
    );
  };

  return (
    <h1
      style={{
        fontSize: 'clamp(46px,6.5vw,78px)',
        fontWeight: 800,
        lineHeight: 1.05,
        color: '#fff',
        whiteSpace: 'pre-line',
        minHeight: '260px',
        letterSpacing: '-0.02em',
        willChange: 'transform, opacity'
      }}
    >
      {/* Invisible placeholder to prevent layout shift */}
      <span aria-hidden style={{ visibility: 'hidden', position: 'absolute', pointerEvents: 'none' }}>
        {FULL_TEXT.split('\n').map((line, i) => renderLine(line, i))}
      </span>

      {displayed.split('\n').map((line, i) => renderLine(line, i))}

      {!done && (
        <span
          style={{
            display: 'inline-block',
            width: '4px',
            height: '0.8em',
            background: 'linear-gradient(180deg, #00c896, #7c3aed)',
            marginLeft: '3px',
            verticalAlign: 'text-bottom',
            animation: 'caretBlink 1s ease-in-out infinite',
            willChange: 'opacity'
          }}
        />
      )}
    </h1>
  );
}
