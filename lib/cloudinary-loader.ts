import { cloudinaryProxyUrl } from "./cloudinary-image";

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width }: LoaderArgs): string {
  return cloudinaryProxyUrl(src, width);
}
