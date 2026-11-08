interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality }: LoaderArgs): string {
  if (!src.includes("res.cloudinary.com") || !src.includes("/image/upload/")) {
    return src;
  }

  const transform = `f_auto,q_${quality ?? "auto"},w_${width}`;
  if (/\/image\/upload\/[^/]*f_auto/.test(src)) {
    return src.replace(/(\/image\/upload\/)[^/]*/, `$1${transform}`);
  }
  return src.replace("/image/upload/", `/image/upload/${transform}/`);
}
