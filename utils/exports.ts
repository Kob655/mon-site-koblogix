import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { formatPrice } from '../utils';

export const exportToExcel = async (transactions: Transaction[], period: 'week' | 'month' | 'all' = 'all') => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Rapport KOBLOGIX', {
    views: [{ showGridLines: false }]
  });

  // --- FILTRAGE PAR DATE ---
  const now = new Date();
  let filteredTransactions = transactions;
  let periodLabel = "GLOBAL (TOUT)";

  if (period === 'week') {
      // Début de semaine (Lundi)
      const day = now.getDay(); // 0 (Dim) - 6 (Sam)
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
      const monday = new Date(now.setDate(diff));
      monday.setHours(0,0,0,0);
      
      filteredTransactions = transactions.filter(t => new Date(t.date) >= monday);
      periodLabel = "CETTE SEMAINE";
  } else if (period === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= firstDay);
      periodLabel = "CE MOIS";
  }

  // Styles
  sheet.mergeCells('B2:H6');
  const headerCell = sheet.getCell('B2');
  headerCell.value = `KOBLOGIX\nServices & Formation LaTeX\nRAPPORT : ${periodLabel}\nGénéré le ` + new Date().toLocaleDateString();
  headerCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF2C3E50' } };
  headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } };
  headerCell.border = { top: { style: 'medium', color: { argb: 'FF0077B6' } }, bottom: { style: 'medium', color: { argb: 'FF0077B6' } }, left: { style: 'medium', color: { argb: 'FF0077B6' } }, right: { style: 'medium', color: { argb: 'FF0077B6' } } };

  // Calculs sur les données filtrées
  const totalRevenue = filteredTransactions.filter(t => t.status === 'approved').reduce((acc, t) => acc + t.amount, 0);
  const pendingCount = filteredTransactions.filter(t => t.status === 'pending').length;
  const approvedCount = filteredTransactions.filter(t => t.status === 'approved').length;

  // Table Stats
  sheet.getCell('B8').value = "1. SYNTHÈSE PÉRIODE";
  sheet.getCell('B8').font = { size: 14, bold: true, color: { argb: 'FF0077B6' } };

  sheet.addTable({
    name: 'StatsTable',
    ref: 'B9',
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: [{ name: 'Indicateur' }, { name: 'Valeur' }],
    rows: [
      ['Chiffre d\'Affaires Validé', totalRevenue],
      ['Volume Transactions', filteredTransactions.length],
      ['Commandes Validées', approvedCount],
      ['Commandes En Attente', pendingCount]
    ],
  });
  sheet.getCell('C10').numFmt = '#,##0 "FCFA"';

  // Table Detailed
  const startRowDetailed = 16;
  sheet.getCell(`B${startRowDetailed - 1}`).value = "2. DÉTAIL DES TRANSACTIONS";
  sheet.getCell(`B${startRowDetailed - 1}`).font = { size: 14, bold: true, color: { argb: 'FF0077B6' } };

  const detailedRows = filteredTransactions.map(t => [
      t.id, t.date, t.name, t.phone, t.paymentRef || '-', t.method.toUpperCase(), t.items.map(i => i.name).join(' + '), t.amount, t.status.toUpperCase(), t.code || '-'
  ]);

  if (detailedRows.length > 0) {
      sheet.addTable({
        name: 'TransactionsTable',
        ref: `B${startRowDetailed}`,
        headerRow: true,
        totalsRow: true,
        style: { theme: 'TableStyleMedium9', showRowStripes: true },
        columns: [
          { name: 'ID', filterButton: true },
          { name: 'Date', filterButton: true },
          { name: 'Client', filterButton: true },
          { name: 'Téléphone', filterButton: true },
          { name: 'Ref Paiement', filterButton: true },
          { name: 'Méthode', filterButton: true },
          { name: 'Détails Commande', filterButton: true },
          { name: 'Montant', filterButton: true, totalsRowFunction: 'sum' },
          { name: 'Statut', filterButton: true },
          { name: 'Code Accès', filterButton: true },
        ],
        rows: detailedRows,
      });

      sheet.getColumn('B').width = 10;
      sheet.getColumn('D').width = 25;
      sheet.getColumn('H').width = 40;
      sheet.getColumn('I').width = 15;
      
      const amountColIndex = 9;
      for(let i=startRowDetailed + 1; i<=startRowDetailed + detailedRows.length + 1; i++) {
          sheet.getCell(i, amountColIndex).numFmt = '#,##0 "FCFA"';
      }
  } else {
      sheet.getCell(`B${startRowDetailed}`).value = "Aucune transaction sur cette période.";
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KOBLOGIX_EXPORT_${periodLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const generateReceipt = (transaction: Transaction) => {
  const doc = new jsPDF();
  
  // --- 1. DESSIN DU LOGO (VECTORIEL) ---
  // Fond bleu logo
  doc.setFillColor(0, 119, 182); // Primary
  doc.roundedRect(15, 15, 15, 15, 3, 3, 'F');
  // Lettre K
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("K", 18.5, 26);

  // --- 2. EN-TÊTE ---
  // Nom Entreprise
  doc.setTextColor(44, 62, 80);
  doc.setFontSize(22);
  doc.text("KOBLOGIX", 35, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Services de Rédaction Scientifique & Formation", 35, 28);

  // Titre "REÇU" à droite
  doc.setFillColor(240, 248, 255); // Light Blue bg
  doc.rect(130, 15, 65, 20, 'F');
  doc.setTextColor(0, 119, 182);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("REÇU DE PAIEMENT", 162.5, 23, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`# ${transaction.id}`, 162.5, 29, { align: "center" });

  // --- 3. INFORMATIONS (2 Colonnes) ---
  const yInfo = 50;
  
  // Emetteur (Koblogix)
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("ÉMETTEUR", 15, yInfo);
  doc.setDrawColor(0, 119, 182);
  doc.setLineWidth(0.5);
  doc.line(15, yInfo + 2, 80, yInfo + 2);
  
  doc.setTextColor(50);
  doc.setFont("helvetica", "bold");
  doc.text("KOBLOGIX TOGO", 15, yInfo + 8);
  doc.setFont("helvetica", "normal");
  doc.text("Lomé, Togo", 15, yInfo + 13);
  doc.text("+228 98 28 65 41", 15, yInfo + 18);
  doc.text("Koblogixofficiel@gmail.com", 15, yInfo + 23);

  // Client
  doc.setTextColor(150);
  doc.text("CLIENT", 110, yInfo);
  doc.line(110, yInfo + 2, 195, yInfo + 2);
  
  doc.setTextColor(50);
  doc.setFont("helvetica", "bold");
  doc.text(transaction.name, 110, yInfo + 8);
  doc.setFont("helvetica", "normal");
  doc.text(transaction.email || "Email non renseigné", 110, yInfo + 13);
  doc.text(transaction.phone, 110, yInfo + 18);
  doc.text(`Réf. Paiement: ${transaction.paymentRef || 'N/A'}`, 110, yInfo + 23);

  // --- 4. TABLEAU DES ARTICLES ---
  const tableColumn = ["Désignation", "Type", "Prix Total"];
  const tableRows: any[] = [];

  transaction.items.forEach(item => {
    tableRows.push([
      item.name + (item.details ? `\n(${item.details})` : ''),
      item.type.toUpperCase().replace('_', ' '),
      formatPrice(item.price)
    ]);
  });

  autoTable(doc, {
    startY: yInfo + 35,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
        fillColor: [0, 119, 182], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
    },
    columnStyles: {
        0: { cellWidth: 100 },
        2: { halign: 'right', fontStyle: 'bold' }
    },
    styles: { cellPadding: 3, fontSize: 10, valign: 'middle' },
    alternateRowStyles: { fillColor: [245, 250, 255] }
  });

  // --- 5. TOTAUX & TAMPON ---
  // @ts-ignore
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Zone Totale à droite
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(110, finalY, 85, 25, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Méthode:", 115, finalY + 8);
  doc.text(transaction.method.toUpperCase(), 190, finalY + 8, { align: 'right' });
  
  doc.text("Date:", 115, finalY + 14);
  doc.text(transaction.date, 190, finalY + 14, { align: 'right' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 119, 182);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", 115, finalY + 21);
  doc.text(formatPrice(transaction.amount), 190, finalY + 21, { align: 'right' });

  // Tampon "PAYÉ" (Effet visuel)
  if (transaction.status === 'approved') {
      doc.setDrawColor(34, 197, 94); // Green
      doc.setTextColor(34, 197, 94);
      doc.setLineWidth(1);
      doc.roundedRect(20, finalY + 5, 40, 15, 2, 2, 'D');
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("PAYÉ", 40, finalY + 14, { align: "center", angle: 15 });
  }

  // Code d'accès si disponible
  if (transaction.code) {
      finalY += 35;
      doc.setFillColor(255, 247, 237); // Light Orange
      doc.setDrawColor(251, 146, 60);
      doc.roundedRect(15, finalY, 180, 20, 2, 2, 'FD');
      
      doc.setTextColor(194, 65, 12);
      doc.setFontSize(10);
      doc.text("CODE D'ACCÈS GÉNÉRÉ (Temporaire) :", 25, finalY + 13);
      doc.setFontSize(14);
      doc.setFont("courier", "bold");
      doc.text(transaction.code, 150, finalY + 13, { align: 'right' });
  }

  // --- 6. PIED DE PAGE ---
  const footerY = 280;
  doc.setDrawColor(200);
  doc.line(15, footerY, 195, footerY);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont("helvetica", "normal");
  doc.text("Ce reçu est généré électroniquement par la plateforme KOBLOGIX.", 105, footerY + 5, { align: "center" });
  doc.text("Merci de votre confiance.", 105, footerY + 9, { align: "center" });

  doc.save(`Reçu_KOBLOGIX_${transaction.id}.pdf`);
};