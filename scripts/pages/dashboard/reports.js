// pages/dashboard/reports.js
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const generatePDFReport = async () => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Header
  pdf.setFontSize(20);
  pdf.text(business.name, 105, 20, { align: 'center' });
  pdf.setFontSize(14);
  pdf.text('تقرير التقييمات', 105, 30, { align: 'center' });
  
  // Stats
  pdf.setFontSize(12);
  pdf.text(`إجمالي التقييمات: ${stats.totalFeedback}`, 20, 50);
  pdf.text(`متوسط التقييم: ${stats.averageRating.toFixed(1)}⭐`, 20, 60);
  pdf.text(`عدد الزيارات: ${stats.totalViews}`, 20, 70);
  
  // Chart (capture as image)
  const chartElement = document.getElementById('analytics-chart');
  const canvas = await html2canvas(chartElement);
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 20, 80, 170, 100);
  
  pdf.save(`report-${business.slug}-${Date.now()}.pdf`);
};
