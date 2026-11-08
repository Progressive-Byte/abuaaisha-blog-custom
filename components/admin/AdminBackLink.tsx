import Link from "next/link";
import { Icon } from "@/components/Icon";

export function AdminBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className="a-back" href={href} aria-label={label} title={label}>
      <Icon name="chevron-left" size={15} />
      <span className="a-back-label">{label}</span>
    </Link>
  );
}
