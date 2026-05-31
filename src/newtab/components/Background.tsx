import type { BingImageCache } from "../../shared/bingDailyImage";
import { normalizeBingImageUrl } from "../../shared/bingImageCache";

type BackgroundProps = {
  image: BingImageCache | null;
};

export function Background({ image }: BackgroundProps) {
  const imageUrl = image ? normalizeBingImageUrl(image.imageUrl) : null;
  const style = imageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(8, 13, 20, 0.1), rgba(8, 13, 20, 0.55)), url("${imageUrl}")`,
      }
    : undefined;
  const className = [
    "absolute inset-0 scale-[1.02] bg-[linear-gradient(180deg,rgba(13,18,25,0.08),rgba(13,18,25,0.52)),linear-gradient(135deg,#263847_0%,#476b74_48%,#b9966c_100%)] bg-cover bg-center",
    imageUrl ? "saturate-[0.95]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
}
