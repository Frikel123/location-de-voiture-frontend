import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Contract } from "@/lib/api";
import { getStoredCarImage } from "@/lib/car-images";
import { getContractPublicUrlFromContract } from "@/lib/contract-url";
import { normalizeContractStatus } from "@/types/contracts";
import carClio from "@/assets/car-clio.jpg";
import carI10 from "@/assets/car-i10.jpg";
import carLogan from "@/assets/car-logan.jpg";

type PdfContract = Contract & {
  agencyEmail?: string | null;
  agencyWebsite?: string | null;
  additionalFees?: number | string | null;
  fuelLevel?: string | null;
  existingScratches?: string | null;
  existingDamages?: string | null;
  mileageDeparture?: number | string | null;
  mileageReturn?: number | string | null;
  transmission?: string | null;
  vehicleTransmission?: string | null;
  vehicleImage?: string | null;
  carImage?: string | null;
  image?: string | null;
};

type RGB = readonly [number, number, number];
type FontStyle = "normal" | "bold";

type Layout = {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  footerHeight: number;
  y: number;
  qrDataUrl: string;
  verificationUrl: string;
  contract: PdfContract;
};

type FieldItem = {
  label: string;
  value: string | number | undefined | null;
};

type TableRow = {
  label: string;
  value: string | number | undefined | null;
  strong?: boolean;
};

const palette = {
  ink: [17, 24, 39] as RGB,
  muted: [95, 99, 108] as RGB,
  line: [205, 213, 224] as RGB,
  softLine: [229, 233, 240] as RGB,
  paper: [255, 255, 255] as RGB,
  soft: [247, 248, 250] as RGB,
  black: [8, 12, 20] as RGB,
  gold: [181, 139, 42] as RGB,
  goldSoft: [247, 241, 226] as RGB,
  danger: [160, 35, 35] as RGB,
};

const fallbackAgency = {
  name: "Service LLD",
  phone: "0661927502",
  email: "contact@servicelld.ma",
  website: "servicelld.netlify.app",
  address: "VC98+6G Meknes",
};

const formatMoney = (value: number | string | undefined | null) => {
  const amount = Number(value) || 0;
  return `${new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 0,
  }).format(amount)} DH`;
};

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const cleanText = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const retiredBrandPattern = new RegExp(["N", "A", "Y", "S", "\\s*", "C", "A", "R"].join(""), "gi");
  const retiredPrefixPattern = new RegExp(["\\b", "N", "C", "-"].join(""), "gi");
  return String(value)
    .replace(retiredBrandPattern, "Service LLD")
    .replace(retiredPrefixPattern, "SLLD-")
    .trim();
};

const buildDisplayContractNumber = (contract: PdfContract) => {
  const current = cleanText(contract.contractNumber);
  if (/^SLLD-\d{4}-\d{5}$/i.test(current)) return current.toUpperCase();

  const rawDate = contract.createdAt || contract.signedAt || new Date().toISOString();
  const parsedDate = new Date(rawDate);
  const year = Number.isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();
  const rawSequence = String(contract.id || current || Date.now()).replace(/\D/g, "");
  const sequence = rawSequence.slice(-5).padStart(5, "0");
  return `SLLD-${year}-${sequence}`;
};

const setFont = (doc: jsPDF, style: FontStyle = "normal", size = 10, color: RGB = palette.ink) => {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
};

const drawPageBackground = (layout: Layout) => {
  layout.doc.setFillColor(...palette.paper);
  layout.doc.rect(0, 0, layout.pageWidth, layout.pageHeight, "F");
};

const addWrappedText = (
  doc: jsPDF,
  text: string | number | undefined | null,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 10,
  options?: Parameters<jsPDF["text"]>[2],
) => {
  const lines = doc.splitTextToSize(cleanText(text), maxWidth) as string[];
  doc.text(lines, x, y, options);
  return y + Math.max(lines.length, 1) * lineHeight;
};

