import React from 'react';
import { 
  X, 
  FileText, 
  Download, 
  CheckCircle2, 
  Percent, 
  ShieldCheck, 
  ExternalLink,
  Calendar,
  UserCheck
} from 'lucide-react';
import { ChargebackRecord } from '../types';

interface ViewPartialEvidenceModalProps {
  record: ChargebackRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewPartialEvidenceModal: React.FC<ViewPartialEvidenceModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !record) return null;

  const total = record.amount;
  const partial = record.partialAmount || Math.round(total / 2);
  const remaining = Math.max(0, total - partial);
  const evidenceFiles = record.partialEvidenceFiles && record.partialEvidenceFiles.length > 0
    ? record.partialEvidenceFiles
    : ['Proof_of_Partial_Fulfillment_Signed.pdf'];

  const handleDownloadFile = (filename: string) => {
    const dummyText = `Evidence Document: ${filename}\nDispute ID: ${record.id}\nRRN: ${record.rrn}\nPartial Amount: ₹${partial}\nReason: ${record.partialReason || 'Partial fulfillment verified'}\nDate: ${new Date().toISOString()}`;
    const blob = new Blob([dummyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename.replace('.pdf', '.txt') : filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Partial Acceptance Details & Evidence
              </h3>
              <p className="text-xs text-amber-200">
                Dispute ID: {record.id} • RRN: {record.rrn}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Amount Breakdown Bento */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                Dispute Amount
              </span>
              <span className="text-sm font-bold text-gray-900">
                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-x border-amber-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">
                Accepted Refund
              </span>
              <span className="text-sm font-bold text-emerald-700">
                ₹{partial.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                Retained Portion
              </span>
              <span className="text-sm font-bold text-amber-800">
                ₹{remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Section: Reason */}
          <div className="space-y-1.5 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Reason Stated For Partial Acceptance
            </span>
            <p className="text-xs font-semibold text-gray-900 leading-relaxed">
              {record.partialReason || 'Partial services/goods delivered. Customer agreed to settle for the remaining disputed balance.'}
            </p>
          </div>

          {/* Section: Attached Evidence */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Attached Evidence Documents ({evidenceFiles.length})
            </span>
            <div className="space-y-2">
              {evidenceFiles.map((filename, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-amber-400 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                    <div className="p-2 bg-amber-50 text-amber-800 rounded-lg shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block truncate" title={filename}>
                        {filename}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Verified Evidence • PDF / Image Document
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(filename)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                    title="Download evidence document"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Remarks */}
          {record.partialEvidenceRemarks && (
            <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                Evidence Identifier / Dispatch Remarks
              </span>
              <p className="text-xs text-gray-700 font-mono">
                {record.partialEvidenceRemarks}
              </p>
            </div>
          )}

          {/* Verification Stamp */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="text-[11px] font-medium">
              Partial acceptance recorded and verified on NSDL Dispute Management Gateway.
            </span>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
