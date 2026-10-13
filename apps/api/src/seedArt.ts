function frame(bg: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" fill="none">
  <rect width="800" height="800" fill="${bg}"/>
  ${body}
</svg>`;
}

export const seedArt: Record<string, string> = {
  'taza-de-gres': frame(
    '#f3ecdf',
    `<ellipse cx="400" cy="640" rx="190" ry="22" fill="#e3d3c0"/>
     <path d="M230 290h300v190c0 90-67 150-150 150s-150-60-150-150V290z" fill="#c24e1d"/>
     <path d="M250 270h260v28c0 10-6 16-16 16H266c-10 0-16-6-16-16v-28z" fill="#f7f1e8"/>
     <path d="M530 340h46c48 0 78 34 78 78s-30 78-78 78h-46" stroke="#1b1714" stroke-width="18" stroke-linecap="round"/>`,
  ),
  'manta-de-lino': frame(
    '#f6efe4',
    `<path d="M180 250h440v300H180z" fill="#d7c3a4"/>
     <path d="M180 250h440v46H180z" fill="#c24e1d"/>
     <path d="M220 360h360M220 430h360M220 500h280" stroke="#f7f1e8" stroke-width="14" stroke-linecap="round"/>
     <path d="M560 470l40 80H200l50-80h310z" fill="#cbb392"/>`,
  ),
  'lampara-de-mesa': frame(
    '#f4eee4',
    `<ellipse cx="400" cy="660" rx="150" ry="18" fill="#e4d5c3"/>
     <path d="M250 300h300L500 470H300L250 300z" fill="#f7f1e8" stroke="#1b1714" stroke-width="10"/>
     <path d="M250 300h300" stroke="#c24e1d" stroke-width="18" stroke-linecap="round"/>
     <path d="M400 470v120" stroke="#1b1714" stroke-width="12" stroke-linecap="round"/>
     <rect x="300" y="580" width="200" height="28" rx="14" fill="#2c4a3e"/>`,
  ),
  'camisa-de-algodon': frame(
    '#f3ecdf',
    `<path d="M250 230l150 70 150-70 70 80-70 50v250H250V360l-70-50 70-80z" fill="#f7f1e8" stroke="#1b1714" stroke-width="10" stroke-linejoin="round"/>
     <path d="M360 300c20 40 60 40 80 0" stroke="#c24e1d" stroke-width="10" stroke-linecap="round"/>
     <path d="M400 340v270" stroke="#e3d3c0" stroke-width="8"/>`,
  ),
  'cuaderno-cosido': frame(
    '#efe6d8',
    `<rect x="210" y="170" width="380" height="460" rx="8" fill="#f7f1e8" stroke="#1b1714" stroke-width="10"/>
     <path d="M250 170v460" stroke="#c24e1d" stroke-width="14"/>
     <path d="M310 280h220M310 340h220M310 400h180" stroke="#d9cbb8" stroke-width="10" stroke-linecap="round"/>
     <circle cx="250" cy="250" r="6" fill="#1b1714"/>
     <circle cx="250" cy="400" r="6" fill="#1b1714"/>
     <circle cx="250" cy="550" r="6" fill="#1b1714"/>`,
  ),
  'tijera-de-escritorio': frame(
    '#f6efe4',
    `<circle cx="290" cy="520" r="70" stroke="#1b1714" stroke-width="16"/>
     <circle cx="430" cy="520" r="70" stroke="#1b1714" stroke-width="16"/>
     <path d="M330 470L560 220" stroke="#c24e1d" stroke-width="22" stroke-linecap="round"/>
     <path d="M390 470L250 250" stroke="#2c4a3e" stroke-width="22" stroke-linecap="round"/>
     <circle cx="360" cy="490" r="14" fill="#1b1714"/>`,
  ),
  'jabon-de-oliva': frame(
    '#f3ecdf',
    `<rect x="220" y="300" width="360" height="200" rx="36" fill="#e7d3b0" stroke="#1b1714" stroke-width="10"/>
     <rect x="250" y="270" width="300" height="70" rx="24" fill="#f7f1e8" stroke="#1b1714" stroke-width="10"/>
     <path d="M300 400h200" stroke="#c24e1d" stroke-width="12" stroke-linecap="round"/>`,
  ),
  'aceite-de-manos': frame(
    '#f4eee4',
    `<rect x="330" y="180" width="140" height="46" rx="8" fill="#2c4a3e"/>
     <path d="M350 226h100l30 90v250c0 30-22 50-80 50s-80-20-80-50V316l30-90z" fill="#f7f1e8" stroke="#1b1714" stroke-width="10"/>
     <path d="M330 430h140" stroke="#c24e1d" stroke-width="16" stroke-linecap="round"/>
     <path d="M360 470h80" stroke="#d9cbb8" stroke-width="8" stroke-linecap="round"/>`,
  ),
};