const drawLogo = (doc: jsPDF, x: number, y: number, size = 40) => {
  doc.setFillColor(...palette.black);
  doc.roundedRect(x, y, size, size, 8, 8, "F");
  doc.setFillColor(...palette.gold);
  doc.circle(x + size / 2, y + size / 2, size * 0.28, "F");
  setFont(doc, "bold", 10, palette.black);
  doc.text("LLD", x + size / 2, y + size / 2 + 3, { align: "center" });
};

const drawStatusBadge = (doc: jsPDF, status: string, x: number, y: number) => {
  const normalized = cleanText(normalizeContractStatus(status as Contract["status"]));
  const color = normalized === "Annule" || normalized === "Annulé" ? palette.danger : palette.gold;
  const label = normalized.toUpperCase();
  const width = Math.max(74, doc.getTextWidth(label) + 20);

  doc.setFillColor(...color);
  doc.roundedRect(x - width, y, width, 18, 9, 9, "F");
  setFont(doc, "bold", 7.5, palette.paper);
  doc.text(label, x - width / 2, y + 12, { align: "center" });
};

const drawHeader = (layout: Layout, isFirstPage: boolean) => {
  const { doc, margin, pageWidth, contentWidth, contract } = layout;
  const contractNumber = buildDisplayContractNumber(contract);
  const headerHeight = isFirstPage ? 92 : 62;

  doc.setFillColor(...palette.black);
  doc.rect(0, 0, pageWidth, headerHeight, "F");
  doc.setFillColor(...palette.gold);
  doc.rect(0, headerHeight - 3, pageWidth, 3, "F");

  drawLogo(doc, margin, 22, 40);
  setFont(doc, "bold", 18, palette.paper);
  doc.text("Service LLD", margin + 52, 39);
  setFont(doc, "normal", 8.5, [214, 219, 228]);
  doc.text("Premium Car Rental Contract", margin + 52, 55);

  setFont(doc, "bold", 9, palette.paper);
  doc.text("CONTRACT", margin + contentWidth, 30, { align: "right" });
  setFont(doc, "bold", 12, palette.gold);
  doc.text(contractNumber, margin + contentWidth, 47, { align: "right" });
  setFont(doc, "normal", 8, [214, 219, 228]);
  doc.text(`Created: ${formatDate(contract.createdAt || new Date().toISOString())}`, margin + contentWidth, 62, {
    align: "right",
  });
  drawStatusBadge(doc, cleanText(contract.status || contract.contractStatus || "Brouillon"), margin + contentWidth, 70);
};

const drawFooter = (layout: Layout) => {
  const { doc, pageWidth, pageHeight, margin, contentWidth, qrDataUrl, verificationUrl, contract } = layout;
  const footerTop = pageHeight - layout.footerHeight;
  const qrSize = 54;
  const qrX = pageWidth / 2 - qrSize / 2;

  doc.setFillColor(...palette.soft);
  doc.rect(0, footerTop, pageWidth, layout.footerHeight, "F");
  doc.setDrawColor(...palette.softLine);
  doc.line(margin, footerTop, margin + contentWidth, footerTop);

  try {
    doc.addImage(qrDataUrl, "PNG", qrX, footerTop + 12, qrSize, qrSize, undefined, "SLOW");
  } catch {
    // A failed QR render should not break the printable contract.
  }

  setFont(doc, "bold", 7.5, palette.ink);
  doc.text("Scan to verify contract authenticity", pageWidth / 2, footerTop + 76, { align: "center" });

  setFont(doc, "bold", 8.5, palette.ink);
  doc.text("Service LLD", margin, footerTop + 20);
  setFont(doc, "normal", 7.4, palette.muted);
  doc.text(`Phone: ${cleanText(contract.agencyPhone || fallbackAgency.phone)}`, margin, footerTop + 34);
  doc.text(`Email: ${cleanText(contract.agencyEmail || fallbackAgency.email)}`, margin, footerTop + 47);
  doc.text(`Website: ${cleanText(contract.agencyWebsite || fallbackAgency.website)}`, margin, footerTop + 60);

  const urlLines = doc.splitTextToSize(verificationUrl, 160) as string[];
  setFont(doc, "normal", 7.2, palette.muted);
  doc.text("Verification URL:", margin + contentWidth, footerTop + 27, { align: "right" });
  doc.text(urlLines.slice(0, 2), margin + contentWidth, footerTop + 40, { align: "right" });
  doc.text(`Page ${doc.getNumberOfPages()}`, margin + contentWidth, footerTop + 76, { align: "right" });
};

