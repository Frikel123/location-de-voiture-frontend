import { QRCodeSVG } from "qrcode.react";
import { getContractPublicUrlFromContract } from "@/lib/contract-url";
import type { Contract } from "@/lib/api";
import { cn } from "@/lib/utils";

const logoDataUrl =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="#0B132B"/><path d="M18 61h60" stroke="#D4AF37" stroke-width="4" stroke-linecap="round"/><path d="M29 43h34c7 0 12 5 17 14H22c2-8 4-14 7-14z" fill="#D4AF37"/><path d="M22 56h61v10H20v-6c0-3 1-4 2-4z" fill="#F8F9FA"/><circle cx="33" cy="67" r="8" fill="#0B132B" stroke="#F8F9FA" stroke-width="4"/><circle cx="69" cy="67" r="8" fill="#0B132B" stroke="#F8F9FA" stroke-width="4"/><text x="48" y="34" text-anchor="middle" font-family="Georgia, serif" font-size="18" font-weight="700" fill="#F5E6A9">LLD</text></svg>`,
  );

export const ContractQrCode = ({
  contract,
  className,
  size = 180,
}: {
  contract: Pick<Contract, "contractNumber" | "contractToken" | "qrUrl">;
  className?: string;
  size?: number;
}) => {
  const url = getContractPublicUrlFromContract(contract);
  const hasValidUrl = /^https?:\/\/.+/i.test(url);

  return (
    <div className={cn("inline-flex w-full max-w-[220px] flex-col items-center gap-2 rounded-2xl bg-white p-3 text-slate-950 shadow-sm", className)}>
      {hasValidUrl ? (
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          includeMargin
          bgColor="#ffffff"
          fgColor="#020617"
          title={`Signature contrat ${contract.contractNumber}`}
          imageSettings={{
            src: logoDataUrl,
            height: Math.round(size * 0.2),
            width: Math.round(size * 0.2),
            excavate: true,
          }}
          className="h-auto w-full"
        />
      ) : (
        <div className="grid aspect-square w-full place-items-center rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs font-medium text-slate-500">
          QR indisponible
        </div>
      )}
      <p className="max-w-[190px] break-all text-center text-[10px] leading-4 text-slate-500">{hasValidUrl ? url : "URL contrat invalide"}</p>
    </div>
  );
};
