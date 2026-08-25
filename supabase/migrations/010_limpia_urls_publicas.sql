-- 010 · Limpieza tras cerrar el almacén
--
-- Las direcciones públicas guardadas en media_url ya no funcionan y
-- además confunden: el enlace bueno se genera al vuelo y firmado a
-- partir de media_path cada vez que se abre el panel.

update public.posts set media_url = null where media_url is not null;
