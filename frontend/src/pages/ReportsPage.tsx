import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Sparkles, 
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { generateValidPDFBlob, generateValidCSVBlob } from '../utils/pdfGenerator';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('Revenue Recovery Report');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [format, setFormat] = useState('PDF');
  const [generating, setGenerating] = useState(false);
  const [previewReport, setPreviewReport] = useState<any | null>(null);

  const reportOptions = [
    { id: 'Revenue Recovery Report', label: 'Revenue Recovery Report', desc: 'Comprehensive audit of recovered revenue vs lost opportunities.' },
    { id: 'Payment Failure Analysis', label: 'Payment Failure Analysis', desc: 'Detailed diagnostic breakdown of issuer bank decline codes and gateway timeouts.' },
    { id: 'Weekly Business Summary', label: 'Weekly Business Summary', desc: 'Executive overview designed for finance directors and C-level stakeholders.' },
    { id: 'High Priority Transaction Report', label: 'High Priority Queue Audit', desc: 'List of high-value transactions requiring urgent manual operational outreach.' },
  ];

  const [history, setHistory] = useState([
    { id: 'REP-20260821-01', name: 'Revenue Recovery Report', range: 'Last 30 Days', format: 'PDF', date: 'Today, 14:30', size: '2.4 MB' },
    { id: 'REP-20260814-04', name: 'Payment Failure Analysis', range: 'Last 7 Days', format: 'CSV', date: 'Aug 14, 2026', size: '840 KB' },
    { id: 'REP-20260807-02', name: 'Weekly Business Summary', range: 'Last 30 Days', format: 'PDF', date: 'Aug 07, 2026', size: '1.8 MB' },
  ]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const newRep = {
        id: `REP-${Date.now().toString().slice(-6)}`,
        name: reportType,
        range: dateRange,
        format: format,
        date: 'Just now',
        size: format === 'PDF' ? '2.1 MB' : '650 KB'
      };
      setHistory([newRep, ...history]);
      setPreviewReport(newRep);
    }, 1200);
  };

  const triggerDownload = (rep: any) => {
    const isPdf = (rep.format || 'PDF').toUpperCase() === 'PDF';
    const blob = isPdf 
      ? generateValidPDFBlob(rep.name, rep.id, rep.range)
      : generateValidCSVBlob(rep.name, rep.id, rep.range);

    const ext = isPdf ? 'pdf' : 'csv';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rep.name.toLowerCase().replace(/\s+/g, '_')}_${rep.id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Intelligence Reports Generator
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Export automated PDF executive summaries and CSV datasets for finance and payment operations teams.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REPORT GENERATOR FORM (2 COLUMNS) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>Configure parameters to generate custom business reports</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Report Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reportOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setReportType(opt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      reportType === opt.id
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range & Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Date Horizon</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="Year to Date">Year to Date</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Export Format</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('PDF')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      format === 'PDF' 
                        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-rose-500" /> PDF Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('CSV')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      format === 'CSV' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> CSV Dataset
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                loading={generating}
                onClick={handleGenerate}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Compile & Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* REPORT HISTORY (1 COLUMN) */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Reports Log</CardTitle>
              <CardDescription>Previously compiled executive reports</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((rep) => (
                <div key={rep.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {rep.format === 'PDF' ? (
                        <FileText className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {rep.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {rep.range} • {rep.size} • {rep.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewReport(rep)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700"
                      title="Preview Report"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => triggerDownload(rep)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REPORT PREVIEW MODAL */}
      <Modal
        isOpen={!!previewReport}
        onClose={() => setPreviewReport(null)}
        title={previewReport ? previewReport.name : ''}
        maxWidth="lg"
      >
        {previewReport && (
          <div className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">RecoverAI Executive Briefing</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Report ID: {previewReport.id} • {previewReport.range}</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono font-semibold">
                {previewReport.format}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 text-[10px]">Revenue at Risk</span>
                <div className="font-bold text-sm text-rose-600 dark:text-rose-400 font-mono mt-0.5">₹24,85,000</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 text-[10px]">Potential Recovery</span>
                <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">₹16,40,000</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 text-[10px]">Opportunity Score</span>
                <div className="font-bold text-sm text-blue-600 dark:text-blue-400 font-mono mt-0.5">68%</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-slate-100">Key Executive Takeaways:</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                <li>UPI gateway timeouts between 19:00 - 22:00 IST accounted for 23% of weekly revenue leakage.</li>
                <li>HDFC and SBI bank declines represented ₹15.7L in recoverable volume.</li>
                <li>Automated off-peak retries achieved an estimated 78% conversion recovery.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewReport(null)}>
                Close Preview
              </Button>
              <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => triggerDownload(previewReport)}>
                Download {previewReport.format}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
