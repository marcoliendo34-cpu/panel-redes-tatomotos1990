# Panel de contenido · Marco Liendo Gestión RRSS

Panel web donde la agencia sube el contenido planificado del mes y el cliente lo
revisa, aprueba, rechaza o comenta antes de que se publique. Reemplaza el flujo
de aprobación por WhatsApp, donde las decisiones se pierden entre mensajes.

La marca visible del panel es la de la agencia. Cada cliente que se dé de alta
ve el contenido de su propia marca y nada más; el nombre de esa marca aparece
en la cabecera, junto al logo de la agencia. El primer cliente configurado es
TATO MOTOS 1990 C.A.

## Qué hace

- **Dos accesos con permisos distintos.** La agencia ve y edita todo. El cliente
  solo ve las piezas de su marca, y nunca los borradores.
- **Calendario mensual y lista.** El mismo contenido en dos vistas, con filtros
  por estado y por red social.
- **Cuatro estados por pieza:** borrador, en revisión, aprobado y rechazado.
- **Rechazar exige motivo.** No es una validación de pantalla: la base de datos
  rechaza la operación si no viene un motivo escrito.
- **Historial por pieza.** Cada aprobación, rechazo y comentario queda guardado
  con el nombre y el rol de quien lo hizo.
- **Contador del mes** arriba de todo: aprobadas, pendientes, rechazadas y
  borradores.
- **Archivos en Supabase Storage.** Las imágenes y videos se suben desde el
  propio panel.

## Con qué está hecho

| Pieza | Qué se usó |
|---|---|
| Aplicación | Next.js 14 (App Router), JavaScript |
| Estilos | CSS propio con variables. Sin Tailwind ni librerías de UI |
| Login, base de datos y archivos | Supabase |
| Publicación | Vercel |

Se evitaron TypeScript y frameworks de UI a propósito: menos piezas que puedan
romper el despliegue.

## Cómo correrlo en tu computadora

Necesitas Node.js 18 o superior.

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Abre http://localhost:3000

## Variables de entorno

Dos, y las dos son públicas por diseño (la clave `anon` está pensada para vivir
en el navegador; lo que protege los datos son las políticas de seguridad de la
base de datos, no el secreto de esta clave).

```
NEXT_PUBLIC_SUPABASE_URL=https://rpxdeeharejfmcjlihqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_AKobDibOinl7XI-aVjJgYA_JiCOs7U3
```

Estas mismas dos hay que cargarlas en Vercel para que el sitio publicado
funcione.

## Base de datos

El esquema completo está en `supabase/migrations/`, numerado en el orden en que
debe aplicarse. **Ya está aplicado** en el proyecto de Supabase; los archivos
están aquí para poder reconstruirlo desde cero si hiciera falta.

| Tabla | Para qué |
|---|---|
| `brands` | Marcas. Permite sumar más clientes sin rehacer nada |
| `profiles` | Usuarios, con su rol (agencia/cliente) y su marca |
| `posts` | Las piezas de contenido |
| `comments` | La conversación de cada pieza |
| `metricas_ads` | Resultados de publicidad pagada por día y campaña |

### Cómo funciona la seguridad

Los permisos **no dependen del diseño de la pantalla**. Están en la base de
datos (Row Level Security), así que se cumplen aunque alguien intente entrar por
otro camino.

- El cliente no tiene permiso de escritura sobre `posts`. Aprueba y rechaza a
  través de la función `review_post`, que es la única puerta y comprueba que la
  pieza sea de su marca, que no sea un borrador, y que un rechazo traiga motivo.
- Solo la agencia puede subir o borrar archivos del bucket `contenido`.
- Los usuarios nuevos entran como `cliente` por defecto. Para hacer a alguien
  agencia hay que cambiarlo a mano (ver abajo).

## Crear usuarios

En Supabase → **Authentication** → **Users** → **Add user**, con correo y
contraseña. El perfil se crea solo.

Para convertir un usuario en agencia, en el **SQL Editor**:

```sql
update public.profiles
   set role = 'agencia'
 where email = 'correo@de.la.agencia';
```

Para asignarle a un cliente su marca:

```sql
update public.profiles
   set brand_id = (select id from public.brands where slug = 'tato-motos')
 where email = 'correo@del.cliente';
```

## Estructura

```
app/
  layout.js              tipografías y estilos globales
  globals.css            todo el diseño
  login/                 pantalla de acceso
  panel/
    page.js              carga usuario y perfil en el servidor
    panel-client.js      arma el panel y coordina todo
    tablero.js           el contador del mes
    calendario.js        vista de calendario
    lista.js             vista de lista
    detalle.js           modal: aprobar, rechazar, comentar
    editor.js            crear y editar piezas (solo agencia)
  auth/signout/          cerrar sesión
lib/
  constants.js           redes, estados y utilidades de fecha
  supabase/              conexión a Supabase (navegador y servidor)
middleware.js            mantiene la sesión y protege /panel
supabase/migrations/     el esquema de la base de datos
```

## Nota sobre los archivos subidos

El bucket `contenido` es de **lectura pública**. Las rutas llevan un
identificador aleatorio, así que no se pueden adivinar, pero quien tenga el
enlace directo puede ver el archivo aunque no haya iniciado sesión.

Para contenido que aún no se publica el riesgo es bajo. Si se prefiere cerrarlo
del todo, hay que pasar el bucket a privado y generar enlaces firmados que
caduquen.
