import Link from "next/link";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
} & VariantProps<typeof buttonVariants>;

export function ButtonLink({ href, children, className, variant, size, onClick }: Props) {
  return (
    <Link href={href} onClick={onClick} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}
