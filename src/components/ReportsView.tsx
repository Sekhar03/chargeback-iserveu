import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  RefreshCw 
} from 'lucide-react';
import { ChargebackRecord, UserType } from '../types';

interface ReportsViewProps {
  records?: ChargebackRecord[];
  onUpdateStatus?: (
    id: string,
    status: 'New' | 'Accepted' | 'Rejected' | 'Pending' | 'Approved' | 'Under Review' | 'Raised' | 'Partially Accepted',
    subStatus?: string,
    partialDetails?: {
      partialAmount?: number;
      partialReason?: string;
      partialEvidenceFiles?: string[];
      partialEvidenceRemarks?: string;
    }
  ) => void;
  userType?: UserType;
}

interface ReportItem {
  id: string;
  merchantName: string;
  date: string;
  reportType: string;
  category: string;
  recordCount: number;
  totalAmount: string;
  status: string;
}

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'REP-2026-0891',
    merchantName: 'Apex Retailers',
    date: '2026-07-28 14:30',
    reportType: 'Latest Report',
    category: 'Wallet Report',
    recordCount: 1420,
    totalAmount: '₹ 1,45,280.00',
    status: 'Generated',
  },
  {
    id: 'REP-2026-0890',
    merchantName: 'Nexus Enterprise',
    date: '2026-07-27 18:15',
    reportType: 'Latest Report',
    category: 'Wallet Report',
    recordCount: 980,
    totalAmount: '₹ 98,450.00',
    status: 'Generated',
  },
  {
    id: 'REP-2026-0888',
    merchantName: 'Global Tech Ltd',
    date: '2026-07-26 23:59',
    reportType: 'Latest Report',
    category: 'Wallet Report',
    recordCount: 2310,
    totalAmount: '₹ 2,12,000.00',
    status: 'Generated',
  },
  {
    id: 'REP-2026-0887',
    merchantName: 'All Merchants',
    date: '2026-07-25 11:20',
    reportType: 'Latest Report',
    category: 'Transaction Report',
    recordCount: 3120,
    totalAmount: '₹ 4,32,150.00',
    status: 'Generated',
  },
  {
    id: 'REP-2026-0886',
    merchantName: 'Star Retail Network',
    date: '2026-07-24 16:45',
    reportType: 'Historical Report',
    category: 'Settlement Report',
    recordCount: 1850,
    totalAmount: '₹ 1,89,600.00',
    status: 'Generated',
  },
  {
    id: 'REP-2026-0885',
    merchantName: 'All Merchants',
    date: '2026-07-23 09:30',
    reportType: 'Latest Report',
    category: 'Chargeback Report',
    recordCount: 420,
    totalAmount: '₹ 87,400.00',
    status: 'Generated',
  }
];

