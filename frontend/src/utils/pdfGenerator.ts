export function generateValidPDFBlob(reportName: string, reportId: string, dateRange: string): Blob {
  const title = `RecoverAI ${reportName}`;
  const timestamp = new Date().toLocaleString();

  const streamContent = `
BT
/F1 18 Tf
50 740 Td
(${escapePdfText(title)}) Tj
ET
BT
/F1 10 Tf
50 715 Td
(Report ID: ${escapePdfText(reportId)}  |  Horizon: ${escapePdfText(dateRange)}  |  Generated: ${escapePdfText(timestamp)}) Tj
ET
BT
/F1 14 Tf
50 670 Td
(Executive Financial Summary) Tj
ET
BT
/F1 11 Tf
50 645 Td
(Total Revenue at Risk: Rs 24,85,000) Tj
0 -20 Td
(Potential Recovery Capital: Rs 16,40,000) Tj
0 -20 Td
(Recovery Opportunity Score: 68.4%) Tj
0 -20 Td
(Successfully Recovered Capital: Rs 12,40,000) Tj
ET
BT
/F1 14 Tf
50 540 Td
(Key Failure Diagnostics & Insights) Tj
ET
BT
/F1 10 Tf
50 515 Td
(1. Peak UPI Gateway Timeouts between 19:00 - 22:00 IST accounted for 23% of revenue loss.) Tj
0 -18 Td
(2. Issuer bank decline recovery probability estimated at 78% via off-peak retries.) Tj
0 -18 Td
(3. HDFC, SBI, and ICICI card failure queues represent Rs 15.7L in recoverable volume.) Tj
0 -18 Td
(4. Instant email recovery notifications increased customer quick-pay conversion by 34%.) Tj
ET
BT
/F1 9 Tf
50 50 Td
(RecoverAI Intelligence Engine - Confidential Merchant Report) Tj
ET
`.trim();

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamContent.length} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
425
%%EOF`;

  return new Blob([pdfString], { type: 'application/pdf' });
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function generateValidCSVBlob(reportName: string, reportId: string, dateRange: string): Blob {
  const csvData = [
    ['Report ID', 'Report Name', 'Date Range', 'Metric', 'Value'],
    [reportId, reportName, dateRange, 'Total Revenue at Risk (INR)', '2485000'],
    [reportId, reportName, dateRange, 'Potential Recovery (INR)', '1640000'],
    [reportId, reportName, dateRange, 'Recovery Opportunity Rate (%)', '68.4'],
    [reportId, reportName, dateRange, 'Recovered Capital (INR)', '1240000'],
    [reportId, reportName, dateRange, 'Top Bank Decline Reason', 'Bank Gateway Timeout (TIM-91)'],
    [reportId, reportName, dateRange, 'Peak Failure Window', '19:00 - 22:00 IST']
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  return new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
}
