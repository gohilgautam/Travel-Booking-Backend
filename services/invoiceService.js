const PDFDocument = require('pdfkit');
const path = require('path');

/**
 * Generate a professional, premium-grade invoice PDF
 * @param {Object} booking - Booking details
 * @param {Object} payment - Payment details
 * @returns {Promise<Buffer>} - PDF buffer
 */
exports.generateInvoice = async (booking, payment) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `Invoice - ${booking._id}`,
          Author: 'Travelora',
        }
      });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // --- Premium Color Palette ---
      const colors = {
        primary: '#007bff',
        secondary: '#6c757d',
        textDark: '#1a1d23',
        textLight: '#ffffff',
        border: '#e9ecef',
        bgLight: '#f8f9fa',
        paidGreen: '#28a745'
      };

      // --- 1. Top Decorative Bar ---
      doc.rect(0, 0, 612, 15).fill(colors.primary);

      // --- 2. Header Section ---
      // Logo
      try {
        const logoPath = path.join('C:', 'Users', 'Pc', 'Desktop', 'Travel Booking-2', 'Travel-Booking-WebApp-Frontend-', 'Frontend', 'Logo', 'favicon.png');
        doc.image(logoPath, 40, 40, { height: 50 }); // Scaled down for elegance
      } catch (err) {
        doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(35).text('T', 40, 45);
      }

      // Title & Basic Info
      doc
        .fillColor(colors.textDark)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', 350, 45, { align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(colors.secondary)
        .text(`Invoice Number: `, 350, 75, { width: 100, align: 'right' })
        .fillColor(colors.textDark)
        .font('Helvetica-Bold')
        .text(`INV-${payment._id.toString().slice(-6).toUpperCase()}`, 455, 75, { align: 'right' })

        .font('Helvetica')
        .fillColor(colors.secondary)
        .text(`Date: `, 350, 90, { width: 100, align: 'right' })
        .fillColor(colors.textDark)
        .text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), 455, 90, { align: 'right' });

      // --- 3. Status Badge ---
      doc
        .save()
        .translate(500, 115)
        .rotate(0)
        .rect(0, 0, 70, 20, 4)
        .fill(colors.paidGreen)
        .fillColor(colors.textLight)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('PAID', 0, 5, { width: 70, align: 'center' })
        .restore();

      doc.moveDown(4);
      const startY = 160;

      // --- 4. Billing Details Grid ---
      // Background for address section
      doc.rect(40, startY - 10, 532, 100).fill(colors.bgLight);

      doc.fillColor(colors.textDark);
      // Sender (From)
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('ISSUED BY:', 60, startY)
        .font('Helvetica')
        .text('Travelora Agencies Pvt Ltd', 60, startY + 15)
        .fontSize(9)
        .fillColor(colors.secondary)
        .text('123 Galactic Plaza, Andheri East', 60, startY + 30)
        .text('Mumbai, MH - 400001', 60, startY + 42)
        .text('Email: billing@travelora.com', 60, startY + 54)
        .text('GSTIN: 27AABCU1234F1Z5', 60, startY + 66);

      // Receiver (To)
      doc
        .fillColor(colors.textDark)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('BILL TO:', 350, startY)
        .font('Helvetica')
        .text(booking.user.name, 350, startY + 15)
        .fontSize(9)
        .fillColor(colors.secondary)
        .text(booking.user.email, 350, startY + 30)
        .text(booking.user.phone || 'N/A', 350, startY + 42)
        .text('Location: India', 350, startY + 54);

      // --- 5. Trip Summary Header ---
      doc.moveDown(8);
      const tripY = doc.y;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(colors.primary)
        .text('TRIP OVERVIEW', 40, tripY);

      doc.moveTo(40, tripY + 15).lineTo(572, tripY + 15).strokeColor(colors.border).lineWidth(1).stroke();

      // --- 6. Items Table ---
      const tableTop = tripY + 30;

      // Table Header
      doc.rect(40, tableTop, 532, 25).fill(colors.primary);
      doc
        .fillColor(colors.textLight)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('BOOKING DESCRIPTION', 55, tableTop + 8)
        .text('UNIT PRICE', 320, tableTop + 8, { width: 80, align: 'right' })
        .text('TRAVELLERS', 410, tableTop + 8, { width: 70, align: 'center' })
        .text('TOTAL (INR)', 490, tableTop + 8, { width: 70, align: 'right' });

      // Table Row
      const rowY = tableTop + 25;
      doc.rect(40, rowY, 532, 60).fill('#ffffff').stroke(colors.border);

      doc
        .fillColor(colors.textDark)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(booking.package?.title || 'Adventure Package', 55, rowY + 15)
        .fontSize(8)
        .font('Helvetica')
        .fillColor(colors.secondary)
        .text(`Destination: ${booking.package?.destination || 'N/A'}`, 55, rowY + 30)
        .text(`Travel Date: ${new Date(booking.travelDate).toLocaleDateString('en-IN')}`, 55, rowY + 42)

        .fillColor(colors.textDark)
        .fontSize(9)
        .text((booking.totalAmount / booking.numberOfTravelers).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 320, rowY + 15, { width: 80, align: 'right' })
        .text(booking.numberOfTravelers.toString(), 410, rowY + 15, { width: 70, align: 'center' })
        .text(booking.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 490, rowY + 15, { width: 70, align: 'right' });

      // --- 7. Payment Summary ---
      const summaryY = rowY + 80;
      const summaryX = 350;

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(colors.secondary)
        .text('Base Amount:', summaryX, summaryY)
        .fillColor(colors.textDark)
        .text(`INR ${booking.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 470, summaryY, { align: 'right' })

        .fillColor(colors.secondary)
        .text('GST (Inclusive):', summaryX, summaryY + 18)
        .fillColor(colors.textDark)
        .text('INR 0.00', 470, summaryY + 18, { align: 'right' })

        .fillColor(colors.secondary)
        .text('Discount:', summaryX, summaryY + 36)
        .fillColor(colors.textDark)
        .text('INR 0.00', 470, summaryY + 36, { align: 'right' });

      // Total Line
      doc.moveTo(summaryX, summaryY + 55).lineTo(572, summaryY + 55).strokeColor(colors.border).lineWidth(1).stroke();

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(colors.primary)
        .text('NET AMOUNT:', summaryX, summaryY + 65)
        .text(`₹ ${booking.totalAmount.toLocaleString('en-IN')}`, 470, summaryY + 65, { align: 'right' });

      // --- 8. Payment Proof ---
      const proofY = summaryY + 20;
      doc
        .rect(40, proofY, 250, 80)
        .fill(colors.bgLight);

      doc
        .fillColor(colors.textDark)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('TRANSACTION PROOF', 55, proofY + 10)
        .font('Helvetica')
        .fontSize(8)
        .fillColor(colors.secondary)
        .text(`Gateway: Razorpay`, 55, proofY + 25)
        .text(`Transaction ID: ${payment.razorpayPaymentId || 'N/A'}`, 55, proofY + 37)
        .text(`Booking Ref: ${booking._id.toString().toUpperCase()}`, 55, proofY + 49)
        .text(`Payment Date: ${new Date(payment.createdAt).toLocaleString()}`, 55, proofY + 61);

      // --- 9. Footer ---
      const footerY = 780;
      doc.rect(0, footerY, 612, 60).fill(colors.textDark);

      doc
        .fillColor(colors.textLight)
        .fontSize(8)
        .font('Helvetica')
        .text('Terms & Conditions:', 40, footerY + 15)
        .text('This is a computer-generated invoice and does not require a physical signature.', 40, footerY + 25)
        .text('For any queries, contact support@travelora.com or call +91-1800-123-456.', 40, footerY + 35)
        .text('Enjoy your journey with Travelora!', 400, footerY + 25, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};