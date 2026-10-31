import React from 'react';

interface KULogoProps {
  className?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export const KULogo: React.FC<KULogoProps> = ({
  className = 'h-14 w-auto',
  alt = 'Kishkinda University',
  loading = 'lazy',
  fetchPriority = 'auto',
}) => {
  return (
    <img
      src="/assets/kishkinda-logo.png"
      alt={alt}
      width={140}
      height={160}
      loading={loading}
      fetchPriority={fetchPriority}
      className={`${className} object-contain`}
    />
  );
};

export default KULogo;
