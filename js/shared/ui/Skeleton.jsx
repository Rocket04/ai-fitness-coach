// js/ui/components/Skeleton.js
import React from 'react';
import styles from './Skeleton.module.css';

/**
 * @param {{ width?: string, height?: string, borderRadius?: string, className?: string }} props
 */
export function SkeletonLine({ width = '100%', height = '1em', borderRadius = '4px', className = '' }) {
  return (
    <div
      className={`${styles['skeleton-line']} ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

/**
 * @param {{ rows?: number, className?: string }} props
 */
export function SkeletonCard({ rows = 3, className = '' }) {
  return (
    <div className={`card ${styles['skeleton-card']} ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === 0 ? '60%' : i === rows - 1 ? '40%' : '100%'}
          height={i === 0 ? '1.2em' : '0.9em'}
          className="mb-sm"
        />
      ))}
    </div>
  );
}

export default SkeletonCard;
