import jsPDF from 'jspdf';

const generateInvoicePDF = ({
  invoiceNumber,
  billingDate,
  selectedCompany,
  streetName,
  cityName,
  selectedProvince,
  postalCode,
  REInput,
  rows,
  subtotal,
  GST,
  PST,
  PSTAmount,
  totalDue,
  comment
}) => {
  const doc = new jsPDF();

  // Colors
  const blueColor = [123, 175, 212]; // Updated blue color for the form
  const whiteColor = [255, 255, 255];
  const blackColor = [0, 0, 0];

  // Add Logo
  doc.addImage('/assets/wcaplogo.png', 'PNG', 10, 10, 50, 15); // Further reduced height

  // Company Address
  doc.setFontSize(12);
  doc.setTextColor(...blackColor);
  doc.setFont('helvetica', 'bold');
  doc.setFont('helvetica', 'normal');
  doc.text("Suite 3800, 525 - 8th Avenue SW", 10, 40);
  doc.text("Calgary, AB T2P 1G1", 10, 50);
  doc.text("TEL: 266-0767", 10, 60);
  doc.text("FAX: 266-6975", 10, 70);

  // Billing Date and Invoice Number Boxes
  doc.setFontSize(12);
  doc.setFillColor(...blueColor);
  doc.rect(120, 20, 30, 10, 'F'); // Billing Date box
  doc.rect(170, 20, 30, 10, 'F'); // Invoice# box
  doc.setTextColor(...whiteColor);
  doc.setFont('helvetica', 'bold'); // Make h3 text bold
  doc.text("Billing Date", 122, 27); // Centered in the blue box
  doc.text("Invoice#", 172, 27); // Centered in the blue box

  doc.setFillColor(...whiteColor);
  doc.setTextColor(...blackColor);
  doc.setFont('helvetica', 'normal');
  doc.rect(120, 30, 30, 10, 'F'); // Billing Date value box
  doc.rect(170, 30, 30, 10, 'F'); // Invoice# value box
  doc.setDrawColor(...blackColor);
  doc.rect(120, 20, 30, 20); // Border around Billing Date and its value
  doc.rect(170, 20, 30, 20); // Border around Invoice# and its value
  doc.text(billingDate, 122, 37); // Centered in the white box
  doc.text(invoiceNumber, 172, 37); // Centered in the white box

  // Billed To Section
  doc.setFontSize(14); // Reduced font size
  doc.setFont('helvetica', 'bold'); // Make h3 text bold
  doc.text("BILLED TO:", 10, 85);
  doc.setFontSize(12);
  doc.text(selectedCompany, 10, 95);
  doc.setFont('helvetica', 'normal');
  doc.text(streetName, 10, 105);
  doc.text(`${cityName}, ${selectedProvince}`, 10, 115);
  doc.text(postalCode, 10, 125);

  // RE Section
  doc.setFontSize(14); // Reduced font size
  doc.setFont('helvetica', 'bold'); // Make h3 text bold
  doc.text("RE:", 10, 135);
  doc.setFontSize(12);
  doc.text(REInput, 30, 135);

  // Invoice Table Header
  doc.setFontSize(12);
  doc.setFillColor(...blueColor);
  doc.setDrawColor(...blackColor);
  doc.setTextColor(...blackColor); // Set text color to black
  doc.rect(10, 150, 190, 10, 'F');
  doc.text('Quantity', 15, 157);
  doc.text('Item', 35, 157);
  doc.text('Description', 65, 157);
  doc.text('CC', 105, 157); // Adjusted spacing
  doc.text('Coding', 125, 157); // Adjusted spacing
  doc.text('Unit Price', 155, 157); // Adjusted spacing
  doc.text('Total', 185, 157); // Adjusted spacing

  // Invoice Table Rows
  doc.setTextColor(...blackColor); // Reset text color to black
  let y = 167;
  rows.forEach((row) => {
    doc.text(`${row.quantity}`, 15, y);
    doc.text(`${row.item}`, 35, y);
    doc.text(`${row.description}`, 65, y);
    doc.text(`${row.cc}`, 105, y); // Adjusted spacing
    doc.text(`${row.coding}`, 125, y); // Adjusted spacing
    doc.text(`${row.unitPrice}`, 155, y); // Adjusted spacing
    doc.text(`${(row.quantity * row.unitPrice).toFixed(2)}`, 185, y); // Adjusted spacing
    y += 10;
  });

  // Divider
  doc.setDrawColor(...blackColor);
  doc.line(10, y, 200, y);

  // Sub-total, GST, PST, and Total Due
  doc.setFontSize(12);
  y += 10;
  doc.text('SUB-TOTAL:', 140, y);
  doc.text(`$${subtotal}`, 190, y);
  y += 10;
  doc.text('GST (5%):', 140, y);
  doc.text(`$${GST}`, 190, y);
  y += 10;
  doc.text(`PST (${(PST * 100).toFixed(2)}%):`, 140, y); // Dynamic PST value
  doc.text(`$${PSTAmount}`, 190, y);

  // Total Due Boxes
  y += 10;
  doc.setFillColor(...blueColor);
  doc.rect(140, y, 30, 10, 'F'); // Total Due box
  doc.setTextColor(...whiteColor);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DUE:', 142, y + 7); // Centered in the blue box

  doc.setFillColor(...whiteColor);
  doc.setTextColor(...blackColor);
  doc.setFont('helvetica', 'normal');
  doc.rect(170, y, 30, 10, 'F'); // Total Due value box
  doc.setDrawColor(...blackColor);
  doc.rect(140, y, 60, 10); // Border around Total Due and its value
  doc.text(`$${totalDue}`, 172, y + 7); // Centered in the white box

  // Comments
  y += 20;
  doc.setFontSize(12);
  doc.text('Comments:', 10, y);
  doc.setFontSize(10);
  doc.rect(10, y + 5, 190, 20); // Comments box
  doc.text(comment, 15, y + 15, { maxWidth: 180 });

  // Divider
  y += 40;
  doc.setDrawColor(...blackColor);
  doc.line(10, y, 200, y);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150); // Lighter opacity
  doc.text('Whitecap Resources', 105, y + 10, { align: 'center' }); // Centered text

  return doc.output('blob');
};

export default generateInvoicePDF;