const startPage = (layout: Layout, isFirstPage = false) => {
  drawPageBackground(layout);
  drawHeader(layout, isFirstPage);
  drawFooter(layout);
  layout.y = isFirstPage ? 118 : 86;
};

const addPage = (layout: Layout) => {
  layout.doc.addPage();
  startPage(layout);
};

const ensureSpace = (layout: Layout, neededHeight: number) => {
  const bottomLimit = layout.pageHeight - layout.footerHeight - 22;
  if (layout.y + neededHeight > bottomLimit) {
    addPage(layout);
  }
};

const sectionTitle = (layout: Layout, title: string) => {
  ensureSpace(layout, 26);
  const { doc, margin } = layout;

  setFont(doc, "bold", 11, palette.ink);
  doc.text(title.toUpperCase(), margin, layout.y);
  doc.setDrawColor(...palette.gold);
  doc.setLineWidth(1.1);
  doc.line(margin, layout.y + 5, margin + 48, layout.y + 5);
  doc.setLineWidth(0.2);
  layout.y += 22;
};

const drawCard = (layout: Layout, x: number, y: number, width: number, height: number, fill: RGB = palette.paper) => {
  const { doc } = layout;
  doc.setFillColor(...fill);
  doc.setDrawColor(...palette.line);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, width, height, 7, 7, "FD");
};

const getFieldHeight = (doc: jsPDF, item: FieldItem, width: number) => {
  const lines = doc.splitTextToSize(cleanText(item.value), width) as string[];
  return 18 + Math.max(lines.length, 1) * 9;
};

const drawField = (layout: Layout, item: FieldItem, x: number, y: number, width: number) => {
  const { doc } = layout;
  setFont(doc, "bold", 6.8, palette.muted);
  doc.text(item.label.toUpperCase(), x, y);
  setFont(doc, "normal", 8.4, palette.ink);
  return addWrappedText(doc, item.value, x, y + 12, width, 9);
};

const drawFieldCard = (layout: Layout, title: string, items: FieldItem[], x: number, y: number, width: number) => {
  const inner = 14;
  const gap = 12;
  const columnWidth = (width - inner * 2 - gap) / 2;
  const rows: Array<[FieldItem | undefined, FieldItem | undefined]> = [];

  for (let index = 0; index < items.length; index += 2) {
    rows.push([items[index], items[index + 1]]);
  }

  const rowHeights = rows.map(([left, right]) =>
    Math.max(
      left ? getFieldHeight(layout.doc, left, columnWidth) : 0,
      right ? getFieldHeight(layout.doc, right, columnWidth) : 0,
      30,
    ),
  );
  const height = 42 + rowHeights.reduce((sum, current) => sum + current, 0);

  drawCard(layout, x, y, width, height);
  setFont(layout.doc, "bold", 10, palette.ink);
  layout.doc.text(title, x + inner, y + 22);

  let cursorY = y + 42;
  rows.forEach(([left, right], index) => {
    if (left) drawField(layout, left, x + inner, cursorY, columnWidth);
    if (right) drawField(layout, right, x + inner + columnWidth + gap, cursorY, columnWidth);
    cursorY += rowHeights[index];
  });

  return height;
};

const drawInfoCards = (layout: Layout) => {
  sectionTitle(layout, "Client and Vehicle Information");
  const gap = 16;
  const width = (layout.contentWidth - gap) / 2;
  const startY = layout.y;

  const clientItems: FieldItem[] = [
    { label: "Full name", value: layout.contract.clientFullName },
    { label: "CIN / Passport", value: layout.contract.clientDocumentNumber },
    { label: "Phone", value: layout.contract.clientPhone },
    { label: "Email", value: layout.contract.clientEmail },
    { label: "Address", value: layout.contract.clientAddress },
    { label: "Driving license", value: layout.contract.clientLicenseNumber },
  ];

  const vehicleItems: FieldItem[] = [
    { label: "Brand", value: layout.contract.carMake },
    { label: "Model", value: layout.contract.carModel },
    { label: "Registration", value: layout.contract.carPlate },
    { label: "Fuel type", value: layout.contract.carFuel },
    { label: "Transmission", value: layout.contract.transmission || layout.contract.vehicleTransmission || "Manual" },
    { label: "Mileage", value: `${cleanText(layout.contract.carMileage)} km` },
  ];

  const clientHeight = drawFieldCard(layout, "Client Information", clientItems, layout.margin, startY, width);
  const vehicleHeight = drawFieldCard(layout, "Vehicle Information", vehicleItems, layout.margin + width + gap, startY, width);
  layout.y = startY + Math.max(clientHeight, vehicleHeight) + 22;
};

