export function StoneField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#b08958]" aria-hidden="true">
      <img src="/fondo-caminito-vertical.jpg" alt="" className="h-full w-full object-cover object-center md:hidden" />
      <img src="/fondo-caminito.jpg" alt="" className="hidden h-full w-full object-cover object-center md:block" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1c140c]/30 via-[#1c140c]/5 to-[#1c140c]/40" />
    </div>
  );
}
