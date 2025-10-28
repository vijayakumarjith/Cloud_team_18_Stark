import jsPDF from 'jspdf';

interface CertificateData {
  facultyName: string;
  activityTitle: string;
  activityType: string;
  duration: string;
  date: string;
  score: number;
  certificateId: string;
}

export const generateCertificate = async (data: CertificateData): Promise<Blob> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background gradient effect (using rectangles)
  pdf.setFillColor(240, 240, 250);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Border
  pdf.setDrawColor(139, 92, 246);
  pdf.setLineWidth(2);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  pdf.setDrawColor(167, 139, 250);
  pdf.setLineWidth(0.5);
  pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Logo/Icon placeholder (decorative circle)
  pdf.setFillColor(139, 92, 246);
  pdf.circle(pageWidth / 2, 30, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FDP', pageWidth / 2, 32, { align: 'center' });

  // Title
  pdf.setTextColor(139, 92, 246);
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CERTIFICATE OF ACHIEVEMENT', pageWidth / 2, 55, { align: 'center' });

  // Subtitle
  pdf.setTextColor(100, 100, 120);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is to certify that', pageWidth / 2, 70, { align: 'center' });

  // Faculty Name
  pdf.setTextColor(30, 30, 50);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.facultyName.toUpperCase(), pageWidth / 2, 85, { align: 'center' });

  // Activity details
  pdf.setTextColor(100, 100, 120);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('has successfully completed', pageWidth / 2, 95, { align: 'center' });

  // Activity title
  pdf.setTextColor(30, 30, 50);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const maxWidth = pageWidth - 60;
  const titleLines = pdf.splitTextToSize(data.activityTitle, maxWidth);
  pdf.text(titleLines, pageWidth / 2, 105, { align: 'center' });

  // Type and Duration
  const yOffset = 105 + (titleLines.length * 7);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 120);
  pdf.text(`Activity Type: ${data.activityType} | Duration: ${data.duration}`, pageWidth / 2, yOffset + 10, { align: 'center' });

  // Score box
  pdf.setFillColor(139, 92, 246);
  pdf.roundedRect(pageWidth / 2 - 25, yOffset + 18, 50, 15, 3, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${data.score} Points`, pageWidth / 2, yOffset + 28, { align: 'center' });

  // Date and Certificate ID
  pdf.setTextColor(100, 100, 120);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date: ${data.date}`, 30, pageHeight - 25);
  pdf.text(`Certificate ID: ${data.certificateId}`, pageWidth - 30, pageHeight - 25, { align: 'right' });

  // Signature line
  pdf.setDrawColor(100, 100, 120);
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 2 - 30, pageHeight - 35, pageWidth / 2 + 30, pageHeight - 35);
  pdf.setFontSize(10);
  pdf.text('Authorized Signature', pageWidth / 2, pageHeight - 30, { align: 'center' });

  return pdf.output('blob');
};

export const downloadCertificate = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
