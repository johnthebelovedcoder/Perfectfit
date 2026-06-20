export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateItemSlug(title: string, id: string): string {
  return `${slugify(title)}-${id.slice(-8)}`;
}
