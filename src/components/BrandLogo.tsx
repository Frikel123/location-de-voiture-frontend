import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export const BRAND_NAME = "Service LLD";
export const BRAND_LOGO_SRC = "/service.jpeg";

export const BrandLogo = ({ className, markClassName, textClassName, showText = true }: BrandLogoProps) => (
  <span className={cn("inline-flex items-center gap-3", className)}>
    <img
      src={BRAND_LOGO_SRC}
      alt={`${BRAND_NAME} logo`}
      className={cn("h-12 w-12 shrink-0 rounded-xl object-cover shadow-elegant", markClassName)}
      width={96}
      height={96}
    />
    {showText && (
      <span className={cn("leading-none", textClassName)}>
        <span className="block font-serif text-xl font-semibold tracking-wide">Service</span>
        <span className="block text-xs font-semibold uppercase tracking-[0.28em] text-primary">LLD</span>
      </span>
    )}
  </span>
);
