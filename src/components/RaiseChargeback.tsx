import React, { useState, useRef } from 'react';
import { Download, Upload as UploadIcon, X, FileSpreadsheet, AlertCircle, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SAMPLE_BULK_EXCEL_DATA } from '../data/mockDisputes';

interface RaiseChargebackProps {
  onBack: () => void;
  onUploadSuccess: (fileRecords: any[]) => void;
  chargebacks: any[];
}

export const RaiseChargeback: React.FC<RaiseChargebackProps> = ({
  onBack,
  onUploadSuccess,
  chargebacks,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for post-upload feedback report
  const [isProcessed, setIsProcessed] = useState(false);
  const [processedResults, setProcessedResults] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, success: 0, failed: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // 100 MB Limit Check
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('File size exceeds the limit of 100 MB. Please choose a smaller file.');
      setSelectedFile(null);
      setParsedRows([]);
      return;
    }

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrorMessage('Please select a valid Excel or CSV file (.xlsx, .xls, .csv)');
      setSelectedFile(null);
      setParsedRows([]);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setIsProcessed(false); // Reset processed report state if new file is selected

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // 5000 Records Check
        if (data.length > 5000) {
          setErrorMessage('File contains too many records. Users can upload up to 5000 records in a single upload.');
          setSelectedFile(null);
          setParsedRows([]);
          return;
        }

        setParsedRows(data);
      } catch (err) {
        console.error('Error parsing file:', err);
        setErrorMessage('Failed to parse the file format. Please check file formatting.');
        setParsedRows([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setErrorMessage(null);
    setIsProcessed(false);
    setProcessedResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadSample = () => {
    const worksheet = XLSX.utils.json_to_sheet(SAMPLE_BULK_EXCEL_DATA);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bulk_Chargebacks');
    XLSX.writeFile(workbook, 'Dispute_Sample_Format.xlsx');
  };

  const handleUploadClick = () => {
    if (!selectedFile || parsedRows.length === 0) {
      setErrorMessage('Please browse and select a valid excel file first.');
      return;
    }

    // Process rows to compute success/failure metrics
    const results: any[] = [];
    const successfulRecordsToPass: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    const seenRRNsInBatch = new Set<string>();
    const existingRRNs = new Set(chargebacks.map(cb => String(cb.rrn).trim()));

    parsedRows.forEach((row, idx) => {
      let uploadStatus = 'Success';
      let remark = 'Successfully Processed';

      // Accept both exact key and fallback versions
      const rrn = String(row["RRN"] || row["RRN_Number"] || "").trim();
      const txnamount = row["Txnamount"] || row["Dispute_Amount"] || "";
      const product = String(row["Product"] || row["Card_Network"] || "UPI").trim();
      const rawAdj = String(row["Adjtype"] || row["Reason_Description"] || "Chargeback").trim().toLowerCase();
      let adjtype = "Chargeback";
      if (rawAdj.includes("pre")) {
        adjtype = "Pre-Arbitration";
      } else if (rawAdj.includes("arbitration")) {
        adjtype = "Arbitration";
      }

      if (!rrn) {
        uploadStatus = 'Failed';
        remark = 'invalid RRN / missing RRN';
      } else if (seenRRNsInBatch.has(rrn)) {
        uploadStatus = 'Failed';
        remark = 'duplicate entry in batch';
      } else if (existingRRNs.has(rrn)) {
        uploadStatus = 'Failed';
        remark = 'duplicate entry';
      } else if (!txnamount || isNaN(Number(txnamount))) {
        uploadStatus = 'Failed';
        remark = 'invalid dispute amount';
      }

      seenRRNsInBatch.add(rrn);

      if (uploadStatus === 'Success') {
        successCount++;
        successfulRecordsToPass.push({
          id: `CB-2026-00${chargebacks.length + successfulRecordsToPass.length + 1}`,
          rrn: rrn,
          merchantId: row["Merchant_Id"] || 'NSDL_MER_9042',
          merchantName: row["Beneficiery"] || 'Bulk Uploaded Merchant',
          transactionDate: row["Txndate"] || row["Transaction_Date"] || '2026-07-28',
          disputeDate: '2026-07-28',
          amount: Number(txnamount),
          reasonCode: row["Adjtype"] ? String(row["Adjtype"]).slice(0, 4) : '4853',
          reasonDescription: adjtype,
          status: 'New',
          subStatus: adjtype === 'Pre-Arbitration' ? 'Pre-Arbitration New' : 'Chargeback New',
          cardNetwork: 'UPI',
          terminalId: String(row["Terminalid"] || row["Terminal_Id"] || 'TM-88210'),
          customerMobile: String(row["Ben_Mobile_No"] || row["Customer_Mobile"] || '+91 98765 43210'),
        });
      } else {
        failedCount++;
      }

      results.push({
        ...row,
        "Upload Status": uploadStatus,
        "Remarks": remark
      });
    });

    setProcessedResults(results);
    setMetrics({
      total: parsedRows.length,
      success: successCount,
      failed: failedCount
    });
    setIsProcessed(true);

    // Pass the successfully processed records up to the main app state
    if (successCount > 0) {
      onUploadSuccess(successfulRecordsToPass);
    }
  };

  const handleDownloadOutputResponseFile = () => {
    if (processedResults.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(processedResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Output_Response_Report');
    XLSX.writeFile(workbook, `Output_Response_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onBack}
          className="text-gray-800 hover:text-[#800000] transition-colors focus:outline-none cursor-pointer"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Raise Chargeback - Bulk Dispute Upload
        </h1>
      </div>

      {/* Main Upload / Metrics Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left side: Upload Card */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-8 flex flex-col justify-between shadow-xs min-h-[460px]">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Center File Box Section */}
          <div className="flex flex-col items-center justify-center space-y-6 py-4 my-auto">
            {/* Microsoft Excel 3D Icon Container */}
            <div className="w-40 h-32 border border-gray-200 bg-gray-50/50 rounded-xl flex items-center justify-center relative shadow-inner">
              <div className="flex items-center gap-2">
                <div className="w-16 h-20 bg-[#D38B88]/90 rounded-md shadow-md flex items-center justify-center relative overflow-hidden border border-[#B86B68]">
                  <div className="absolute top-0 right-0 w-5 h-5 bg-rose-200/40 rounded-bl-md"></div>
                  <span className="text-white font-extrabold text-3xl font-sans tracking-widest drop-shadow-sm">
                    X
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Browse and Reset */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBrowseClick}
                className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-6 py-2.5 rounded transition-colors shadow-xs cursor-pointer"
              >
                Browse File
              </button>
              <button
                onClick={handleReset}
                className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-xs px-6 py-2.5 rounded transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* File instruction text */}
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500 font-medium tracking-tight">
                Upload Excel / CSV format file <span className="text-gray-400 font-mono">(Dispute_Sample_Format.xlsx)*</span>
              </p>
              <p className="text-[10px] text-gray-400">
                Max File Size: 100 MB. Max Records: 5000 rows.
              </p>
            </div>

            {/* Download Sample File Option */}
            <button
              onClick={handleDownloadSample}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer border border-gray-200"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              <span>Download Sample File</span>
            </button>

            {/* Selected File Status Badge */}
            {selectedFile && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-2.5 flex items-center gap-3 text-xs w-full max-w-sm justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold truncate">{selectedFile.name}</span>
                  <span className="text-[10px] text-emerald-600 font-mono shrink-0">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-emerald-700 hover:text-emerald-900 focus:outline-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 flex items-center gap-2 text-xs w-full max-w-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Bottom Right Control Buttons */}
          <div className="flex justify-end items-center gap-3 pt-6 border-t border-gray-100">
            <button
              onClick={handleUploadClick}
              disabled={!selectedFile}
              className={`font-bold text-xs px-8 py-2.5 rounded transition-all cursor-pointer ${
                selectedFile 
                  ? 'bg-[#800000] hover:bg-[#680000] text-white shadow-md' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Upload
            </button>
            <button
              onClick={onBack}
              className="bg-white hover:bg-gray-50 border border-[#800000] text-[#800000] font-bold text-xs px-8 py-2.5 rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Right side: Real-time feedback reports */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          {isProcessed ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col justify-between h-full space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider">
                    Upload Status Feedback
                  </h3>
                </div>

                {/* Summary Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Total Uploaded</span>
                    <span className="block text-xl font-extrabold text-slate-800 mt-1">{metrics.total}</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-center">
                    <span className="block text-[10px] font-bold text-emerald-600 uppercase">Processed</span>
                    <span className="block text-xl font-extrabold text-emerald-800 mt-1">{metrics.success}</span>
                  </div>
                  <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl text-center">
                    <span className="block text-[10px] font-bold text-red-600 uppercase">Failed</span>
                    <span className="block text-xl font-extrabold text-red-800 mt-1">{metrics.failed}</span>
                  </div>
                </div>

                {/* Micro Metrics Details */}
                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500 font-medium">Total Records Uploaded:</span>
                    <span className="font-bold text-gray-800">{metrics.total}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500 font-medium">Successfully Processed:</span>
                    <span className="font-bold text-emerald-700">{metrics.success}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500 font-medium">Failed:</span>
                    <span className="font-bold text-red-700">{metrics.failed}</span>
                  </div>
                </div>

                {/* Output file download button */}
                <div className="pt-2">
                  <button
                    onClick={handleDownloadOutputResponseFile}
                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Output File</span>
                  </button>
                </div>
              </div>

              {/* Batches review lists */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px] pr-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Preview Batch details</span>
                <div className="space-y-1.5">
                  {processedResults.slice(0, 5).map((row, index) => {
                    const isSuccess = row["Upload Status"] === 'Success';
                    const rrn = row["RRN"] || row["RRN_Number"] || `Row ${index + 1}`;
                    return (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-[10px]">
                        <span className="font-mono text-gray-600 truncate max-w-[150px]">RRN: {rrn}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-sm font-bold ${isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {row["Upload Status"]}
                          </span>
                          {!isSuccess && <span className="text-red-600 italic truncate max-w-[100px]">{row["Remarks"]}</span>}
                        </div>
                      </div>
                    );
                  })}
                  {processedResults.length > 5 && (
                    <div className="text-center text-[10px] text-gray-400 italic">
                      + {processedResults.length - 5} more rows in downloaded response file
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[460px] space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Awaiting Bulk File Upload</h4>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Once you select a valid Excel or CSV file and click the Upload button, real-time success/failure metrics and output report logs will show up here.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