export const ReportsView: React.FC<ReportsViewProps> = () => {
  const [reportType, setReportType] = useState('Latest Report');
  const [selectedReportType, setSelectedReportType] = useState('Wallet Report');
  const [merchantNameFilter, setMerchantNameFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedReportType, setAppliedReportType] = useState('Wallet Report');

  const [reportsData, setReportsData] = useState<ReportItem[]>(INITIAL_REPORTS);

  const handleReset = () => {
    setReportType('Latest Report');
    setSelectedReportType('Wallet Report');
    setMerchantNameFilter('');
    setAppliedReportType('Wallet Report');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAppliedReportType(selectedReportType);

      if (merchantNameFilter.trim()) {
        const newReport: ReportItem = {
          id: `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          merchantName: merchantNameFilter.trim(),
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          reportType,
          category: selectedReportType,
          recordCount: Math.floor(500 + Math.random() * 2000),
          totalAmount: `₹ ${(Math.floor(50000 + Math.random() * 150000)).toLocaleString('en-IN')}.00`,
          status: 'Generated',
        };
        setReportsData(prev => [newReport, ...prev]);
      }
    }, 400);
  };

  const handleDownload = (reportId: string, category: string, merchant: string) => {
    const csvContent = `Report ID,Merchant Name,Category,Generated Date,Status\n${reportId},${merchant},${category},${new Date().toLocaleDateString()},Generated`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportId}_${category.replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter reports based on applied criteria
  const displayedReports = reportsData.filter(r => {
    if (appliedReportType && r.category.toLowerCase() !== appliedReportType.toLowerCase()) {
      return false;
    }
    if (merchantNameFilter.trim()) {
      const match = r.merchantName.toLowerCase().includes(merchantNameFilter.toLowerCase().trim());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="p-6 bg-[#fcfcfd] min-h-[calc(100vh-4rem)] space-y-6 font-sans">
      
      {/* Top Filter Card */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
            
            {/* Field 1: Report Type */}
            <div className="relative w-full sm:w-64">
              <fieldset className="border border-gray-300 rounded-lg px-3 pb-2 pt-0 focus-within:border-[#800000] focus-within:ring-1 focus-within:ring-[#800000] transition-all">
                <legend className="px-1 text-[11px] font-medium text-gray-500 font-sans">
                  Report Type
                </legend>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-gray-800 focus:outline-none cursor-pointer py-1"
                >
                  <option value="Latest Report">Latest Report</option>
                  <option value="Historical Report">Historical Report</option>
                  <option value="Custom Range">Custom Range</option>
                </select>
              </fieldset>
            </div>

            {/* Field 2: Select Report Type */}
            <div className="relative w-full sm:w-64">
              <fieldset className="border border-gray-300 rounded-lg px-3 pb-2 pt-0 focus-within:border-[#800000] focus-within:ring-1 focus-within:ring-[#800000] transition-all">
                <legend className="px-1 text-[11px] font-medium text-gray-500 font-sans">
                  Select Report Type
                </legend>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-gray-800 focus:outline-none cursor-pointer py-1"
                >
                  <option value="Wallet Report">Wallet Report</option>
                  <option value="Transaction Report">Transaction Report</option>
                  <option value="Settlement Report">Settlement Report</option>
                  <option value="Chargeback Report">Chargeback Report</option>
                </select>
              </fieldset>
            </div>

            {/* Field 3: Merchant Name */}
            <div className="relative w-full sm:w-64">
              <fieldset className="border border-gray-300 rounded-lg px-3 pb-2 pt-0 focus-within:border-[#800000] focus-within:ring-1 focus-within:ring-[#800000] transition-all">
                <legend className="px-1 text-[11px] font-medium text-gray-500 font-sans">
                  Merchant Name
                </legend>
                <input
                  type="text"
                  placeholder="Enter Merchant Name"
                  value={merchantNameFilter}
                  onChange={(e) => setMerchantNameFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-gray-800 focus:outline-none py-1"
                />
              </fieldset>
            </div>
          </div>

          {/* Action Buttons on Right */}
          <div className="flex items-center justify-end gap-3 shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-bold text-[#800000] hover:text-[#a00000] px-4 py-2 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-xs transition-colors flex items-center justify-center min-w-[90px] cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Submit</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Reports Table Card */}
      <div className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#800000]" />
            <h2 className="text-sm font-bold text-gray-900">
              Generated Reports ({displayedReports.length})
            </h2>
          </div>
          <span className="text-xs text-gray-500">
            Filtered by: <strong className="text-gray-800">{appliedReportType}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-bold text-xs border-b border-gray-200 uppercase tracking-wider whitespace-nowrap">
                <th className="py-4 px-6">Sl no.</th>
                <th className="py-4 px-6">Report ID</th>
                <th className="py-4 px-6">Merchant Name</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Generated Date</th>
                <th className="py-4 px-6">Total Records</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {displayedReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-400 italic">
                    No generated reports found matching the criteria.
                  </td>
                </tr>
              ) : (
                displayedReports.map((row, idx) => (
                  <tr key={row.id} className="bg-white hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-6 font-medium">{idx + 1}</td>
                    <td className="py-4 px-6 font-mono font-bold text-[#800000]">{row.id}</td>
                    <td className="py-4 px-6 font-semibold text-gray-900">{row.merchantName}</td>
                    <td className="py-4 px-6 text-gray-600">{row.reportType}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                        {row.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-500">{row.date}</td>
                    <td className="py-4 px-6 font-mono text-gray-700">{row.recordCount.toLocaleString()}</td>
                    <td className="py-4 px-6 font-bold text-gray-900">{row.totalAmount}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                        <span className="font-bold text-emerald-700">
                          {row.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDownload(row.id, row.category, row.merchantName)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#800000] hover:text-[#600000] hover:underline cursor-pointer"
                        title="Download CSV Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
