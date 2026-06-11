import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export const BRAND_NAME = "N1 Lux Cars";
export const BRAND_LOGO_SRC = "/n1-lux-cars-logo.svg";

export const BrandLogo = ({ className, markClassName, textClassName, showText = true }: BrandLogoProps) => (
  <span className={cn("inline-flex items-center gap-3", className)}>
    <img
      src={BRAND_LOGO_SRC}
      alt={`${BRAND_NAME} logo`}
      className={cn("h-12 w-12 shrink-0 rounded-full object-contain shadow-elegant", markClassName)}
      width={96}
      height={96}
    />
    {showText && (
      <span className={cn("leading-none", textClassName)}>
        <span className="block font-serif text-xl font-semibold tracking-wide">N1 Lux</span>
        <span className="block text-xs font-semibold uppercase tracking-[0.28em] text-primary">Cars</span>
      </span>
    )}
  </span>
);