const getImageFormat = (image: string) => (image.startsWith("data:image/png") ? "PNG" : "JPEG");

const getImageFit = (doc: jsPDF, image: string, maxWidth: number, maxHeight: number) => {
  try {
    const props = doc.getImageProperties(image);
    const ratio = props.width / props.height;
    let width = maxWidth;
    let height = width / ratio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }

    return { width, height };
  } catch {
    return { width: maxWidth, height: maxHeight };
  }
};

const addContainedImage = (doc: jsPDF, image: string, x: number, y: number, width: number, height: number) => {
  const fit = getImageFit(doc, image, width, height);
  const imageX = x + (width - fit.width) / 2;
  const imageY = y + (height - fit.height) / 2;
  doc.addImage(image, getImageFormat(image), imageX, imageY, fit.width, fit.height, undefined, "SLOW");
};

const drawVehicleHero = (layout: Layout, vehicleImage: string | null) => {
  sectionTitle(layout, "Vehicle Overview");
  ensureSpace(layout, 132);

  const { doc, margin, contentWidth, contract } = layout;
  const y = layout.y;
  const imageWidth = 188;
  const imageHeight = 96;

  drawCard(layout, margin, y, contentWidth, 122, palette.soft);
  doc.setFillColor(...palette.paper);
  doc.roundedRect(margin + 14, y + 13, imageWidth, imageHeight, 6, 6, "F");
  doc.setDrawColor(...palette.softLine);
  doc.roundedRect(margin + 14, y + 13, imageWidth, imageHeight, 6, 6, "S");

  if (vehicleImage) {
    addContainedImage(doc, vehicleImage, margin + 18, y + 17, imageWidth - 8, imageHeight - 8);
  }

  const textX = margin + imageWidth + 34;
  setFont(doc, "bold", 17, palette.ink);
  addWrappedText(doc, `${cleanText(contract.carMake)} ${cleanText(contract.carModel)}`, textX, y + 33, contentWidth - imageWidth - 50, 17);
  setFont(doc, "normal", 8.5, palette.muted);
  doc.text(`Registration: ${cleanText(contract.carPlate)}`, textX, y + 58);
  doc.text(`Fuel: ${cleanText(contract.carFuel)}  |  Transmission: ${cleanText(contract.transmission || contract.vehicleTransmission || "Manual")}`, textX, y + 74);
  doc.text(`Mileage: ${cleanText(contract.carMileage)} km`, textX, y + 90);

  layout.y += 144;
};

const drawRentalInfo = (layout: Layout) => {
  sectionTitle(layout, "Rental Information");
  const items: FieldItem[] = [
    { label: "Pickup date", value: formatDate(layout.contract.reservationStartDate) },
    { label: "Return date", value: formatDate(layout.contract.reservationEndDate) },
    { label: "Duration", value: `${cleanText(layout.contract.reservationDays)} days` },
    { label: "Daily rate", value: formatMoney(layout.contract.reservationDailyRate) },
    { label: "Deposit", value: formatMoney(layout.contract.reservationDeposit) },
    { label: "Additional fees", value: formatMoney(layout.contract.additionalFees) },
  ];

  ensureSpace(layout, 112);
  const height = drawFieldCard(layout, "Rental Details", items, layout.margin, layout.y, layout.contentWidth);
  layout.y += height + 22;
};

