const pieces = [
  '/piedras/rodocrosita.jpg',
  '/piedras/ojo-de-tigre.jpg',
  '/piedras/jade.jpg',
  '/piedras/obsidiana.jpg',
  '/piedras/aros.jpg',
  '/piedras/jade.jpg',
  '/piedras/aros.jpg',
  '/piedras/rodocrosita.jpg',
  '/piedras/ojo-de-tigre.jpg',
  '/piedras/obsidiana.jpg',
  '/piedras/aros.jpg',
  '/piedras/ojo-de-tigre.jpg',
  '/piedras/obsidiana.jpg',
  '/piedras/rodocrosita.jpg',
  '/piedras/jade.jpg',
  '/piedras/aros.jpg',
  '/piedras/jade.jpg',
  '/piedras/obsidiana.jpg',
  '/piedras/ojo-de-tigre.jpg',
  '/piedras/rodocrosita.jpg',
];

export function StoneField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#2a2118]" aria-hidden="true">
      <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 lg:grid-cols-4">
        {pieces.map((src, index) => (
          <img key={`${src}-${index}`} src={src} alt="" className="aspect-square w-full rounded-2xl object-contain shadow-[0_8px_24px_rgba(0,0,0,0.18)]" />
        ))}
      </div>
    </div>
  );
}
