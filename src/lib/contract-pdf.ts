import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Contract } from "@/lib/api";
import { normalizeContractStatus } from "@/types/contracts";
import { getContractPublicUrlFromContract } from "@/lib/contract-url";
import { getStoredCarImage } from "@/lib/car-images";
import carClio from "@/assets/car-clio.jpg";
import carI10 from "@/assets/car-i10.jpg";
import carLogan from "@/assets/car-logan.jpg";

type PdfContract = Contract & {
  agencyEmail?: string | null;
  agencyIce?: string | null;
  agencyRc?: string | null;
  fuelPolicy?: string | null;
  mileagePolicy?: string | null;
  vehicleImage?: string | null;
  carImage?: string | null;
  image?: string | null;
};

const palette = {
  ink: [15, 23, 42] as const,
  muted: [100, 116, 139] as const,
  line: [226, 232, 240] as const,
  soft: [248, 250, 252] as const,
  navy: [2, 6, 23] as const,
  cyan: [8, 145, 178] as const,
  emerald: [5, 150, 105] as const,
  amber: [217, 119, 6] as const,
  rose: [225, 29, 72] as const,
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (date?: string) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const setFont = (doc: jsPDF, style: "normal" | "bold" = "normal", size = 10, color: readonly [number, number, number] = palette.ink) => {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
};

const addWrapped = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 12) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const card = (doc: jsPDF, x: number, y: number, width: number, height: number, fill: readonly [number, number, number] = [255, 255, 255]) => {
  doc.setFillColor(...fill);
  doc.setDrawColor(...palette.line);
  doc.roundedRect(x, y, width, height, 8, 8, "FD");
};

const sectionTitle = (doc: jsPDF, title: string, x: number, y: number, subtitle?: string) => {
  setFont(doc, "bold", 10.5, palette.ink);
  doc.text(title.toUpperCase(), x, y);
  doc.setDrawColor(...palette.cyan);
  doc.setLineWidth(1.4);
  doc.line(x, y + 6, x + 44, y + 6);
  doc.setLineWidth(0.2);
  if (subtitle) {
    setFont(doc, "normal", 7.5, palette.muted);
    doc.text(subtitle, x + 58, y);
  }
};

const field = (doc: jsPDF, label: string, value: string | number | undefined | null, x: number, y: number, width: number) => {
  setFont(doc, "bold", 7.2, palette.muted);
  doc.text(label.toUpperCase(), x, y);
  setFont(doc, "normal", 9, palette.ink);
  return addWrapped(doc, String(value || "-"), x, y + 12, width, 11);
};

const addFieldGrid = (
  doc: jsPDF,
  items: Array<[string, string | number | undefined | null]>,
  x: number,
  y: number,
  width: number,
  columns = 2,
) => {
  const gap = 16;
  const itemWidth = (width - gap * (columns - 1)) / columns;
  let bottom = y;

  items.forEach(([label, value], index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const itemX = x + col * (itemWidth + gap);
    const itemY = y + row * 39;
    bottom = Math.max(bottom, field(doc, label, value, itemX, itemY, itemWidth));
  });

  return bottom;
};

const statusBadge = (doc: jsPDF, status: string, x: number, y: number) => {
  const normalized = normalizeContractStatus(status as Contract["status"]);
  const label = normalized === "Confirmé" ? "CONFIRMED" : normalized === "Signé" ? "CONFIRMED" : normalized === "Annulé" ? "EXPIRED" : "PENDING";
  const color = label === "CONFIRMED" ? palette.emerald : label === "EXPIRED" ? palette.rose : palette.amber;
  const width = doc.getTextWidth(label) + 24;

  doc.setFillColor(...color);
  doc.roundedRect(x, y, width, 22, 11, 11, "F");
  setFont(doc, "bold", 8, [255, 255, 255]);
  doc.text(label, x + 12, y + 14.5);
};

const logo = (doc: jsPDF, x: number, y: number) => {
  doc.setFillColor(...palette.navy);
  doc.roundedRect(x, y, 48, 48, 11, 11, "F");
  doc.setFillColor(...palette.cyan);
  doc.roundedRect(x + 7, y + 31, 34, 4, 2, 2, "F");
  setFont(doc, "bold", 12, [255, 255, 255]);
  doc.text("ATLAS", x + 24, y + 21, { align: "center" });
  setFont(doc, "bold", 10, [125, 211, 252]);
  doc.text("CARS", x + 24, y + 34, { align: "center" });
};

