// Husu — el MISMO panda del logo/icono (panda rojo, paleta clay/cream/ink).
// Reemplaza el emoji 🐼 (panda blanco y negro del sistema) en pantallas
// grandes (onboarding, avatar del Coach) para que sea consistente con el icono.
// Mismas paths que assets/app-icon.svg, viewBox recortado al panda.

interface Props {
  size?: number;
  className?: string;
}

export function HusuPanda({ size = 64, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="160 160 700 700"
      className={className}
      role="img"
      aria-label="Husu"
      style={{ display: 'block', margin: '0 auto' }}
    >
      <g transform="translate(512, 540)">
        {/* Orejas exteriores */}
        <ellipse cx="-230" cy="-180" rx="90" ry="100" fill="#A8633F" transform="rotate(-25 -230 -180)" />
        <ellipse cx="230" cy="-180" rx="90" ry="100" fill="#A8633F" transform="rotate(25 230 -180)" />
        {/* Orejas interiores */}
        <ellipse cx="-230" cy="-170" rx="40" ry="55" fill="#F5EFE6" transform="rotate(-25 -230 -170)" />
        <ellipse cx="230" cy="-170" rx="40" ry="55" fill="#F5EFE6" transform="rotate(25 230 -170)" />
        {/* Cabeza */}
        <ellipse cx="0" cy="0" rx="270" ry="240" fill="#C9784A" />
        {/* Cara cream */}
        <ellipse cx="0" cy="40" rx="180" ry="180" fill="#F5EFE6" />
        {/* Antifaz (marcas oscuras del panda rojo) */}
        <path d="M -120 -50 Q -180 -10 -150 60 Q -110 90 -80 60 Q -60 30 -80 -20 Q -100 -55 -120 -50 Z" fill="#7A4A2E" />
        <path d="M 120 -50 Q 180 -10 150 60 Q 110 90 80 60 Q 60 30 80 -20 Q 100 -55 120 -50 Z" fill="#7A4A2E" />
        {/* Ojos */}
        <circle cx="-95" cy="20" r="22" fill="#2A2823" />
        <circle cx="95" cy="20" r="22" fill="#2A2823" />
        <circle cx="-88" cy="13" r="7" fill="#F5EFE6" />
        <circle cx="102" cy="13" r="7" fill="#F5EFE6" />
        {/* Nariz */}
        <ellipse cx="0" cy="85" rx="22" ry="18" fill="#2A2823" />
        {/* Boca */}
        <path d="M 0 105 Q 0 130 -15 135 M 0 105 Q 0 130 15 135" fill="none" stroke="#2A2823" strokeWidth="6" strokeLinecap="round" />
        {/* Mejillas */}
        <circle cx="-150" cy="80" r="20" fill="#E5A04C" opacity="0.45" />
        <circle cx="150" cy="80" r="20" fill="#E5A04C" opacity="0.45" />
      </g>
    </svg>
  );
}
