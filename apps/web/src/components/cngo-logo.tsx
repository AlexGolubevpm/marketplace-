"use client";

export function CngoLogo({ className = "h-10 w-10", logoUrl }: { className?: string; logoUrl?: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="Logo" className={`${className} object-contain`} />;
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className={className}>
      <path d="M15 20 L65 8 L72 22 L28 35 L15 30Z" fill="#DC2626" />
      <path d="M8 35 L28 35 L72 22 L78 36 L30 50 L8 45Z" fill="#B91C1C" />
      <path d="M8 45 L30 50 L78 36 L72 55 L25 65 L5 58Z" fill="#DC2626" />
      <path d="M5 58 L25 65 L72 55 L55 72 L20 82 L10 70Z" fill="#991B1B" />
      <path d="M20 82 L55 72 L42 82 L25 88Z" fill="#EF4444" />
    </svg>
  );
}
