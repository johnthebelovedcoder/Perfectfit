const CLOUD_NAME = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"] ?? "";

export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "jpg";
  } = {}
): string {
  // Pass through direct URLs (Unsplash, etc.). Image optimization is disabled in
  // production (self-hosted), so re-apply sizing params on the source URL — most
  // CDNs (Unsplash included) honor w/q/auto so images stay small.
  if (publicId.startsWith("http://") || publicId.startsWith("https://")) {
    const base = publicId.split("?")[0] as string;
    const { width, quality = 80 } = options;
    return width ? `${base}?w=${width}&q=${quality}&auto=format&fit=crop` : base;
  }

  const { width, height, quality = 80, format = "auto" } = options;

  const transforms: string[] = [`q_${quality}`, `f_${format}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`, "c_fill");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms.join(",")}/${publicId}`;
}

export function moveToItemsFolder(submissionPublicId: string): string {
  return submissionPublicId.replace("thread/submissions/", "thread/items/");
}
