/**
 * Genera un slug a partir de un nombre (minúsculas, sin acentos, guiones).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Genera un id corto alfanumérico (para unicidad del slug).
 */
function shortId(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Slug único: base del nombre + sufijo aleatorio.
 */
export function generateSlug(name: string): string {
  const base = slugify(name) || "profesional";
  return `${base}-${shortId()}`;
}
