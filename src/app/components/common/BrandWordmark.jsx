/**
 * Transparent wordmark matching the brand PNG (without the black canvas).
 * Use on light backgrounds; prefer BrandLogo (icon + text) in the main header.
 */
export default function BrandWordmark({ className = "", height = 40 }) {
  const width = Math.round((height * 300) / 88);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 88"
      width={width}
      height={height}
      role="img"
      aria-label="NutriFactx"
      className={className}
    >
      <text
        x="8"
        y="42"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="34"
        fontWeight="700"
        letterSpacing="-0.5"
      >
        <tspan fill="#555555">Nutri</tspan>
        <tspan fill="#216E4E">factX</tspan>
      </text>
      <text
        x="8"
        y="68"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="10"
        fontWeight="500"
        fill="#909090"
        letterSpacing="3.2"
      >
        REAL FACTS. REAL HEALTH.
      </text>
    </svg>
  );
}
