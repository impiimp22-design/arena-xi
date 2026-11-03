# Arena XI – web pública

Sitio estático (sin instalación ni compilación): HTML + CSS + JavaScript.
Los datos viven en Supabase; la web se publica en Cloudflare Pages.

## Estructura
- `index.html` – página única (las secciones cambian con #ranking, #retos, etc.)
- `css/style.css` – diseño
- `js/config.js` – dirección y clave pública de Supabase (y correo de contacto opcional)
- `js/api.js` – todo lo que habla con Supabase
- `js/app.js` – pantallas y lógica de la interfaz
- `assets/` – logo y fondos de cada apartado

## Primer administrador
1. Regístrate en la web con tu correo y confirma el correo.
2. En Supabase > SQL Editor ejecuta (cambia TuNick por tu nick):
   `update public.profiles set role = 'admin' where nick = 'TuNick';`
3. Recarga la web: aparecerá "Administrar liga" en tu perfil.
