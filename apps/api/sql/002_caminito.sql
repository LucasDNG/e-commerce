ALTER TABLE shop_settings ADD COLUMN location TEXT NOT NULL DEFAULT '';

UPDATE shop_settings
SET
  store_name = 'Caminito',
  tagline = 'Piedras naturales y cosas lindas.',
  location = 'Calle 30 n° 1370, Verónica, Bs. As. · Envíos a todo el país',
  updated_at = now()
WHERE id = 1;
