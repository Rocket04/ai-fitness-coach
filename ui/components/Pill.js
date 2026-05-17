import React from 'react';

/**
 * Маленький цветной индикатор.
 * @param {{tone: 'green'|'yellow'|'red'|'blue'|'gray', children: React.ReactNode}} props
 * @returns {JSX.Element}
 */
export default function Pill({ tone, children }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
