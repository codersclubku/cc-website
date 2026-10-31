import fs from 'fs';

const svgPath = 'public/logo/1.svg';
const svgContent = fs.readFileSync(svgPath, 'utf8');

let inner = svgContent
  .replace(/<\?xml[\s\S]*?\?>/, '')
  .replace(/<svg[\s\S]*?>/, '')
  .replace(/<\/svg>/, '')
  .replace(/fill="#e0aaff"/g, 'fill="currentColor"')
  .replace(/id="1eeaec7ab4"/g, 'id="ccLogoClip"')
  .replace(/url\(#1eeaec7ab4\)/g, 'url(#ccLogoClip)')
  .replace(/clip-path=/g, 'clipPath=')
  .replace(/fill-opacity=/g, 'fillOpacity=');

const componentCode = `import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'horizontal' | 'stacked';
  onBrand?: boolean;
  className?: string;
}

/**
 * Coders Club Official Logo
 * Rendered using the user's provided SVG artwork from the brand kit.
 * Uses fill="currentColor" to adapt strictly to role tokens (--logo, --on-brand).
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  onBrand = false,
  className = '',
}) => {
  const colorClass = onBrand ? 'text-[var(--on-brand)]' : 'text-[var(--logo)]';
  const sizeClass = variant === 'stacked' ? 'h-14 sm:h-16 w-auto' : 'h-8 sm:h-9 w-auto';

  return (
    <Link
      to="/"
      className={\`inline-flex items-center select-none no-underline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 \${className}\`}
      aria-label="Coders Club home"
    >
      {/* Official Provided SVG Logo */}
      <svg
        viewBox="236 277 1033 905"
        className={\`\${sizeClass} \${colorClass} transition-colors\`}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
      >
        <title>Coders Club</title>
        ${inner.trim()}
      </svg>
    </Link>
  );
};
`;

fs.writeFileSync('src/components/Logo.tsx', componentCode, 'utf8');
console.log('Successfully generated clean React Logo component!');
