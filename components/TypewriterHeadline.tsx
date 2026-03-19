'use client';

import { useEffect, useState } from 'react';

export function TypewriterHeadline() {
  const lines = ['Autonomous payments.', 'That must justify', 'every action.'];
  const full = lines.join('\n');
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(full.slice(0, i + 1));
      i++;
      if (i >= full.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, 28);
    return () => clearInterval(timer);
  }, [full]);

  const renderLine = (line: string, idx: number) => {
    if (line.includes('justify')) {
      const [before, after] = line.split('justify');
      return (
        <span key={idx} style={{ display: 'block' }}>
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
      <span key={idx} style={{ display: 'block' }}>
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
        letterSpacing: '-0.02em'
      }}
    >
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
            animation: 'cursorBlink 0.65s steps(1) infinite'
          }}
        />
      )}
    </h1>
  );
}