const dataUrlFromSource = async (source?: string | null) => {
  if (!source) return null;
  if (source.startsWith("data:image/")) return source;

  try {
    const response = await fetch(source);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Image illisible."));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const pickVehicleImage = (contract: PdfContract) => {
  const storedImage = contract.carId ? getStoredCarImage(contract.carId) : null;
  if (storedImage) return storedImage;
  if (contract.vehicleImage || contract.carImage || contract.image) return contract.vehicleImage || contract.carImage || contract.image;

  const model = `${contract.carMake} ${contract.carModel}`.toLowerCase();
  if (model.includes("i10")) return carI10;
  if (model.includes("clio")) return carClio;
  return carLogan;
};

const addImageCover = (doc: jsPDF, image: string, x: number, y: number, width: number, height: number) => {
  doc.addImage(image, image.startsWith("data:image/png") ? "PNG" : "JPEG", x, y, width, height, undefined, "FAST");
};

const addSignatureImage = (doc: jsPDF, signature: string | null | undefined, x: number, y: number, width = 170, height = 48) => {
  if (!signature) return;
  const format = signature.startsWith("data:image/jpeg") || signature.startsWith("data:image/jpg") ? "JPEG" : "PNG";
  doc.addImage(signature, format, x, y, width, height);
};

const isSignatureImage = (signature?: string | null) => Boolean(signature?.startsWith("data:image/"));

const footer = (doc: jsPDF, pageWidth: number, pageHeight: number, contractNumber: string) => {
  doc.setDrawColor(...palette.line);
  doc.line(40, pageHeight - 38, pageWidth - 40, pageHeight - 38);
  setFont(doc, "normal", 7.5, palette.muted);
  doc.text(`N1 Lux Cars - Contrat ${contractNumber} - Document numerique verifiable`, 40, pageHeight - 22);
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 40, pageHeight - 22, { align: "right" });
};