const drawTable = (layout: Layout, title: string, rows: TableRow[]) => {
  sectionTitle(layout, title);
  const { doc, margin, contentWidth } = layout;
  const amountWidth = 150;
  const leftWidth = contentWidth - amountWidth;
  const rowPadding = 11;
  const lineHeight = 10;

  const rowHeights = rows.map((row) => {
    const leftLines = doc.splitTextToSize(cleanText(row.label), leftWidth - rowPadding * 2) as string[];
    const rightLines = doc.splitTextToSize(cleanText(row.value), amountWidth - rowPadding * 2) as string[];
    return Math.max(30, Math.max(leftLines.length, rightLines.length) * lineHeight + 16);
  });
  const tableHeight = 31 + rowHeights.reduce((sum, height) => sum + height, 0);
  ensureSpace(layout, tableHeight + 8);

  const y = layout.y;
  drawCard(layout, margin, y, contentWidth, tableHeight);
  doc.setFillColor(...palette.black);
  doc.roundedRect(margin, y, contentWidth, 31, 7, 7, "F");
  doc.setFillColor(...palette.black);
  doc.rect(margin, y + 18, contentWidth, 13, "F");

  setFont(doc, "bold", 8, palette.paper);
  doc.text("Description", margin + rowPadding, y + 20);
  doc.text("Amount", margin + contentWidth - rowPadding, y + 20, { align: "right" });

  let cursorY = y + 31;
  rows.forEach((row, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(...palette.soft);
      doc.rect(margin + 1, cursorY, contentWidth - 2, rowHeights[index], "F");
    }
    if (row.strong) {
      doc.setFillColor(...palette.goldSoft);
      doc.rect(margin + 1, cursorY, contentWidth - 2, rowHeights[index], "F");
    }

    doc.setDrawColor(...palette.softLine);
    doc.line(margin, cursorY, margin + contentWidth, cursorY);
    setFont(doc, row.strong ? "bold" : "normal", 8.6, palette.ink);
    addWrappedText(doc, row.label, margin + rowPadding, cursorY + 18, leftWidth - rowPadding * 2, lineHeight);
    addWrappedText(doc, row.value, margin + contentWidth - rowPadding, cursorY + 18, amountWidth - rowPadding * 2, lineHeight, {
      align: "right",
    });
    cursorY += rowHeights[index];
  });

  layout.y += tableHeight + 22;
};

const drawSignatureImage = (
  doc: jsPDF,
  signature: string | null | undefined,
  x: number,
  y: number,
  width: number,
  maxHeight = 80,
) => {
  if (!signature?.startsWith("data:image/")) return false;

  try {
    const fit = getImageFit(doc, signature, width, maxHeight);
    const centeredX = x + (width - fit.width) / 2;
    const centeredY = y + (maxHeight - fit.height) / 2;
    doc.addImage(signature, getImageFormat(signature), centeredX, centeredY, fit.width, fit.height, undefined, "SLOW");
    return true;
  } catch {
    return false;
  }
};

const drawSignatureSection = (layout: Layout) => {
  sectionTitle(layout, "Signature Section");
  ensureSpace(layout, 178);

  const { doc, margin, contentWidth, contract } = layout;
  const gap = 18;
  const blockWidth = (contentWidth - gap) / 2;
  const blockHeight = 148;
  const y = layout.y;
  const clientSignature = contract.clientSignature ?? contract.signatureClient ?? contract.signature;
  const agencySignature = contract.agencySignature ?? contract.signatureAdmin;

  [
    {
      title: "CLIENT SIGNATURE",
      name: contract.clientFullName,
      signature: clientSignature,
      x: margin,
    },
    {
      title: "AGENCY SIGNATURE",
      name: contract.agencyName || "Service LLD",
      signature: agencySignature,
      x: margin + blockWidth + gap,
    },
  ].forEach((block) => {
    drawCard(layout, block.x, y, blockWidth, blockHeight);
    setFont(doc, "bold", 9.2, palette.ink);
    doc.text(block.title, block.x + blockWidth / 2, y + 24, { align: "center" });
    setFont(doc, "normal", 8, palette.muted);
    doc.text(cleanText(block.name), block.x + blockWidth / 2, y + 40, { align: "center" });

    const imageRendered = drawSignatureImage(doc, block.signature, block.x + 20, y + 50, blockWidth - 40, 80);
    if (!imageRendered) {
      setFont(doc, "normal", 8, palette.muted);
      doc.text("Signature pending", block.x + blockWidth / 2, y + 88, { align: "center" });
    }

    doc.setDrawColor(...palette.ink);
    doc.setLineWidth(0.6);
    doc.line(block.x + 28, y + 124, block.x + blockWidth - 28, y + 124);
    setFont(doc, "normal", 7.2, palette.muted);
    doc.text(`Date: ${formatDate(contract.signedAt || new Date().toISOString())}`, block.x + blockWidth / 2, y + 138, {
      align: "center",
    });
  });

  layout.y += blockHeight + 22;
};

