const STONES = ['#1c140c', '#c8962a', '#c45b4a', '#e0b15a', '#6f947c', '#f7f1e4', '#8d4b68', '#c8962a', '#243026', '#d98b78', '#f3e2b4', '#1c140c'];

export function Beads({ className = 'beads' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 372 40" aria-hidden="true">
      <path d="M6 20h360" fill="none" stroke="currentColor" strokeWidth="1.4" />
      {STONES.map((fill, index) => {
        const radius = index % 3 === 0 ? 10 : 7.5;
        return (
          <g key={fill + index} transform={`translate(${16 + index * 30} 20)`}>
            <circle r={radius} fill={fill} stroke="#1c140c" strokeWidth="1.3" />
            <circle r="1.7" fill="#fffaf1" />
          </g>
        );
      })}
    </svg>
  );
}
