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
  // Pass through direct URLs (Unsplash, etc.)
  // Strip any pre-baked sizing query params so Next.js image optimization
  // can apply its own params without conflicting query strings causing 404s.
  if (publicId.startsWith("http://") || publicId.startsWith("https://")) {
    return publicId.split("?")[0] as string;
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
