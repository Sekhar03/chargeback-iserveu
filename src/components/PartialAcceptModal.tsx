import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Percent, 
  ShieldCheck, 
  FileCheck,
  Trash2,
  Info
} from 'lucide-react';
import { ChargebackRecord } from '../types';

interface PartialAcceptModalProps {
  record: ChargebackRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    recordId: string, 
    details: {
      partialAmount: number;
      partialReason: string;
      partialEvidenceFiles: string[];
      partialEvidenceRemarks: string;
    }
  ) => void;
  userType?: string;
}

const PRESET_REASONS = [
  'Partial services delivered / utilized by customer',
  'Partial goods delivered and accepted by customer',
  'Customer agreed to partial settlement / compensation',
  'Partial refund already processed via cash or alternative channel',
  'Damaged / defective portion refunded, intact items retained',
  'Mutual commercial compromise agreed with buyer',
  'Transaction partially verified with merchant proof',
  'Other valid partial resolution justification'
];

export const PartialAcceptModal: React.FC<PartialAcceptModalProps> = ({
  record,
  isOpen,
  onClose,
  onConfirm,
  userType = 'merchant',
}) => {
  if (!isOpen || !record) return null;

  const totalAmount = record.amount;
  // Default to 50% rounded
  const [partialAmount, setPartialAmount] = useState<number>(
    Math.round(totalAmount / 2)
  );
  const [reasonCategory, setReasonCategory] = useState<string>(PRESET_REASONS[0]);
  const [reasonDetails, setReasonDetails] = useState<string>('');
  const [evidenceRemarks, setEvidenceRemarks] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'Proof_of_Partial_Fulfillment_Signed.pdf'
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const remainingAmount = Math.max(0, totalAmount - (partialAmount || 0));

  const handlePercentagePreset = (percent: number) => {
    const val = Math.round((totalAmount * percent) / 100);
    setPartialAmount(val);
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFileNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        newFileNames.push(files[i].name);
      }
      setUploadedFiles(prev => [...prev, ...newFileNames]);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFileNames: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        newFileNames.push(e.dataTransfer.files[i].name);
      }
      setUploadedFiles(prev => [...prev, ...newFileNames]);
      setErrorMsg(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!partialAmount || partialAmount <= 0) {
      setErrorMsg('Please specify a valid partial acceptance amount greater than ₹0.');
      return;
    }

    if (partialAmount > totalAmount) {
      setErrorMsg(`Partial acceptance amount cannot exceed total disputed amount of ₹${totalAmount.toLocaleString('en-IN')}.`);
      return;
    }

    const fullReason = reasonDetails.trim() 
      ? `${reasonCategory}: ${reasonDetails.trim()}`
      : reasonCategory;

    if (!reasonCategory) {
      setErrorMsg('Please select or specify a reason for partial acceptance.');
      return;
    }

    if (uploadedFiles.length === 0 && !evidenceRemarks.trim()) {
      setErrorMsg('Mandatory: Please attach at least one supporting evidence document or enter evidence reference remarks.');
      return;
    }

    onConfirm(record.id, {
      partialAmount,
      partialReason: fullReason,
      partialEvidenceFiles: uploadedFiles.length > 0 ? uploadedFiles : ['Evidence_Reference_Submitted.pdf'],
      partialEvidenceRemarks: evidenceRemarks.trim() || 'Supporting documentation and justification verified.',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-6 py-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Percent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Partially Accept Dispute
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Settle a portion of the disputed amount with mandatory reason & supporting evidence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Dispute Summary Pill Box */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Dispute ID</span>
              <span className="font-mono font-bold text-gray-900">{record.id}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">RRN</span>
              <span className="font-mono font-semibold text-gray-900">{record.rrn}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Merchant</span>
              <span className="font-semibold text-gray-900 truncate block" title={record.merchantName}>
                {record.merchantName}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Total Disputed</span>
              <span className="font-bold text-sm text-[#800000]">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Section 1: Partial Amount Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <span>1. Partial Acceptance Amount (Refund to Customer)</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-500">
                Max: ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Amount input & quick presets */}
            <div className="space-y-2.5">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={1}
                  max={totalAmount}
                  step="any"
                  value={partialAmount || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPartialAmount(isNaN(val) ? 0 : val);
                    setErrorMsg(null);
                  }}
                  placeholder="Enter amount to partially accept"
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  required
                />
              </div>

              {/* Percentage Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-gray-500 font-medium">Quick Presets:</span>
                {[25, 33, 50, 75].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentagePreset(pct)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-amber-100 hover:text-amber-900 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {pct}% (₹{Math.round((totalAmount * pct) / 100).toLocaleString('en-IN')})
                  </button>
                ))}
              </div>
            </div>

            {/* Split breakdown card */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 border border-gray-200/90 rounded-xl text-xs">
              <div className="flex items-center justify-between border-r border-gray-200 pr-3">
                <span className="text-gray-600 font-medium">Amount to Refund:</span>
                <span className="font-bold text-emerald-700">
                  ₹{(partialAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between pl-1">
                <span className="text-gray-600 font-medium">Retained / Contested:</span>
                <span className="font-bold text-amber-800">
                  ₹{remainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Reason for Partial Acceptance (Mandatory) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span>2. Reason for Partial Acceptance</span>
              <span className="text-red-500">*</span>
              <span className="text-[10px] text-gray-500 font-normal">(Required)</span>
            </label>

            {/* Reason Category Dropdown */}
            <select
              value={reasonCategory}
              onChange={(e) => {
                setReasonCategory(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
              required
            >
              {PRESET_REASONS.map((reason, idx) => (
                <option key={idx} value={reason}>
                  {reason}
                </option>
              ))}
            </select>

            {/* Detailed Explanation */}
            <div>
              <textarea
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder="Provide detailed explanation or justification for partial acceptance (e.g. details of delivered items, customer agreement, order references)..."
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section 3: Evidence & Supporting Documents (Mandatory) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <span>3. Supporting Evidence & Documents</span>
                <span className="text-red-500">*</span>
                <span className="text-[10px] text-gray-500 font-normal">(Required)</span>
              </label>
              <span className="text-[10px] text-gray-500">PDF, JPG, PNG up to 10MB</span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-amber-500 bg-amber-50/50' 
                  : 'border-gray-300 hover:border-amber-400 bg-gray-50/60'
              }`}
              onClick={() => document.getElementById('partialEvidenceInput')?.click()}
            >
              <input
                id="partialEvidenceInput"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="p-2.5 bg-amber-100/70 text-amber-800 rounded-full">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Click to browse or drag & drop evidence files
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Proof of partial delivery, customer chat/email confirmation, invoice, or refund receipt
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded File List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                  Attached Evidence ({uploadedFiles.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {uploadedFiles.map((filename, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-amber-50/80 border border-amber-200/70 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <FileCheck className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="font-medium text-gray-800 truncate" title={filename}>
                          {filename}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors cursor-pointer shrink-0"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Remarks & Identifier */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Evidence Identifier / Dispatch / Reference Remarks
              </label>
              <input
                type="text"
                value={evidenceRemarks}
                onChange={(e) => setEvidenceRemarks(e.target.value)}
                placeholder="e.g. POD Docket #4928190, Customer acceptance email dated 2026-07-28"
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Validation Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Policy Notice Box */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              On confirming partial acceptance, a refund of <strong>₹{(partialAmount || 0).toLocaleString('en-IN')}</strong> will be issued to the customer, while the remaining balance of <strong>₹{remainingAmount.toLocaleString('en-IN')}</strong> will remain protected under your submitted evidence.
            </p>
          </div>

          {/* Modal Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Partial Acceptance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
