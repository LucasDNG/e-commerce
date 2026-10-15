const tiles = [
  { src: '/piedras/rodocrosita.jpg', focus: 'object-center' },
  { src: '/piedras/ojo-de-tigre.jpg', focus: 'object-center' },
  { src: '/piedras/jade.jpg', focus: 'object-center' },
  { src: '/piedras/obsidiana.jpg', focus: 'object-[center_30%]' },
  { src: '/piedras/aros.jpg', focus: 'object-center' },
  { src: '/piedras/ojo-de-tigre.jpg', focus: 'object-[center_70%]' },
];

export function StoneField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="grid h-full w-full grid-cols-2 grid-rows-3 gap-1 bg-[#2c241c] p-1 md:grid-cols-3 md:grid-rows-2">
        {tiles.map((tile) => (
          <span key={`${tile.src}-${tile.focus}`} className="block h-full overflow-hidden">
            <img src={tile.src} alt="" className={`h-full w-full scale-125 object-cover ${tile.focus}`} />
          </span>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-[#1c140c]/20 to-[#3a2a14]/55" />
    </div>
  );
}
