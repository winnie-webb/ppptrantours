/**
 * Small Visa, Mastercard and PayPal marks for the "Pay with card" choice.
 * Inline SVG, so they cost no request and cannot fail to load. The card is
 * taken through PayPal's checkout, so PayPal sits beside the card brands
 * (owner, 2026-11-02).
 */
export default function CardLogos({ className = "" }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 ${className}`}>
      <svg
        viewBox="0 0 48 30"
        width="34"
        height="21"
        role="img"
        aria-label="Visa"
        className="rounded-[3px] border border-ink/10"
      >
        <rect width="48" height="30" fill="#fff" />
        <text
          x="24"
          y="20.5"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="14"
          fontStyle="italic"
          fontWeight="900"
          letterSpacing="-0.5"
          fill="#1A1F71"
        >
          VISA
        </text>
      </svg>
      <svg
        viewBox="0 0 48 30"
        width="34"
        height="21"
        role="img"
        aria-label="Mastercard"
        className="rounded-[3px] border border-ink/10"
      >
        <rect width="48" height="30" fill="#fff" />
        <circle cx="19" cy="15" r="9" fill="#EB001B" />
        <circle cx="29" cy="15" r="9" fill="#F79E1B" />
        <path d="M24 7.5a9 9 0 0 1 0 15a9 9 0 0 1 0-15z" fill="#FF5F00" />
      </svg>
      <svg
        viewBox="0 0 64 30"
        width="45"
        height="21"
        role="img"
        aria-label="PayPal"
        className="rounded-[3px] border border-ink/10"
      >
        <rect width="64" height="30" fill="#fff" />
        <text
          x="32"
          y="19.5"
          textAnchor="middle"
          fontFamily="Verdana, Arial, Helvetica, sans-serif"
          fontSize="13"
          fontStyle="italic"
          fontWeight="700"
          letterSpacing="-0.4"
        >
          <tspan fill="#003087">Pay</tspan>
          <tspan fill="#009CDE">Pal</tspan>
        </text>
      </svg>
    </span>
  );
}
