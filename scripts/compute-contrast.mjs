function parseHex(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function sRgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getLuminance(r, g, b) {
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

function contrastRatio(hex1, hex2) {
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const lightTokens = [
  { name: '--text on --bg', fg: '#241830', bg: '#FAF8FC', target: '4.5:1 (Normal Text)' },
  { name: '--text on --surface-1', fg: '#241830', bg: '#FFFFFF', target: '4.5:1 (Normal Text)' },
  { name: '--text on --surface-2', fg: '#241830', bg: '#F5EEFA', target: '4.5:1 (Normal Text)' },
  { name: '--text-muted on --bg', fg: '#685A74', bg: '#FAF8FC', target: '4.5:1 (Secondary Text)' },
  { name: '--text-muted on --surface-1', fg: '#685A74', bg: '#FFFFFF', target: '4.5:1 (Secondary Text)' },
  { name: '--text-subtle on --surface-1', fg: '#8B7D97', bg: '#FFFFFF', target: '3.0:1 (Tertiary/Large)' },
  { name: '--primary on --surface-1', fg: '#5A189A', bg: '#FFFFFF', target: '4.5:1 (Primary Text/Border)' },
  { name: '--on-primary on --primary', fg: '#FFFFFF', bg: '#5A189A', target: '4.5:1 (Primary Button Text)' },
  { name: '--on-accent on --accent', fg: '#2A0A4D', bg: '#C9A7F5', target: '4.5:1 (Accent Fill Text)' },
  { name: '--on-accent on --accent-hover', fg: '#2A0A4D', bg: '#B98DF0', target: '4.5:1 (Accent Hover Text)' },
  { name: '--on-accent on --accent-soft', fg: '#2A0A4D', bg: '#EADCFB', target: '4.5:1 (Accent Soft Text)' },
  { name: '--text-strong on --accent-soft', fg: '#240046', bg: '#EADCFB', target: '4.5:1 (Badge Text)' },
  { name: '--border on --bg', fg: '#E0AAFF', bg: '#FAF8FC', target: '1.2:1 (Decorative line)' },
  { name: '--border-strong on --bg', fg: '#7B2CBF', bg: '#FAF8FC', target: '3.0:1 (UI Border)' },
  { name: '--color-success-strong on light bg', fg: '#15803D', bg: '#FAF8FC', target: '4.5:1 (Semantic Success)' },
  { name: '--color-danger-strong on light bg', fg: '#B91C1C', bg: '#FAF8FC', target: '4.5:1 (Semantic Danger)' },
  { name: '--color-warning-strong on light bg', fg: '#C2410C', bg: '#FAF8FC', target: '4.5:1 (Semantic Warning)' },
  { name: '--color-info-strong on light bg', fg: '#0369A1', bg: '#FAF8FC', target: '4.5:1 (Semantic Info)' },
  { name: '#10002B on solid --color-success', fg: '#10002B', bg: '#4ADE80', target: '4.5:1 (Button Text)' },
  { name: '#10002B on solid --color-danger', fg: '#10002B', bg: '#F87171', target: '4.5:1 (Button Text)' },
  { name: '#10002B on solid --color-warning', fg: '#10002B', bg: '#FB923C', target: '4.5:1 (Button Text)' },
  { name: '#10002B on solid --color-info', fg: '#10002B', bg: '#38BDF8', target: '4.5:1 (Button Text)' }
];

const darkTokens = [
  { name: '--text on --bg', fg: '#ECE5F4', bg: '#10002B', target: '4.5:1 (Normal Text)' },
  { name: '--text on --surface-1', fg: '#ECE5F4', bg: '#240046', target: '4.5:1 (Normal Text)' },
  { name: '--text on --surface-2', fg: '#ECE5F4', bg: '#3C096C', target: '4.5:1 (Normal Text)' },
  { name: '--text-muted on --bg', fg: '#C4B7D6', bg: '#10002B', target: '4.5:1 (Secondary Text)' },
  { name: '--text-muted on --surface-1', fg: '#C4B7D6', bg: '#240046', target: '4.5:1 (Secondary Text)' },
  { name: '--text-subtle on --surface-1', fg: '#9786AD', bg: '#240046', target: '3.0:1 (Tertiary/Large)' },
  { name: '--primary on dark surface-1', fg: '#C77DFF', bg: '#240046', target: '4.5:1 (Interactive)' },
  { name: '--on-primary on dark --primary', fg: '#10002B', bg: '#C77DFF', target: '4.5:1 (Button Text)' },
  { name: '--accent-on-dark on dark bg', fg: '#E0AAFF', bg: '#10002B', target: '4.5:1 (Dark Accent Text)' },
  { name: '--accent-on-dark on dark surface-1', fg: '#E0AAFF', bg: '#240046', target: '4.5:1 (Dark Surface Accent Text)' },
  { name: '--on-accent on --accent', fg: '#2A0A4D', bg: '#C9A7F5', target: '4.5:1 (Accent Fill Text)' },
  { name: '--border-strong on --bg', fg: '#9D4EDD', bg: '#10002B', target: '3.0:1 (UI Border)' },
  { name: '--color-success on dark surface-1', fg: '#4ADE80', bg: '#240046', target: '4.5:1 (Semantic Success)' },
  { name: '--color-danger on dark surface-1', fg: '#F87171', bg: '#240046', target: '4.5:1 (Semantic Danger)' },
  { name: '--color-warning on dark surface-1', fg: '#FB923C', bg: '#240046', target: '4.5:1 (Semantic Warning)' },
  { name: '--color-info on dark surface-1', fg: '#38BDF8', bg: '#240046', target: '4.5:1 (Semantic Info)' }
];

console.log('### LIGHT MODE CONTRAST');
for (const item of lightTokens) {
  const ratio = contrastRatio(item.fg, item.bg);
  console.log(`| ${item.name} | \`${item.fg}\` | \`${item.bg}\` | ${ratio.toFixed(2)}:1 | ${item.target} | ${ratio >= 4.5 || (item.target.includes('3.0') && ratio >= 3.0) || item.target.includes('Decorative') ? 'PASS' : 'WARN'} |`);
}

console.log('\n### DARK MODE CONTRAST');
for (const item of darkTokens) {
  const ratio = contrastRatio(item.fg, item.bg);
  console.log(`| ${item.name} | \`${item.fg}\` | \`${item.bg}\` | ${ratio.toFixed(2)}:1 | ${item.target} | ${ratio >= 4.5 || (item.target.includes('3.0') && ratio >= 3.0) || item.target.includes('Decorative') ? 'PASS' : 'WARN'} |`);
}
