# Vitrina

Base de comercio genérica en el stack PERN: PostgreSQL, Express, React y Node. Sirve para vestir después con la marca, los productos y los precios de cada cliente.

Hay dos aplicaciones y una API:

- `apps/storefront` es la tienda web, donde se vende.
- `apps/admin` es el panel de administración. Está pensado como app de teléfono: se instala desde el navegador y se usa con una mano.
- `apps/api` es la API en Express.

## Por qué el admin es una app web y no una app nativa

El resto del stack ya es React. El admin es una PWA: en el teléfono se abre el navegador, se elige **Agregar a inicio** y queda con ícono, pantalla completa y la barra de secciones abajo. Así se puede subir, bajar, editar, borrar y ordenar productos sin mantener un segundo proyecto en React Native.

Si más adelante un cliente lo quiere en Play Store o App Store, esta misma app se puede envolver con Capacitor sin reescribirla.

## Cómo correrlo

Hace falta Node 20+ y Postgres. Con Docker:

```bash
docker compose up -d
cp .env.example .env
npm install
npm run setup
npm run dev
```

Sin Docker, creá la base `vitrina` y un usuario con la URL de `DATABASE_URL`.

- Tienda: http://localhost:5173
- Admin: http://localhost:5174
- API: http://localhost:4000

El seed crea un admin y un catálogo de muestra:

- email: `admin@vitrina.local`
- contraseña: `cambiar-esta-clave`

Cambialos en `.env` antes del primer `npm run seed`. Si el admin ya existe, el seed no pisa la contraseña.

Para usar el admin desde el teléfono en la misma red, abrí `http://<ip-de-la-compu>:5174`. En desarrollo el front proxea `/api`, así que no hace falta publicar la API aparte.

## Qué se puede hacer

En el admin:

- **Subir** un producto, con hasta 6 fotos.
- **Bajarlo** de la tienda sin borrarlo, o volver a publicarlo.
- **Editar** precio, stock, textos y sección.
- **Borrar** el producto o una sección. Si se borra la sección, los productos quedan sin sección.
- **Ordenar** secciones, y ordenar los productos dentro de cada una.
- **Descargar** el catálogo en CSV o JSON.
- Ver los pedidos pagos, pendientes y los que fallaron por stock.
- Cambiar nombre, frase, moneda y email. Monedas: ARS, USD, EUR, MXN, CLP, UYU, BRL, COP.

En la tienda:

- Catálogo por secciones, búsqueda, ficha y carrito.
- El pago ocurre en la página. No redirige a otro sitio.

## Pagos

Sin claves de Stripe, el checkout usa un formulario de tarjeta de demostración. No se cobra dinero. La única tarjeta que aprueba es `4242 4242 4242 4242`, con un vencimiento futuro y un CVC de 3 dígitos.

Para un cliente real, completá en `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Reiniciá la API. El mismo checkout pasa a mostrar Stripe y el cobro sigue dentro de la página. El webhook es `POST /api/stripe/webhook`. La moneda de Ajustes tiene que ser una que acepte la cuenta de Stripe.

El stock se descuenta cuando el pago queda confirmado. Si dos personas compran la última unidad, la segunda ve el pedido como sin stock.

## Adaptarlo a un cliente

1. Fork o copia de este repo.
2. En el admin, cambiá nombre, frase, moneda y email.
3. Borrá el catálogo de muestra y subí el de verdad. Los dibujos del seed viven en `apps/api/src/seedArt.ts`.
4. Los colores de la tienda están al principio de `apps/storefront/src/styles.css`. Los del admin, en `apps/admin/src/styles.css`.
5. Los textos están en español con voseo. Para otro país, se buscan en `apps/storefront/src` y `apps/admin/src`.
6. Conectá Stripe y cambiá la contraseña del admin.
7. En producción, la tienda y la API salen juntas. `render.yaml` define el servicio `caminito-vitrina`: compilá la tienda, levantá la API y servila en `https://caminito-vitrina.onrender.com`. Hace falta una base Postgres (la misma cuenta de Neon que pádel, con una base nueva) en `DATABASE_URL` y un `JWT_SECRET` largo. `CORS_ORIGIN` ya acepta la tienda de Vercel. Si Vercel tiene cargada `VITE_API_URL`, esa URL gana; si no, el build apunta al servicio de Render. El admin puede vivir en otro dominio: agregalo a `CORS_ORIGIN`.

Las fotos subidas quedan en `apps/api/uploads`. Para más de un servidor, ese directorio se reemplaza por almacenamiento de objetos. La base ya guarda solo el nombre del archivo.

## Scripts

```bash
npm run dev        # API, tienda y admin
npm run setup      # migraciones y seed
npm test           # slugs y descuento de stock
npm run typecheck
npm run build
```
