import { ICONS } from "./icons.generated";

interface Props {
  name: string;
  size?: number | string;
  className?: string;
  label?: string;
}

export function Icon({ name, size = "1em", className, label }: Props) {
  const icon = ICONS[name];
  if (!icon) return null;
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      viewBox={icon.viewBox}
      width={dim}
      height={dim}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}