const drawNotes = (layout: Layout) => {
  const notes = cleanText(layout.contract.notes);
  if (notes === "-") return;

  sectionTitle(layout, "Notes");
  const lines = layout.doc.splitTextToSize(notes, layout.contentWidth - 28) as string[];
  const height = Math.max(64, 34 + lines.length * 10);
  ensureSpace(layout, height);
  drawCard(layout, layout.margin, layout.y, layout.contentWidth, height);
  setFont(layout.doc, "normal", 8.5, palette.ink);
  layout.doc.text(lines, layout.margin + 14, layout.y + 24);
  layout.y += height + 22;
};

const dataUrlFromSource = async (source?: string | null) => {
  if (!source) return null;
  if (source.startsWith("data:image/")) return source;

  try {
    const response = await fetch(source);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Image unreadable."));
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
  if (contract.vehicleImage || contract.carImage || contract.image) {
    return contract.vehicleImage || contract.carImage || contract.image;
  }

  const model = `${contract.carMake} ${contract.carModel}`.toLowerCase();
  if (model.includes("i10")) return carI10;
  if (model.includes("clio")) return carClio;
  return carLogan;
};

const getAdditionalFees = (contract: PdfContract) => Number(contract.additionalFees) || 0;

export const generateContractPdf = async (contract: Contract) => {
  const pdfContract = contract as PdfContract;
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    compress: true,
    precision: 3,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const footerHeight = 102;
  const verificationUrl = getContractPublicUrlFromContract(pdfContract);
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    scale: 8,
  });
  const vehicleImage = await dataUrlFromSource(pickVehicleImage(pdfContract));

  const layout: Layout = {
    doc,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    footerHeight,
    y: 0,
    qrDataUrl,
    verificationUrl,
    contract: pdfContract,
  };

  startPage(layout, true);
  drawVehicleHero(layout, vehicleImage);
  drawInfoCards(layout);
  drawRentalInfo(layout);

  const rentalCost = Number(pdfContract.reservationDailyRate || 0) * Number(pdfContract.reservationDays || 0);
  const deposit = Number(pdfContract.reservationDeposit || 0);
  const additionalFees = getAdditionalFees(pdfContract);
  const total = Number(pdfContract.reservationTotalTTC || rentalCost + deposit + additionalFees);

  drawTable(layout, "Financial Summary", [
    { label: "Rental Cost", value: formatMoney(rentalCost) },
    { label: "Deposit", value: formatMoney(deposit) },
    { label: "Additional Fees", value: formatMoney(additionalFees) },
    { label: "Total", value: formatMoney(total), strong: true },
  ]);

  drawTable(layout, "Vehicle Condition Report", [
    { label: "Fuel level", value: pdfContract.fuelLevel || "Same level as pickup" },
    { label: "Existing scratches", value: pdfContract.existingScratches || "None declared" },
    { label: "Existing damages", value: pdfContract.existingDamages || "None declared" },
    { label: "Mileage departure", value: `${cleanText(pdfContract.mileageDeparture || pdfContract.carMileage)} km` },
    { label: "Mileage return", value: pdfContract.mileageReturn ? `${cleanText(pdfContract.mileageReturn)} km` : "To be completed on return" },
  ]);

  drawNotes(layout);
  drawSignatureSection(layout);

  const contractNumber = buildDisplayContractNumber(pdfContract);
  doc.save(`contract-${contractNumber}.pdf`);
};