export const generateContractPdf = async (contract: Contract) => {
  const pdfContract = contract as PdfContract;
  const clientSignature = pdfContract.clientSignature ?? pdfContract.signatureClient;
  const agencySignature = pdfContract.agencySignature ?? pdfContract.signatureAdmin;

  if (!isSignatureImage(clientSignature)) {
    throw new Error("La signature client est obligatoire avant de generer le PDF.");
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const publicUrl = getContractPublicUrlFromContract(pdfContract);
  const qrCodeData = await QRCode.toDataURL(publicUrl, { errorCorrectionLevel: "H", margin: 2, scale: 8 });
  const vehicleImage = await dataUrlFromSource(pickVehicleImage(pdfContract));

  doc.setFillColor(...palette.soft);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(...palette.navy);
  doc.roundedRect(margin, 28, contentWidth, 112, 14, 14, "F");
  logo(doc, margin + 20, 50);

  setFont(doc, "bold", 22, [255, 255, 255]);
  doc.text(pdfContract.agencyName || "N1 Lux Cars", margin + 84, 68);
  setFont(doc, "normal", 8.5, [203, 213, 225]);
  doc.text(pdfContract.agencyAddress || "Casablanca, Maroc", margin + 84, 88);
  doc.text(`${pdfContract.agencyPhone || "06 50 95 86 75"}  |  ${pdfContract.agencyEmail || "contact@n1-lux-cars.ma"}`, margin + 84, 104);
  doc.text(`ICE: ${pdfContract.agencyIce || "000000000000000"}  |  RC: ${pdfContract.agencyRc || "000000"}`, margin + 84, 120);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 152, 50, 124, 66, 10, 10, "F");
  setFont(doc, "bold", 8, palette.muted);
  doc.text("CONTRAT DE LOCATION", pageWidth - margin - 90, 68, { align: "center" });
  setFont(doc, "bold", 11, palette.ink);
  doc.text(`#${pdfContract.contractNumber}`, pageWidth - margin - 90, 88, { align: "center" });
  statusBadge(doc, normalizeContractStatus(pdfContract.status), pageWidth - margin - 132, 98);

  let y = 166;
  sectionTitle(doc, "Synthese du contrat", margin, y, "Document legal de location de vehicule");
  y += 18;

  const heroHeight = 132;
  card(doc, margin, y, contentWidth, heroHeight);
  if (vehicleImage) {
    doc.saveGraphicsState();
    doc.roundedRect(margin + 12, y + 12, 196, 108, 8, 8, "S");
    addImageCover(doc, vehicleImage, margin + 12, y + 12, 196, 108);
    doc.restoreGraphicsState();
  }

  const vehicleX = margin + 228;
  setFont(doc, "bold", 17, palette.ink);
  doc.text(`${pdfContract.carMake || "Vehicule"} ${pdfContract.carModel || ""}`.trim(), vehicleX, y + 34);
  setFont(doc, "normal", 9, palette.muted);
  doc.text(`Immatriculation: ${pdfContract.carPlate || "-"}  |  Couleur: ${pdfContract.carColor || "-"}`, vehicleX, y + 54);
  doc.text(`Carburant: ${pdfContract.carFuel || "-"}  |  Kilometrage depart: ${pdfContract.carMileage || 0} km`, vehicleX, y + 72);

  const metricY = y + 92;
  [
    ["Debut", formatDate(pdfContract.reservationStartDate)],
    ["Fin", formatDate(pdfContract.reservationEndDate)],
    ["Jours", String(pdfContract.reservationDays || 0)],
    ["Total TTC", formatMoney(pdfContract.reservationTotalTTC)],
  ].forEach(([label, value], index) => {
    const x = vehicleX + index * 76;
    setFont(doc, "bold", 7, palette.muted);
    doc.text(label.toUpperCase(), x, metricY);
    setFont(doc, "bold", 9, palette.ink);
    doc.text(value, x, metricY + 15);
  });
  y += heroHeight + 28;

  const halfGap = 18;
  const halfWidth = (contentWidth - halfGap) / 2;
  sectionTitle(doc, "Informations client", margin, y);
  sectionTitle(doc, "Informations agence", margin + halfWidth + halfGap, y);
  y += 16;
  card(doc, margin, y, halfWidth, 154);
  card(doc, margin + halfWidth + halfGap, y, halfWidth, 154);
  addFieldGrid(
    doc,
    [
      ["Nom complet", pdfContract.clientFullName],
      ["Telephone", pdfContract.clientPhone],
      ["Email", pdfContract.clientEmail],
      ["CIN / Passeport", pdfContract.clientDocumentNumber],
      ["Permis", pdfContract.clientLicenseNumber],
      ["Delivrance", formatDate(pdfContract.clientLicenseIssuedAt)],
      ["Adresse", pdfContract.clientAddress],
    ],
    margin + 14,
    y + 22,
    halfWidth - 28,
    2,
  );
  addFieldGrid(
    doc,
    [
      ["Agence", pdfContract.agencyName || "N1 Lux Cars"],
      ["Telephone", pdfContract.agencyPhone || "06 50 95 86 75"],
      ["Email", pdfContract.agencyEmail || "contact@n1-lux-cars.ma"],
      ["Adresse", pdfContract.agencyAddress || "Casablanca, Maroc"],
      ["ICE", pdfContract.agencyIce || "000000000000000"],
      ["RC", pdfContract.agencyRc || "000000"],
    ],
    margin + halfWidth + halfGap + 14,
    y + 22,
    halfWidth - 28,
    2,
  );
  y += 184;

  sectionTitle(doc, "Location, paiement et garanties", margin, y);
  y += 16;
  card(doc, margin, y, contentWidth, 118);
  addFieldGrid(
    doc,
    [
      ["Date de depart", formatDate(pdfContract.reservationStartDate)],
      ["Date de retour", formatDate(pdfContract.reservationEndDate)],
      ["Prix journalier", formatMoney(pdfContract.reservationDailyRate)],
      ["Nombre de jours", pdfContract.reservationDays],
      ["Total TTC", formatMoney(pdfContract.reservationTotalTTC)],
      ["Caution / depot", formatMoney(pdfContract.reservationDeposit)],
      ["Mode de paiement", pdfContract.reservationPaymentMethod || "Especes"],
      ["Assurance", pdfContract.insuranceName || "Assurance tous risques"],
      ["Politique carburant", pdfContract.fuelPolicy || "Restitution avec le meme niveau qu'au depart"],
      ["Kilometrage", pdfContract.mileagePolicy || `${pdfContract.carMileage || 0} km au depart, controle au retour`],
    ],
    margin + 14,
    y + 22,
    contentWidth - 28,
    4,
  );
  y += 146;

  sectionTitle(doc, "Signature numerique", margin, y);
  y += 16;
  card(doc, margin, y, contentWidth, 92);
  doc.addImage(qrCodeData, "PNG", margin + 16, y + 14, 64, 64);
  setFont(doc, "bold", 11, palette.ink);
  doc.text("Scanner pour signer ou consulter le contrat", margin + 96, y + 34);
  setFont(doc, "normal", 8, palette.muted);
  addWrapped(doc, publicUrl, margin + 96, y + 52, contentWidth - 116, 10);
  setFont(doc, "normal", 7.5, palette.muted);
  doc.text("Le QR code ouvre la page publique de signature electronique du contrat.", margin + 96, y + 76);

  footer(doc, pageWidth, pageHeight, pdfContract.contractNumber);

  doc.addPage();
  doc.setFillColor(...palette.soft);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  y = 46;
  sectionTitle(doc, "Conditions generales de location", margin, y, "Clauses contractuelles applicables");
  y += 20;
  card(doc, margin, y, contentWidth, 344);
  setFont(doc, "normal", 8.4, palette.ink);
  [
    "1. Le locataire reconnait avoir recu le vehicule en bon etat apparent, avec ses documents, accessoires et equipements de securite.",
    "2. Le vehicule doit etre utilise conformement au code de la route, aux conditions d'assurance et aux limites territoriales autorisees par l'agence.",
    "3. Le locataire est responsable des infractions, amendes, frais de parking, peages, dommages non couverts et pertes de documents ou de cles.",
    "4. Tout accident, vol, panne ou dommage doit etre declare immediatement a l'agence et aux autorites competentes, avec constat officiel si necessaire.",
    "5. Le vehicule doit etre restitue a la date, a l'heure et au lieu convenus. Tout retard peut entrainer une facturation supplementaire selon le tarif en vigueur.",
    "6. Le niveau de carburant, le kilometrage et l'etat general sont controles au depart et au retour. Les ecarts constates peuvent etre deduits de la caution.",
    "7. La conduite est reservee au client signataire et aux conducteurs autorises par ecrit. Toute sous-location ou usage commercial non autorise est interdit.",
    "8. La caution garantit les dommages, franchises, frais administratifs et montants dus. Elle est liberee apres controle du vehicule et cloture du dossier.",
    "9. Les donnees et signatures electroniques apposees sur ce contrat ont valeur de preuve entre les parties, sous reserve de verification par QR code.",
    "10. En cas de litige, les parties privilegient une resolution amiable avant toute procedure judiciaire competente.",
  ].forEach((term) => {
    y = addWrapped(doc, term, margin + 18, y + 16, contentWidth - 36, 11) + 2;
  });

  y = 432;
  sectionTitle(doc, "Signatures electroniques", margin, y);
  y += 16;
  const signatureHeight = 134;
  card(doc, margin, y, halfWidth, signatureHeight);
  card(doc, margin + halfWidth + halfGap, y, halfWidth, signatureHeight);

  setFont(doc, "bold", 9, palette.ink);
  doc.text("Client", margin + 16, y + 24);
  doc.text("Agence", margin + halfWidth + halfGap + 16, y + 24);
  setFont(doc, "normal", 7.5, palette.muted);
  doc.text(pdfContract.clientFullName || "-", margin + 16, y + 38);
  doc.text(pdfContract.agencyName || "N1 Lux Cars", margin + halfWidth + halfGap + 16, y + 38);

  addSignatureImage(doc, clientSignature, margin + 18, y + 48, halfWidth - 36, 48);
  addSignatureImage(doc, agencySignature, margin + halfWidth + halfGap + 18, y + 48, halfWidth - 36, 48);
  doc.setDrawColor(...palette.line);
  doc.line(margin + 16, y + 104, margin + halfWidth - 16, y + 104);
  doc.line(margin + halfWidth + halfGap + 16, y + 104, margin + contentWidth - 16, y + 104);
  setFont(doc, "normal", 8, palette.muted);
  doc.text(`Date de signature: ${formatDate(pdfContract.signedAt ?? new Date().toISOString())}`, margin + 16, y + 122);
  doc.text(`Date de signature: ${formatDate(pdfContract.signedAt ?? new Date().toISOString())}`, margin + halfWidth + halfGap + 16, y + 122);

  y += signatureHeight + 28;
  card(doc, margin, y, contentWidth, 84, [255, 255, 255]);
  setFont(doc, "bold", 9.5, palette.ink);
  doc.text("Declaration finale", margin + 16, y + 24);
  setFont(doc, "normal", 8.4, palette.muted);
  addWrapped(
    doc,
    "Les parties confirment avoir lu, compris et accepte toutes les conditions du present contrat. La signature electronique engage le client et l'agence au meme titre qu'une signature manuscrite.",
    margin + 16,
    y + 42,
    contentWidth - 32,
    11,
  );

  footer(doc, pageWidth, pageHeight, pdfContract.contractNumber);
  doc.save(`contrat-${pdfContract.contractNumber}.pdf`);
};
