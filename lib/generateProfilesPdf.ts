import { jsPDF } from "jspdf";
import { imageUrlToBase64 } from "./imageToBase64";
import border from "../public/uploads/border4.jpg";
export interface ProfileData {
    mobile: string;
    fatherName: string;
    motherName: string;
    fatherOccupation: string;
    motherOccupation: string;
    dob: string;
    education: string;
    address: string;
    picture?: string;
    createdAt?: string;
    updatedAt?: string;
}
  const borderImageUrl = border.src

  // Utility: load image from URL and convert to base64
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });
  };
const drawAadhaarCard = async (
  doc: jsPDF,
  startX: number,
  startY: number,
  width: number,
  height: number,
  cardNumber: number,
  data: ProfileData
) => {
  const borderMargin = 15; // margin to leave for border image
  const padding = 8;

  // ----------------- DRAW BORDER IMAGE -----------------
  const borderBase64 = await loadImageAsBase64(borderImageUrl);
  doc.addImage(borderBase64, "PNG", startX, startY, width, height);

  // ----------------- DRAW GREY BACKGROUND INSIDE BORDER -----------------
  const bgX = startX + borderMargin;
  const bgY = startY + borderMargin;
  const bgWidth = width - borderMargin * 2;
  const bgHeight = height - borderMargin * 2;

  doc.setFillColor(240, 240, 240); // light grey
  doc.rect(bgX, bgY, bgWidth, bgHeight, "F"); // fill only inside the border

  // ----------------- CARD NUMBER -----------------
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `No: ${cardNumber}`,
    bgX + bgWidth - padding,
    bgY + padding,
    { align: "right" }
  );

  // ----------------- IMAGE (RIGHT SIDE) -----------------
  const imageWidth = 30;
  const imageHeight = 35;
  const imageX = bgX + bgWidth - imageWidth - padding;
  const imageY = bgY + 20;

  if (data.picture) {
    const base64Img = await imageUrlToBase64(data.picture);
    doc.addImage(base64Img, "JPEG", imageX, imageY, imageWidth, imageHeight);
  }

  // ----------------- TEXT (LEFT SIDE) -----------------
  const textX = bgX + padding;
  let textY = bgY + 20;
  const gap = 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(`Father Name: ${data.fatherName}`, textX, textY);
  textY += gap;
  doc.text(`Mother Name: ${data.motherName}`, textX, textY);
  textY += gap;
  doc.text(`Father Occupation: ${data.fatherOccupation}`, textX, textY);
  textY += gap;
  doc.text(`Mother Occupation: ${data.motherOccupation}`, textX, textY);
  textY += gap;
  doc.text(`DOB: ${data.dob}`, textX, textY);
  textY += gap;
  doc.text(`Education: ${data.education}`, textX, textY);
  textY += gap;
  doc.text(`Address:`, textX, textY);
  textY += 5;
  doc.text(data.address || "-", textX, textY, {
    maxWidth: bgWidth - imageWidth - padding * 3,
  });
};


export async function generateProfilesPdf(profiles: any[]) {
  const doc = new jsPDF("l", "mm", "a4");

const pageWidth = doc.internal.pageSize.getWidth();   // 297
const pageHeight = doc.internal.pageSize.getHeight(); // 210

const margin = 10;
const gap = 5;

const cardWidth = (pageWidth - margin * 2 - gap) / 2;
const cardHeight = pageHeight - margin * 2;

const xLeft = margin;
const xRight = margin + cardWidth + gap;
const startY = margin;


   for (let index = 0; index < profiles.length; index++) {
  if (index > 0 && index % 2 === 0) {
    doc.addPage();
  }

  const isLeft = index % 2 === 0;
  const startX = isLeft ? xLeft : xRight;

  await drawAadhaarCard(
    doc,
    startX,     // X FIRST
    startY,     // Y SECOND
    cardWidth,
    cardHeight,
    index + 1,
    profiles[index]
  );
}
    doc.save("Profile.pdf");
}
