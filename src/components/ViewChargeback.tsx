import React, { useState, useRef } from "react";
import {
  Calendar,
  Search,
  ArrowLeft,
  Download,
  Eye,
  FileSpreadsheet,
  MoreVertical,
  History,
  MessageSquare,
  AlertCircle,
  X,
  ChevronRight,
  Settings,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Percent,
} from "lucide-react";
import { ChargebackRecord, FilterParams, UserType } from "../types";
import * as XLSX from "xlsx";
import { PartialAcceptModal } from "./PartialAcceptModal";
import { ViewPartialEvidenceModal } from "./ViewPartialEvidenceModal";
interface ViewChargebackProps {
  records: ChargebackRecord[];
  onBack: () => void;
  onRaiseClick: () => void;
  userType?: UserType;
  initialTab?: "Action Required" | "Review Required" | "Under Review" | "Closed" | "All Disputes";
  initialCardFilter?: string | null;
  onUpdateStatus?: (
    id: string,
    status:
      | "New"
      | "Accepted"
      | "Rejected"
      | "Pending"
      | "Approved"
      | "Under Review"
      | "Raised",
    subStatus?: string,
  ) => void;
}
export const ViewChargeback: React.FC<ViewChargebackProps> = ({
  records,
  onBack,
  onRaiseClick,
  userType = "merchant",
  initialTab = "All Disputes",
  initialCardFilter = null,
  onUpdateStatus,
}) => {
  const getInitialTab = () => {
    if (userType === "admin") {
      if (initialTab === "Action Required" || initialTab === "Under Review") {
        return "Review Required";
      }
    }
    return initialTab;
  };

  const [merchantActiveTab, setMerchantActiveTab] = useState<
    "Action Required" | "Review Required" | "Under Review" | "Closed" | "All Disputes"
  >(getInitialTab());
  const [cardFilter, setCardFilter] = useState<string | null>(initialCardFilter);

  React.useEffect(() => {
    if (initialTab) {
      if (userType === "admin" && (initialTab === "Action Required" || initialTab === "Under Review")) {
        setMerchantActiveTab("Review Required");
      } else {
        setMerchantActiveTab(initialTab);
      }
    }
  }, [initialTab, userType]);

  React.useEffect(() => {
    setCardFilter(initialCardFilter);
  }, [initialCardFilter]);
  const defaultStatus = "";
  const defaultFromDate = "2026-07-20";
  const defaultToDate = "2026-07-28";
  const [filters, setFilters] = useState<FilterParams>({
    fromDate: defaultFromDate,
    toDate: defaultToDate,
    rrnNumber: "",
    merchantId: "",
    merchantName: "",
    transactionId: "",
    status: defaultStatus,
    subStatus: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterParams>(filters);
  const [selectedRecord, setSelectedRecord] = useState<ChargebackRecord | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    disputeType: "",
    paymentScheme: "",
    caseId: "",
    tidSearch: "",
  });
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  // High fidelity custom action modal states
  const [actionRecord, setActionRecord] = useState<ChargebackRecord | null>(
    null,
  );
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(
    null,
  );

  // Rejection form inputs
  const [rejectionReason, setRejectionReason] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<Record<string, string>>({
    evidence2: "",
    evidence3: "",
    evidence4: "",
    evidence5: "",
  });

  // Merchant-specific high-fidelity Take Action flow states
  const [merchantModalRecord, setMerchantModalRecord] =
    useState<ChargebackRecord | null>(null);
  const [merchantModalStep, setMerchantModalStep] = useState<
    | "initial"
    | "accept_confirm"
    | "decline_form"
    | "success_accepted"
    | "success_evidence"
    | null
  >(null);
  const [responseSelect, setResponseSelect] = useState<
    "accept" | "contest" | ""
  >("");
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [merchantRemarksText, setMerchantRemarksText] = useState("");
  const [uploadedEvidence, setUploadedEvidence] = useState<
    Record<string, string>
  >({
    evidence2: "",
    evidence3: "",
    evidence4: "",
    evidence5: "",
  });
  const [additionalEvidenceRows, setAdditionalEvidenceRows] = useState<
    string[]
  >([]);

  // State to track current dragover field keys for visual indicator
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // Table view mode for admin portal (summary vs 32 parameters)

  // Admin Action Gear & Details Info modal states
  const [adminActionPopoverRecord, setAdminActionPopoverRecord] =
    useState<ChargebackRecord | null>(null);
  const [considerModalRecord, setConsiderModalRecord] =
    useState<ChargebackRecord | null>(null);
  const [declineModalRecord, setDeclineModalRecord] =
    useState<ChargebackRecord | null>(null);
  const [detailsModalRecord, setDetailsModalRecord] =
    useState<ChargebackRecord | null>(null);
  const [adminRejectionRemarkInput, setAdminRejectionRemarkInput] =
    useState("");
  const [adminActionSuccessToast, setAdminActionSuccessToast] = useState<
    string | null
  >(null);

  // State for Action Success Modal (Consider / Decline result)
  const [actionSuccessModal, setActionSuccessModal] = useState<{
    type: "consider" | "decline";
    record: ChargebackRecord;
    remarks?: string;
    fileName?: string;
  } | null>(null);

  // Partial Acceptance Modal state
  const [partialModalRecord, setPartialModalRecord] = useState<ChargebackRecord | null>(null);
  // View Evidence Modal state
  const [viewEvidenceRecord, setViewEvidenceRecord] = useState<ChargebackRecord | null>(null);

  const handleConfirmPartialAccept = (
    recordId: string,
    details: {
      partialAmount: number;
      partialReason: string;
      partialEvidenceFiles: string[];
      partialEvidenceRemarks: string;
    }
  ) => {
    if (onUpdateStatus) {
      onUpdateStatus(
        recordId,
        "Partially Accepted",
        "Partially Accepted - Evidence Attached",
        details
      );
    }
    setAdminActionSuccessToast(
      `Dispute ${recordId} partially accepted for ₹${details.partialAmount.toLocaleString("en-IN")}. Reason & evidence recorded.`
    );
    setTimeout(() => setAdminActionSuccessToast(null), 5000);
  };
  const handleFileChange = (
    fieldKey: string,
    e: React.ChangeEvent<HTMLInputElement>,
    isMerchant: boolean,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedExtensions = /(\.pdf|\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i;
      if (!allowedExtensions.exec(file.name)) {
        alert(
          "Invalid file format! Only PDF and Image formats (JPEG, PNG, GIF, WEBP) are allowed.",
        );
        return;
      }
      if (isMerchant) {
        setUploadedEvidence((prev) => ({
          ...prev,
          [fieldKey]: file.name,
        }));
      } else {
        setEvidenceFiles((prev) => ({
          ...prev,
          [fieldKey]: file.name,
        }));
      }
    }
  };
  const handleDragOver = (e: React.DragEvent, fieldKey: string) => {
    e.preventDefault();
    setDragOverKey(fieldKey);
  };
  const handleDragLeave = () => {
    setDragOverKey(null);
  };
  const handleDrop = (
    e: React.DragEvent,
    fieldKey: string,
    isMerchant: boolean,
  ) => {
    e.preventDefault();
    setDragOverKey(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const allowedExtensions = /(\.pdf|\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i;
      if (!allowedExtensions.exec(file.name)) {
        alert(
          "Invalid file format! Only PDF and Image formats (JPEG, PNG, GIF, WEBP) are allowed.",
        );
        return;
      }
      if (isMerchant) {
        setUploadedEvidence((prev) => ({
          ...prev,
          [fieldKey]: file.name,
        }));
      } else {
        setEvidenceFiles((prev) => ({
          ...prev,
          [fieldKey]: file.name,
        }));
      }
    }
  };

  // Track active 3-dots menus in the table
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Mock remarks & history state
  const [remarksRecord, setRemarksRecord] = useState<ChargebackRecord | null>(
    null,
  );
  const [historyRecord, setHistoryRecord] = useState<ChargebackRecord | null>(
    null,
  );

  // High fidelity dispute details timeline chat states
  interface TimelineEntry {
    by: string;
    time: string;
    title: string;
    remarks?: string;
    file?: string | null;
  }
  const [replies, setReplies] = useState<Record<string, TimelineEntry[]>>({});
  const [replyInput, setReplyInput] = useState("");
  const handleSendReply = (recordId: string) => {
    if (!replyInput.trim()) return;
    const newReply: TimelineEntry = {
      by: userType === "merchant" ? "masteruser" : "nsdladmin",
      time: new Date().toLocaleString("en-IN", {
        hour12: true,
      }),
      title: `Remarks Updated by ${userType === "merchant" ? "masteruser" : "nsdladmin"}`,
      remarks: replyInput.trim(),
      file: null,
    };
    setReplies((prev) => ({
      ...prev,
      [recordId]: [
        newReply,
        ...(prev[recordId] || [
          {
            by: "iServeU",
            time: "2026-07-27 10:30 AM",
            title: "Dispute Raised",
            remarks: "Dispute raised automatically from gateway.",
            file: null,
          },
        ]),
      ],
    }));
    setReplyInput("");
  };
  const getTimelineForRecord = (record: ChargebackRecord): TimelineEntry[] => {
    if (replies[record.id]) {
      return replies[record.id];
    }
    const list: TimelineEntry[] = [];

    // Initial raising event
    list.push({
      by: "iServeU",
      time: record.disputeDate + " 10:30 AM",
      title: "Dispute Raised",
      remarks: "Dispute raised automatically from gateway.",
      file: null,
    });

    // Status-based events
    if (record.status === "Accepted") {
      list.unshift({
        by: "masteruser",
        time: "2026-07-28 11:00 AM",
        title: "Dispute Accepted",
        remarks:
          "Dispute accepted by merchant. Refund process to the customer initiated.",
        file: null,
      });
    } else if (
      record.subStatus === "Evidence Submitted" ||
      record.status === "Pending"
    ) {
      list.unshift({
        by: "masteruser",
        time: "2026-07-28 11:15 AM",
        title: "Evidence Submitted (Contested)",
        remarks:
          "Merchant rejected dispute and submitted evidence. Pending review.",
        file: null,
      });
    } else if (record.status === "Rejected") {
      list.unshift({
        by: "nsdladmin",
        time: "2026-07-28 11:30 AM",
        title: "Dispute Rejected",
        remarks: "Dispute rejected after review.",
        file: null,
      });
    }
    return list;
  };
  const handleFilterChange = (field: keyof FilterParams, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleDateChange = (field: "fromDate" | "toDate", val: string) => {
    setFilters((prev) => {
      let newFrom = field === "fromDate" ? val : prev.fromDate;
      let newTo = field === "toDate" ? val : prev.toDate;
      if (newFrom && newTo) {
        const fromObj = new Date(newFrom);
        const toObj = new Date(newTo);
        if (!isNaN(fromObj.getTime()) && !isNaN(toObj.getTime())) {
          const diffDays = Math.round(
            (toObj.getTime() - fromObj.getTime()) / (1000 * 3600 * 24),
          );
          if (field === "fromDate") {
            if (diffDays > 60) {
              const maxTo = new Date(fromObj);
              maxTo.setDate(maxTo.getDate() + 60);
              newTo = maxTo.toISOString().split("T")[0];
            } else if (diffDays < 0) {
              newTo = newFrom;
            }
          } else if (field === "toDate") {
            if (diffDays > 60) {
              const minFrom = new Date(toObj);
              minFrom.setDate(minFrom.getDate() - 60);
              newFrom = minFrom.toISOString().split("T")[0];
            } else if (diffDays < 0) {
              newFrom = newTo;
            }
          }
        }
      }
      return {
        ...prev,
        fromDate: newFrom,
        toDate: newTo,
      };
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters(filters);
  };
  const handleResetFilters = () => {
    const defaultF: FilterParams = {
      fromDate: defaultFromDate,
      toDate: defaultToDate,
      rrnNumber: "",
      merchantId: "",
      merchantName: "",
      transactionId: "",
      status: defaultStatus,
      subStatus: "",
    };
    setFilters(defaultF);
    setAppliedFilters(defaultF);
    setSearchQuery("");
  };
  const getAdjustmentType = (
    r: ChargebackRecord,
  ): "Chargeback" | "Pre-Arbitration" | "Arbitration" => {
    const desc = (r.reasonDescription || "").toLowerCase();
    const sub = (r.subStatus || "").toLowerCase();
    const code = (r.reasonCode || "").toLowerCase();
    if (desc.includes("pre") || sub.includes("pre") || code === "pa") {
      return "Pre-Arbitration";
    }
    if (
      desc.includes("arbitration") ||
      sub.includes("arbitration") ||
      code === "arb"
    ) {
      return "Arbitration";
    }
    return "Chargeback";
  };

  // Filter logic
  const filteredRecords = records.filter((record) => {
    if (
      appliedFilters.rrnNumber &&
      !record.rrn.includes(appliedFilters.rrnNumber.trim())
    ) {
      return false;
    }
    if (
      appliedFilters.merchantId &&
      !record.merchantId
        .toLowerCase()
        .includes(appliedFilters.merchantId.trim().toLowerCase())
    ) {
      return false;
    }
    if (
      appliedFilters.merchantName &&
      !record.merchantName
        .toLowerCase()
        .includes(appliedFilters.merchantName.trim().toLowerCase())
    ) {
      return false;
    }
    if (
      appliedFilters.transactionId &&
      !record.id
        .toLowerCase()
        .includes(appliedFilters.transactionId.trim().toLowerCase())
    ) {
      return false;
    }
    if (appliedFilters.status) {
      const s = appliedFilters.status.toLowerCase();
      const adjType = getAdjustmentType(record).toLowerCase();
      if (s === "chargeback raise" || s === "chargeback") {
        if (adjType !== "chargeback") return false;
      } else if (s === "pre-arbitration raise" || s === "pre-arbitration") {
        if (adjType !== "pre-arbitration") return false;
      } else if (s === "arbitration raise" || s === "arbitration") {
        if (adjType !== "arbitration") return false;
      } else {
        if (record.status.toLowerCase() !== s) return false;
      }
    }
    if (appliedFilters.subStatus) {
      const ss = appliedFilters.subStatus.toLowerCase();
      const recordSub = (record.subStatus || "").toLowerCase();
      if (ss === "chargeback new") {
        if (
          record.status !== "New" &&
          !recordSub.includes("new") &&
          recordSub !== "action pending"
        )
          return false;
      } else if (ss === "chargeback lost") {
        if (
          record.status !== "Rejected" &&
          !recordSub.includes("lost") &&
          !recordSub.includes("declined")
        )
          return false;
      } else if (ss === "chargeback in progress") {
        if (
          record.status !== "Pending" &&
          record.status !== "Under Review" &&
          record.status !== "Raised" &&
          !recordSub.includes("progress") &&
          recordSub !== "bank processing" &&
          recordSub !== "evidence submitted"
        )
          return false;
      } else if (ss === "chargeback resubmit") {
        if (
          !recordSub.includes("resubmit") &&
          recordSub !== "documents required"
        )
          return false;
      } else if (ss === "chargeback won") {
        if (
          record.status !== "Accepted" &&
          record.status !== "Approved" &&
          !recordSub.includes("won") &&
          recordSub !== "merchant accepted"
        )
          return false;
      } else {
        if (!recordSub.includes(ss)) return false;
      }
    }

    // Date filter matches transactionDate prefix (e.g. "2026-07-28")
    const recordDate = record.transactionDate.substring(0, 10);
    if (appliedFilters.fromDate && recordDate < appliedFilters.fromDate) {
      return false;
    }
    if (appliedFilters.toDate && recordDate > appliedFilters.toDate) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        record.rrn.includes(q) ||
        record.merchantId.toLowerCase().includes(q) ||
        record.merchantName.toLowerCase().includes(q) ||
        record.reasonDescription.toLowerCase().includes(q) ||
        record.id.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (userType === "merchant" || userType === "partner" || userType === "admin") {
      if (merchantActiveTab === "Action Required") {
        if (
          record.status !== "New" &&
          record.subStatus !== "Documents Required" &&
          record.subStatus !== "Action Required" &&
          record.subStatus !== "Chargeback New"
        )
          return false;
      } else if (merchantActiveTab === "Review Required") {
        if (
          record.status === "Accepted" ||
          record.status === "Rejected" ||
          record.status === "Approved"
        )
          return false;
      } else if (merchantActiveTab === "Under Review") {
        if (
          record.status !== "Pending" &&
          record.status !== "Under Review" &&
          record.status !== "Raised" &&
          record.subStatus !== "Evidence Submitted"
        )
          return false;
      } else if (merchantActiveTab === "Closed") {
        if (
          record.status !== "Accepted" &&
          record.status !== "Rejected" &&
          record.status !== "Approved"
        )
          return false;
      }
    }

    if (cardFilter) {
      const idx = records.indexOf(record);
      if (cardFilter === "due_today" && !(record.status === "New" && (idx % 4 === 0 || record.aging?.includes("today") || record.aging?.includes("1d")))) return false;
      if (cardFilter === "due_tomorrow" && !(record.status === "New" && (idx % 4 === 1 || record.aging?.includes("tomorrow") || record.aging?.includes("2d")))) return false;
      if (cardFilter === "due_2_7" && !(record.status === "New" && (idx % 4 === 2 || record.aging?.includes("2 to 7") || record.aging?.includes("4d")))) return false;
      if (cardFilter === "resubmission" && !(record.subStatus === "Documents Required" || idx % 4 === 3)) return false;
      if (cardFilter === "under_review_submitted" && !(record.subStatus === "Evidence Submitted" || record.status === "Pending")) return false;
      if (cardFilter === "under_review_approved" && !(record.status === "Approved" || record.status === "Raised")) return false;
      if (cardFilter === "under_review_total" && !(record.status === "Pending" || record.status === "Under Review" || record.status === "Raised")) return false;
      if (cardFilter === "closed_won" && !(record.status === "Accepted" || record.status === "Approved" || record.subStatus?.toLowerCase().includes("won"))) return false;
      if (cardFilter === "closed_lost" && !(record.status === "Rejected" || record.subStatus?.toLowerCase().includes("lost"))) return false;
      if (cardFilter === "all_open" && !(record.status === "New" || record.status === "Pending" || record.status === "Under Review" || record.status === "Raised")) return false;
      if (cardFilter === "all_total") return true;
      if (cardFilter === "all_closed" && !(record.status === "Accepted" || record.status === "Rejected" || record.status === "Approved")) return false;
    }

    return true;
  });

  // Dynamic stats & sums calculated from records
  const isActionReqRec = (r: ChargebackRecord) =>
    r.status === "New" ||
    r.subStatus === "Documents Required" ||
    r.subStatus === "Action Required" ||
    r.subStatus === "Chargeback New";

  const isReviewReqRec = (r: ChargebackRecord) =>
    r.status !== "Accepted" &&
    r.status !== "Rejected" &&
    r.status !== "Approved";

  const isUnderRevRec = (r: ChargebackRecord) =>
    r.status === "Pending" ||
    r.status === "Under Review" ||
    r.status === "Raised" ||
    r.subStatus === "Evidence Submitted";

  const isClosedResRec = (r: ChargebackRecord) =>
    r.status === "Accepted" ||
    r.status === "Rejected" ||
    r.status === "Approved";

  const actionReqList = records.filter(isActionReqRec);
  const reviewReqList = records.filter(isReviewReqRec);
  const underReviewList = records.filter(isUnderRevRec);
  const closedList = records.filter(isClosedResRec);

  const dueTodayList = actionReqList.filter((r, i) => i % 4 === 0 || r.aging?.includes("today") || r.aging?.includes("1d"));
  const dueTomorrowList = actionReqList.filter((r, i) => i % 4 === 1 || r.aging?.includes("tomorrow") || r.aging?.includes("2d"));
  const due2To7List = actionReqList.filter((r, i) => i % 4 === 2 || r.aging?.includes("2 to 7") || r.aging?.includes("4d"));
  const resubmitList = actionReqList.filter((r, i) => i % 4 === 3 || r.subStatus === "Documents Required");

  const underReviewSubmittedList = underReviewList.filter(
    (r) => r.subStatus === "Evidence Submitted" || r.status === "Pending"
  );
  const underReviewApprovedList = underReviewList.filter(
    (r) => r.status === "Approved" || r.status === "Raised"
  );

  const closedWonList = closedList.filter(
    (r) => r.status === "Accepted" || r.status === "Approved" || r.subStatus?.toLowerCase().includes("won")
  );
  const closedLostList = closedList.filter(
    (r) => r.status === "Rejected" || r.subStatus?.toLowerCase().includes("lost")
  );

  const sumList = (list: ChargebackRecord[]) =>
    list.reduce((acc, r) => acc + (r.amount || 0), 0);
  const exportToExcel = () => {
    let exportData;
    if (userType === "admin") {
      exportData = filteredRecords.map((r) => ({
        "User ID": "2222257001642755",
        "User Name": "masteruser",
        RRN: r.rrn,
        "Transaction ID": "530346139645447349",
        Aging: "4 days",
        Status: r.status,
        "Sub status": r.subStatus,
        "Transaction amount": `₹${r.amount}`,
      }));
    } else {
      exportData = filteredRecords.map((r, idx) => {
        const txnIdList = [
          "530346139645447349",
          "530347448645447349",
          "538514557645447349",
          "538490720645447349",
          "534978536645447349",
          "535286399645447349",
        ];
        const txnId = txnIdList[idx % txnIdList.length];
        const row: any = {
          "Chargeback ID": r.id,
          "Dispute Type": getAdjustmentType(r),
        };
        if (userType === "partner") {
          row["Merchant Name"] = r.merchantName;
        }
        row["RRN"] = r.rrn;
        row["Transaction ID"] = txnId;
        row["Dispute Status"] = r.status;
        row["Respond By"] = "24h";
        row["Amount"] = `₹${r.amount}`;
        return row;
      });
    }
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chargebacks");
    XLSX.writeFile(
      workbook,
      `Chargebacks_Export_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "New":
      case "NEW":
        return "text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100";
      case "Accepted":
      case "ACCEPTED":
        return "bg-emerald-100 text-emerald-800 font-bold border-emerald-200";
      case "Approved":
        return "bg-emerald-100 text-emerald-800 font-bold border-emerald-200";
      case "Pending":
        return "bg-amber-100 text-amber-800 font-bold border-amber-200";
      case "Rejected":
        return "bg-red-100 text-red-800 font-bold border-red-200";
      case "Under Review":
        return "bg-blue-100 text-blue-800 font-bold border-blue-200";
      case "Raised":
        return "bg-purple-100 text-purple-800 font-bold border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 font-bold border-gray-200";
    }
  };
  const triggerFileMock = (fieldKey: string) => {
    const mockNames: Record<string, string> = {
      evidence2: "Invoice_Copy_47669879.pdf",
      evidence3: "Delivery_Proof_47669879.pdf",
      evidence4: "Customer_Declaration.pdf",
      evidence5: "Bank_Statement_Extract.pdf",
    };
    setEvidenceFiles((prev) => ({
      ...prev,
      [fieldKey]: mockNames[fieldKey] || "uploaded_document.pdf",
    }));
  };
  const triggerRemoveFile = (fieldKey: string) => {
    setEvidenceFiles((prev) => ({
      ...prev,
      [fieldKey]: "",
    }));
  };
  const triggerMerchantFileMock = (fieldKey: string) => {
    const mockNames: Record<string, string> = {
      evidence2: "DeliveredProof.pdf",
      evidence3: "ServiceStatement.pdf",
      evidence4: "RefundReceipt.png",
      evidence5: "AdditionalEvidence_Log.pdf",
    };
    setUploadedEvidence((prev) => ({
      ...prev,
      [fieldKey]: mockNames[fieldKey] || "uploaded_document.pdf",
    }));
  };
  const triggerMerchantRemoveFile = (fieldKey: string) => {
    setUploadedEvidence((prev) => ({
      ...prev,
      [fieldKey]: "",
    }));
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Title & Indicator */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="text-gray-800 hover:text-[#800000] transition-colors focus:outline-none cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Dispute Management / Chargeback
            </h1>
          </div>
        </div>
        {/* Yellow-Green Accent Line matching screenshot */}
        <div className="flex items-center gap-1 pl-7">
          <div className="h-[3px] w-12 bg-yellow-400 rounded-full"></div>
          <div className="h-[3px] w-6 bg-emerald-500 rounded-full"></div>
          <div className="h-[3px] w-2 bg-yellow-400 rounded-full"></div>
        </div>
      </div>
      <div className="space-y-4">
        {/* Tabs Bar */}
        <div className="flex items-center gap-6 border-b border-gray-200">
          {(userType === "admin"
            ? [
                {
                  id: "Review Required",
                  label: "Review Required",
                  count: reviewReqList.length,
                },
                {
                  id: "Closed",
                  label: "Closed",
                  count: closedList.length,
                },
                {
                  id: "All Disputes",
                  label: "All Disputes",
                  count: records.length,
                },
              ]
            : [
                {
                  id: "Action Required",
                  label: "Action Required",
                  count: actionReqList.length,
                },
                {
                  id: "Under Review",
                  label: "Under Review",
                  count: underReviewList.length,
                },
                {
                  id: "Closed",
                  label: "Closed",
                  count: closedList.length,
                },
                {
                  id: "All Disputes",
                  label: "All Disputes",
                  count: records.length,
                },
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setMerchantActiveTab(tab.id as any);
                setCardFilter(null);
              }}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                merchantActiveTab === tab.id
                  ? "border-[#800000] text-[#800000]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  merchantActiveTab === tab.id
                    ? "bg-[#800000]/10 text-[#800000]"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Active Filter Indicator */}
        {cardFilter && (
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg text-xs text-rose-800">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              <span>
                Filtered by section: <strong className="uppercase">{cardFilter.replace(/_/g, " ")}</strong> ({filteredRecords.length} records matching)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCardFilter(null)}
              className="text-[#800000] font-bold hover:underline cursor-pointer text-xs"
            >
              Clear Section Filter ✕
            </button>
          </div>
        )}

        {/* Cards Based on Active Tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(merchantActiveTab === "Action Required" || merchantActiveTab === "Review Required") && (
            <>
              {/* Card 1: Due Date Today */}
              <div
                onClick={() => setCardFilter(cardFilter === "due_today" ? null : "due_today")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "due_today"
                    ? "ring-2 ring-rose-600 border-rose-600 bg-rose-50/30 scale-[1.01]"
                    : "border-rose-200 hover:border-rose-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-rose-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">
                  Due Date Today
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(dueTodayList).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">{dueTodayList.length} disputes</div>
                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></div> Urgent
                </span>
              </div>

              {/* Card 2: Due Date Tomorrow */}
              <div
                onClick={() => setCardFilter(cardFilter === "due_tomorrow" ? null : "due_tomorrow")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "due_tomorrow"
                    ? "ring-2 ring-amber-600 border-amber-600 bg-amber-50/30 scale-[1.01]"
                    : "border-amber-200 hover:border-amber-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-amber-500">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">
                  Due Date Tomorrow
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(dueTomorrowList).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">{dueTomorrowList.length} disputes</div>
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  ⏳ 24 Hours Left
                </span>
              </div>

              {/* Card 3: Due Date 2 to 7 Days */}
              <div
                onClick={() => setCardFilter(cardFilter === "due_2_7" ? null : "due_2_7")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "due_2_7"
                    ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50/30 scale-[1.01]"
                    : "border-blue-200 hover:border-blue-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-blue-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">
                  Due Date 2 to 7 Days
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(due2To7List).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">{due2To7List.length} disputes</div>
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  📅 This Week
                </span>
              </div>

              {/* Card 4: Resubmission Required */}
              <div
                onClick={() => setCardFilter(cardFilter === "resubmission" ? null : "resubmission")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "resubmission"
                    ? "ring-2 ring-purple-600 border-purple-600 bg-purple-50/30 scale-[1.01]"
                    : "border-purple-200 hover:border-purple-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-purple-500">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">
                  Resubmission Required
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(resubmitList).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">{resubmitList.length} disputes</div>
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  ⚠️ Action Needed
                </span>
              </div>
            </>
          )}

          {merchantActiveTab === "Under Review" && (
            <>
              {/* Card 1: Evidence Submitted */}
              <div
                onClick={() => setCardFilter(cardFilter === "under_review_submitted" ? null : "under_review_submitted")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden lg:col-span-2 cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "under_review_submitted"
                    ? "ring-2 ring-amber-600 border-amber-600 bg-amber-50/30 scale-[1.01]"
                    : "border-amber-200 hover:border-amber-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-amber-500">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">
                  Under Review - Evidence Submitted
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(underReviewSubmittedList).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {underReviewSubmittedList.length} disputes · document submitted
                </div>
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Document submitted
                </span>
              </div>

              {/* Card 2: Approved and Sent to Bank */}
              <div
                onClick={() => setCardFilter(cardFilter === "under_review_approved" ? null : "under_review_approved")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "under_review_approved"
                    ? "ring-2 ring-[#00a86b] border-[#00a86b] bg-emerald-50/30 scale-[1.01]"
                    : "border-emerald-200 hover:border-emerald-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-[#00a86b]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-[#00a86b] uppercase tracking-wider mb-2">
                  Under Review - Approved And Sent to Bank
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(underReviewApprovedList).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">{underReviewApprovedList.length} disputes</div>
                <span className="inline-flex items-center gap-1 bg-[#00a86b]/10 text-[#00a86b] text-[10px] font-bold px-2 py-0.5 rounded">
                  Represented
                </span>
              </div>

              {/* Card 3: Total Active Review Amount */}
              <div
                onClick={() => setCardFilter(cardFilter === "under_review_total" ? null : "under_review_total")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "under_review_total"
                    ? "ring-2 ring-gray-600 border-gray-600 bg-gray-50 scale-[1.01]"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-gray-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Total Amount
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(underReviewList).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {underReviewList.length} disputes under review
                </div>
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                  Active Review
                </span>
              </div>
            </>
          )}

          {merchantActiveTab === "Closed" && (
            <>
              {/* Dispute Won Card */}
              <div
                onClick={() => setCardFilter(cardFilter === "closed_won" ? null : "closed_won")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "closed_won"
                    ? "ring-2 ring-[#00a86b] border-[#00a86b] bg-emerald-50/30 scale-[1.01]"
                    : "border-emerald-200 hover:border-emerald-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-[#00a86b]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-[#00a86b] uppercase tracking-wider mb-2">
                  Dispute Won
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(closedWonList).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {closedWonList.length} cases secured
                </div>
                <span className="inline-flex items-center gap-1 bg-[#00a86b]/10 text-[#00a86b] text-[10px] font-bold px-2 py-0.5 rounded">
                  Restored
                </span>
              </div>

              {/* Dispute Lost Card */}
              <div
                onClick={() => setCardFilter(cardFilter === "closed_lost" ? null : "closed_lost")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "closed_lost"
                    ? "ring-2 ring-rose-600 border-rose-600 bg-rose-50/30 scale-[1.01]"
                    : "border-rose-200 hover:border-rose-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-rose-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">
                  Dispute Lost
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(closedLostList).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {closedLostList.length} cases debited
                </div>
                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  Debited
                </span>
              </div>

              {/* Win Rate Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs relative overflow-hidden lg:col-span-2 flex flex-col items-center justify-center">
                <h3 className="text-[10px] font-bold text-[#00a86b] uppercase tracking-wider mb-2">
                  Win Rate
                </h3>
                <div className="text-4xl font-bold text-[#00a86b] mb-1">
                  {closedList.length > 0
                    ? `${Math.round((closedWonList.length / closedList.length) * 100)}%`
                    : "100%"}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {closedWonList.length} of {closedList.length} cases won
                </div>
              </div>
            </>
          )}

          {merchantActiveTab === "All Disputes" && (
            <>
              {/* Total Open */}
              <div
                onClick={() => setCardFilter(cardFilter === "all_open" ? null : "all_open")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "all_open"
                    ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50/30 scale-[1.01]"
                    : "border-blue-200 hover:border-blue-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-blue-500">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">
                  Total Open
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList([...actionReqList, ...underReviewList]).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {actionReqList.length + underReviewList.length} active cases
                </div>
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  In Flight
                </span>
              </div>

              {/* Total Amount */}
              <div
                onClick={() => setCardFilter(cardFilter === "all_total" ? null : "all_total")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "all_total"
                    ? "ring-2 ring-gray-600 border-gray-600 bg-gray-50 scale-[1.01]"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-gray-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Total Amount
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(records).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {records.length} total disputes
                </div>
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                  Full Portfolio
                </span>
              </div>

              {/* Closed */}
              <div
                onClick={() => setCardFilter(cardFilter === "all_closed" ? null : "all_closed")}
                className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden lg:col-span-2 cursor-pointer transition-all hover:shadow-md ${
                  cardFilter === "all_closed"
                    ? "ring-2 ring-[#00a86b] border-[#00a86b] bg-emerald-50/30 scale-[1.01]"
                    : "border-emerald-200 hover:border-emerald-400"
                }`}
              >
                <div className="absolute top-4 right-4 text-[#00a86b]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-[#00a86b] uppercase tracking-wider mb-2">
                  Closed / Settled
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₹{sumList(closedList).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {closedList.length} cases completed
                </div>
                <span className="inline-flex items-center gap-1 bg-[#00a86b]/10 text-[#00a86b] text-[10px] font-bold px-2 py-0.5 rounded">
                  Resolved
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Filter Bar Form matching Screenshot 1 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Merchant Name */}
          {userType !== "merchant" && (
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Merchant Name
              </label>
              <input
                type="text"
                placeholder="Enter Merchant Name"
                value={filters.merchantName || ""}
                onChange={(e) =>
                  handleFilterChange("merchantName", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#800000]"
              />
            </div>
          )}
          {/* Enter RRN */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              RRN Number
            </label>
            <input
              type="text"
              placeholder="Enter RRN"
              value={filters.rrnNumber}
              onChange={(e) => handleFilterChange("rrnNumber", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#800000]"
            />
          </div>
          {/* Enter Transaction ID */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Transaction ID
            </label>
            <input
              type="text"
              placeholder="Enter Transaction ID"
              value={filters.transactionId}
              onChange={(e) =>
                handleFilterChange("transactionId", e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#800000]"
            />
          </div>
          {/* Status Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => {
                handleFilterChange("status", e.target.value);
                handleFilterChange("subStatus", "");
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#800000] bg-white cursor-pointer"
            >
              <option value="">Status</option>
              <option>Chargeback Raise</option>
              <option>Differed Chargeback Raise</option>
              <option>Fraud Chargeback Raise</option>
              <option>Pre-Arbitration Raise</option>
              <option>Arbitration Raise</option>
            </select>
          </div>
        </div>
        {/* Row 2 filters + Search Button */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-1">
          {/* Sub Status */}
          <div className="w-full sm:w-64">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Sub Status
            </label>
            <select
              value={filters.subStatus}
              onChange={(e) => handleFilterChange("subStatus", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#800000] bg-white cursor-pointer"
            >
              <option value="">Sub Status</option>
              {(() => {
                if (userType === "merchant" || userType === "partner") {
                  return (
                    <>
                      <option>Action Required</option>
                      <option>Lost- Self Accepected</option>
                      <option>Lost- Deemed Accepected</option>
                      <option>Under review - Evidence Submitted</option>
                      <option>Action Requied - Resubmit Evidence</option>
                      <option>Under Review - Approved and sent to Bank</option>
                      <option>Won</option>
                      <option>Lost- Arbitration Decision</option>
                    </>
                  );
                }
                
                if (userType === "admin") {
                  return (
                    <>
                      <option>Under Review - Pending Merchant Response</option>
                      <option>Lost- Merchant Accepted</option>
                      <option>Lost- Deemed Accepted</option>
                      <option>Action Required - Pending Admin Review</option>
                      <option>Under Review - Resubmitted to Merchant</option>
                      <option>Under Review - Approved and sent to NPCI</option>
                      <option>Won</option>
                      <option>Lost- Arbitration Decision</option>
                    </>
                  );
                }

                const s = filters.status;
                if (s === "Differed Chargeback Raise") {
                  return (
                    <>
                      <option>Differed Chargeback New</option>
                      <option>Differed Chargeback Lost</option>
                      <option>Differed Chargeback In Progress</option>
                      <option>Differed Chargeback Resubmit</option>
                      <option>Differed Chargeback Won</option>
                    </>
                  );
                }
                if (s === "Fraud Chargeback Raise") {
                  return (
                    <>
                      <option>Fraud Chargeback New</option>
                      <option>Fraud Chargeback Lost</option>
                      <option>Fraud Chargeback In Progress</option>
                      <option>Fraud Chargeback Resubmit</option>
                      <option>Fraud Chargeback Won</option>
                    </>
                  );
                }
                if (s === "Pre-Arbitration Raise") {
                  return (
                    <>
                      <option>Pre-Arbitration New</option>
                      <option>Pre-Arbitration Lost</option>
                      <option>Pre-Arbitration In Progress</option>
                      <option>Pre-Arbitration Resubmit</option>
                      <option>Pre-Arbitration Won</option>
                    </>
                  );
                }
                if (s === "Arbitration Raise") {
                  return (
                    <>
                      <option>Arbitration New</option>
                      <option>Arbitration Lost</option>
                      <option>Arbitration In Progress</option>
                      <option>Arbitration Resubmit</option>
                      <option>Arbitration Won</option>
                    </>
                  );
                }
                // Default & Chargeback Raise
                return (
                  <>
                    <option>Chargeback New</option>
                    <option>Chargeback Lost</option>
                    <option>Chargeback In Progress</option>
                    <option>Chargeback Resubmit</option>
                    <option>Chargeback Won</option>
                  </>
                );
              })()}
            </select>
          </div>
          {/* Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                handleResetFilters();
                setAdvancedFilters({
                  disputeType: "",
                  paymentScheme: "",
                  caseId: "",
                  tidSearch: "",
                });
              }}
              className="text-gray-600 hover:text-gray-900 text-xs font-semibold px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="submit"
              className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-8 py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer min-w-[120px]"
            >
              Search
            </button>
          </div>
        </div>
      </form>
      {/* Results Table Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Controls Topbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-gray-800 uppercase tracking-wider">
              Search Result
            </span>
            <span className="bg-[#800000]/10 text-[#800000] font-bold text-xs px-2.5 py-0.5 rounded-full">
              {filteredRecords.length} records
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Quick Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Quick search RRN, Transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#800000]"
              />
            </div>
            {/* Export Excel Button */}
            <button
              onClick={exportToExcel}
              className="bg-[#800000] hover:bg-[#680000] text-white font-medium text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
        {/* Records Table formatted exactly like NSDL Bank Portal in Screenshots */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 font-bold text-xs border-b border-gray-200 whitespace-nowrap">
                <th className="py-4 px-4 text-left">Chargeback ID</th>
                <th className="py-4 px-4 text-left">Dispute Type</th>
                {(userType === "partner" || userType === "admin") && <th className="py-4 px-4 text-left">Merchant Name</th>}
                <th className="py-4 px-4 text-left">RRN</th>
                <th className="py-4 px-4 text-left">Transaction ID</th>
                <th className="py-4 px-4 text-left">Dispute Status</th>
                <th className="py-4 px-4 text-left">Respond By</th>
                <th className="py-4 px-4 text-left">Amount</th>
                <th className="py-4 px-4 text-center">Action</th>
                <th className="py-4 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {filteredRecords.length > 0 ? (
                [...filteredRecords]
                  .sort((a, b) => b.id.localeCompare(a.id))
                  .map((r, idx) => {
                    const serialNumber = idx + 1;
                    const isPreArb =
                      r.reasonDescription === "Pre Albitization" ||
                      r.reasonCode === "PA" ||
                      (r.subStatus &&
                        r.subStatus.toLowerCase().includes("pre-arbitration"));
                    const createdDate =
                      idx === 0
                        ? "2026-07-27"
                        : idx === 1
                          ? "2026-07-24"
                          : idx === 2
                            ? "2026-06-22"
                            : idx === 3
                              ? "2026-06-19"
                              : idx === 4
                                ? "2026-06-19"
                                : "2026-06-02";
                    const preArbDate = isPreArb ? "2026-07-24" : "NA";
                    const chargebackDate = !isPreArb
                      ? idx === 0
                        ? "2026-07-24"
                        : idx === 2
                          ? "2026-06-22"
                          : idx === 3
                            ? "2026-06-19"
                            : idx === 4
                              ? "2026-06-19"
                              : "2026-06-02"
                      : "NA";
                    const adjDate =
                      idx === 1
                        ? "2026-07-24"
                        : idx === 0
                          ? "2026-07-24"
                          : idx === 2
                            ? "2026-06-22"
                            : idx === 3
                              ? "2026-06-19"
                              : idx === 4
                                ? "2026-06-19"
                                : "2026-06-02";
                    const txnIdList = [
                      "530346139645447349",
                      "530347448645447349",
                      "538514557645447349",
                      "538490720645447349",
                      "534978536645447349",
                      "535286399645447349",
                    ];
                    const txnId = txnIdList[idx % txnIdList.length];
                    const terminalList = [
                      "0123456789",
                      "5688584",
                      "5678585",
                      "609716388",
                    ];
                    const terminal =
                      r.terminalId || terminalList[idx % terminalList.length];
                    const beneMobileList = [
                      "9348989107",
                      "9398809100",
                      "9090765643",
                    ];
                    const beneMobile =
                      beneMobileList[idx % beneMobileList.length];
                    const remMobileList = [
                      "7845695653",
                      "7845665652",
                      "919090765643",
                    ];
                    const remMobile = remMobileList[idx % remMobileList.length];
                    const merchantRemarks =
                      idx === 2 || idx === 5
                        ? '[{"merchant_remark": "Chargeback Raise"}]'
                        : idx === 1
                          ? "Pre-Arbitration Raise"
                          : "Chargeback Raise";

                    /* Helper check for New / Action required dispute */
                    const isNewDispute = (rec: ChargebackRecord) => {
                      const statusUpper = (rec.status || "").toUpperCase();
                      const subStatusUpper = (rec.subStatus || "").toUpperCase();

                      if (subStatusUpper === "EVIDENCE SUBMITTED") return false;
                      if (
                        statusUpper === "ACCEPTED" ||
                        statusUpper === "REJECTED" ||
                        statusUpper === "APPROVED" ||
                        statusUpper === "DECLINED" ||
                        statusUpper.includes("PARTIAL") ||
                        statusUpper === "CLOSED" ||
                        statusUpper === "SETTLED"
                      ) {
                        return false;
                      }

                      return (
                        statusUpper === "NEW" ||
                        statusUpper === "PENDING" ||
                        subStatusUpper === "DOCUMENTS REQUIRED" ||
                        subStatusUpper === "ACTION REQUIRED" ||
                        subStatusUpper === "CHARGEBACK NEW" ||
                        subStatusUpper === "PRE-ARBITRATION NEW" ||
                        subStatusUpper === "ARBITRATION NEW" ||
                        subStatusUpper === "NEW" ||
                        subStatusUpper.includes("NEW") ||
                        subStatusUpper.includes("REQUIRED") ||
                        subStatusUpper.includes("RESUBMIT")
                      );
                    };

                    /* Default Summary Table Row matching user screenshots */
                    const canTakeAction =
                      (userType === "merchant" || userType === "partner") &&
                      isNewDispute(r);
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setDetailsModalRecord(r)}
                        className="bg-white hover:bg-rose-50/30 transition-colors border-b border-gray-100 text-xs cursor-pointer group"
                      >
                        {/* Chargeback ID */}
                        <td className="py-4 px-4 font-mono font-bold text-[#800000]">
                          {r.id || `CB_${r.rrn.substring(0, 5)}`}
                        </td>

                        {/* Dispute Type */}
                        <td className="py-4 px-4">
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2.5 py-1 rounded-md text-[10px] uppercase">
                            {isPreArb ? "Pre-Arbitration" : "Chargeback"}
                          </span>
                        </td>

                        {/* Merchant Name */}
                        {(userType === "partner" || userType === "admin") && (
                          <td className="py-4 px-4 font-semibold text-gray-900">
                            {r.merchantName || "ABC Fashion Store"}
                          </td>
                        )}

                        {/* RRN */}
                        <td className="py-4 px-4 font-mono text-gray-600">
                          {r.rrn}
                        </td>

                        {/* Transaction ID */}
                        <td className="py-4 px-4 font-mono text-gray-600">
                          {txnId}
                        </td>

                        {/* Dispute Status */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                r.status === "Partially Accepted"
                                  ? "bg-amber-500"
                                  : r.status === "Accepted"
                                    ? "bg-emerald-500"
                                    : r.status === "Rejected"
                                      ? "bg-red-500"
                                      : "bg-blue-500"
                              }`}
                            ></div>
                            <span
                              className={`font-bold ${
                                r.status === "Partially Accepted"
                                  ? "text-amber-800"
                                  : r.status === "Accepted"
                                    ? "text-emerald-700"
                                    : r.status === "Rejected"
                                      ? "text-red-700"
                                      : "text-gray-900"
                              }`}
                            >
                              {r.status === "New"
                                ? "Action Required"
                                : r.status === "Partially Accepted"
                                  ? `Partially Accepted (₹${(r.partialAmount || Math.round(r.amount / 2)).toLocaleString("en-IN")})`
                                  : r.subStatus || r.status}
                            </span>
                          </div>
                        </td>

                        {/* Respond By */}
                        <td className="py-4 px-4">
                          <div className="text-gray-700 font-mono mb-1">
                            {createdDate}
                          </div>
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded text-[10px]">
                            {r.aging || `${(idx % 5) * 12 + 4}d left`}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 font-bold text-gray-900 text-sm">
                          ₹{" "}
                          {r.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 text-center relative whitespace-nowrap">
                          {userType === "admin" ? (
                            (r.status === "New" ||
                              r.status === "Pending" ||
                              r.status === "In Progress" ||
                              r.status === "Partially Accepted" ||
                              r.subStatus === "Evidence Submitted" ||
                              r.subStatus === "Chargeback New") ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionRecord(r);
                                  setActionType(null);
                                }}
                                className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center"
                              >
                                Take Action
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailsModalRecord(r);
                                }}
                                className="border border-[#00a86b] text-[#00a86b] hover:bg-[#00a86b]/10 font-bold text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                            )
                          ) : canTakeAction ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (userType === "merchant" || userType === "partner") {
                                  setMerchantModalRecord(r);
                                  setMerchantModalStep("initial");
                                } else {
                                  setActionRecord(r);
                                  setActionType(null);
                                }
                              }}
                              className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center"
                            >
                              Take Action
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailsModalRecord(r);
                              }}
                              className="border border-[#00a86b] text-[#00a86b] hover:bg-[#00a86b]/10 font-bold text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          )}
                        </td>

                        {/* Details */}
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailsModalRecord(r);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="View Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-gray-400">
                    No chargebacks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* RECORD DETAIL VIEW MODAL */}
      {selectedRecord &&
        (() => {
          const timeline = getTimelineForRecord(selectedRecord);
          const isNewDisputeDetail = (rec: ChargebackRecord) => {
            const statusUpper = (rec.status || "").toUpperCase();
            const subStatusUpper = (rec.subStatus || "").toUpperCase();

            if (subStatusUpper === "EVIDENCE SUBMITTED") return false;
                      if (
                        statusUpper === "ACCEPTED" ||
                        statusUpper === "REJECTED" ||
                        statusUpper === "APPROVED" ||
                        statusUpper === "DECLINED" ||
                        statusUpper.includes("PARTIAL") ||
                        statusUpper === "CLOSED" ||
                        statusUpper === "SETTLED"
                      ) {
                        return false;
                      }

            return (
              statusUpper === "NEW" ||
              statusUpper === "PENDING" ||
              subStatusUpper === "DOCUMENTS REQUIRED" ||
              subStatusUpper === "ACTION REQUIRED" ||
              subStatusUpper === "CHARGEBACK NEW" ||
              subStatusUpper === "PRE-ARBITRATION NEW" ||
              subStatusUpper === "ARBITRATION NEW" ||
              subStatusUpper === "NEW" ||
              subStatusUpper.includes("NEW") ||
              subStatusUpper.includes("REQUIRED") ||
              subStatusUpper.includes("RESUBMIT")
            );
          };
          const canTakeAction =
            (userType === "merchant" || userType === "partner") &&
            isNewDisputeDetail(selectedRecord);
          return (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Dispute ID: {selectedRecord.id}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      Reference RRN: {selectedRecord.rrn}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {canTakeAction && (
                      <button
                        type="button"
                        onClick={() => {
                          const rec = selectedRecord;
                          setSelectedRecord(null);
                          if (userType === "merchant" || userType === "partner") {
                            setMerchantModalRecord(rec);
                            setMerchantModalStep("initial");
                          } else {
                            setActionRecord(rec);
                            setActionType(null);
                          }
                        }}
                        className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap inline-flex items-center justify-center"
                      >
                        Take Action
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(null)}
                      className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1 cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {/* Modal Body Container split into two panels on desktop */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gray-50/40">
                  {/* Left Panel: Dispute Details (lg:col-span-5) */}
                  <div className="lg:col-span-5 space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-2xs h-fit">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-[#800000] rounded-full inline-block"></span>
                      Dispute Details
                    </h4>
                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between border-b border-gray-50 pb-1.5">
                        <span className="text-gray-500 font-medium">
                          Order ID
                        </span>
                        <span className="font-semibold text-gray-900 font-mono">
                          {selectedRecord.id.replace("CB", "ORD")}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-1.5">
                        <span className="text-gray-500 font-medium">
                          Transaction ID
                        </span>
                        <span className="font-semibold text-gray-900 font-mono">
                          {selectedRecord.id}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-1.5">
                        <span className="text-gray-500 font-medium">
                          Transaction Amount
                        </span>
                        <span className="font-bold text-gray-900">
                          ₹{" "}
                          {selectedRecord.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-1.5">
                        <span className="text-gray-500 font-medium">
                          Dispute Amount
                        </span>
                        <span className="font-bold text-[#800000] text-sm">
                          ₹{" "}
                          {selectedRecord.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-1.5">
                        <span className="text-gray-500 font-medium">
                          Payment Method
                        </span>
                        <span className="font-semibold text-gray-900">
                          {selectedRecord.cardNetwork === "RuPay"
                            ? "UPI"
                            : selectedRecord.cardNetwork}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-1.5">
                        <span className="text-gray-500 font-medium">
                          Dispute Type
                        </span>
                        <span className="font-semibold text-gray-900">
                          {getAdjustmentType(selectedRecord)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-1.5">
                        <span className="text-gray-500 font-medium">
                          Responded By
                        </span>
                        <span className="font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                          2026-08-05
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="text-gray-500 font-medium block mb-1">
                          Dispute Reason
                        </span>
                        <div className="bg-rose-50/40 border border-rose-100/60 p-2.5 rounded-lg text-gray-700 leading-relaxed text-[11px] font-medium">
                          <span className="font-bold text-[#800000] block mb-0.5">
                            Reason Code: {selectedRecord.reasonCode}
                          </span>
                          {getAdjustmentType(selectedRecord)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-500 font-medium">
                          Current Status
                        </span>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] border ${getStatusBadgeClass(selectedRecord.status)}`}
                        >
                          {selectedRecord.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Right Panel: Timeline & Chat messages (lg:col-span-7) */}
                  <div className="lg:col-span-7 flex flex-col bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-3 bg-blue-600 rounded-full inline-block"></span>
                        Timeline & Chat History
                      </h4>
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded">
                        {timeline.length} Events
                      </span>
                    </div>
                    {/* Message/Timeline Area scrollable */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[350px] min-h-[220px]">
                      {timeline.map((item, idx) => {
                        const isUser =
                          item.by === "masteruser" || item.by === "nsdladmin";
                        return (
                          <div
                            key={idx}
                            className={`flex gap-3.5 items-start ${isUser ? "flex-row-reverse" : ""}`}
                          >
                            {/* Visual Avatar Bubble */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${isUser ? "bg-[#800000] text-white" : "bg-gray-200 text-gray-700"}`}
                            >
                              {item.by.slice(0, 2).toUpperCase()}
                            </div>
                            {/* Message bubble */}
                            <div
                              className={`max-w-[80%] rounded-2xl p-3 border ${isUser ? "bg-rose-50/40 border-rose-100 text-gray-800 rounded-tr-none" : "bg-gray-50 border-gray-100 text-gray-800 rounded-tl-none"}`}
                            >
                              <div className="flex items-center justify-between gap-4 mb-1">
                                <span className="text-[11px] font-bold text-gray-900">
                                  {item.title}
                                </span>
                                <span className="text-[9px] text-gray-400 font-mono font-medium">
                                  {item.time}
                                </span>
                              </div>
                              {item.remarks && (
                                <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                                  {item.remarks}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Reply Input Box */}
                    <div className="border-t pt-3 mt-4 space-y-2">
                      <div className="flex gap-2 items-center bg-gray-50 border border-gray-200 rounded-lg p-1.5 focus-within:border-[#800000] focus-within:ring-1 focus-within:ring-[#800000]/20 transition-all">
                        <input
                          type="text"
                          placeholder="Type a message or response details..."
                          value={replyInput}
                          onChange={(e) => setReplyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendReply(selectedRecord.id);
                            }
                          }}
                          className="flex-1 bg-transparent text-xs text-gray-800 px-2 focus:outline-none"
                        />

                        {/* Attachment Dummy Button */}
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              "Attachments are supported for contest evidence files. Use Take Action to upload official proof.",
                            )
                          }
                          className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
                          title="Attach Proof"
                        >
                          <span className="text-sm">📎</span>
                        </button>

                        {/* Send Button */}
                        <button
                          type="button"
                          onClick={() => handleSendReply(selectedRecord.id)}
                          disabled={!replyInput.trim()}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${replyInput.trim() ? "bg-[#800000] text-white hover:bg-[#680000]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                          title="Send Message"
                        >
                          <span className="text-xs font-bold">➤</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 pl-1">
                        Press Enter or click send to log remarks to this dispute
                        case.
                      </p>
                    </div>
                  </div>
                </div>
                {/* Modal Footer */}
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="bg-[#800000] text-white hover:bg-[#680000] px-6 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs uppercase tracking-wider"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      {/* TAKE ACTION FOR DISPUTE! MODAL (High-Fidelity) */}
      {actionRecord && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Title Banner matching image */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800 tracking-tight uppercase">
                Take Action For Dispute!
              </h2>
              <button
                type="button"
                onClick={() => {
                  setActionRecord(null);
                  setActionType(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content Container */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {/* ACTION SELECTION PANEL WHEN NOT YET CHOSEN */}
              {!actionType && (
                <div className="py-4 text-center space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Select Action For Dispute ID:{" "}
                      <span className="text-[#800000]">{actionRecord.id}</span>
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      RRN: {actionRecord.rrn}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">
                        User ID:
                      </span>
                      <span className="font-mono font-bold text-gray-800">
                        {actionRecord.userId || "2222257001642755"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">
                        User Name:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {actionRecord.userName || "masteruser"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">
                        Transaction Amount:
                      </span>
                      <span className="font-bold text-[#800000] text-sm">
                        ₹{" "}
                        {actionRecord.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">
                        Current Status:
                      </span>
                      <span className="font-bold text-blue-700">
                        {actionRecord.status}
                      </span>
                    </div>

                    {/* If Partially Accepted, show partial details */}
                    {actionRecord.status === "Partially Accepted" && (
                      <div className="border-t border-amber-200/80 pt-2.5 mt-2 space-y-2">
                        <div className="flex justify-between items-center bg-amber-50/80 px-3 py-2 rounded-lg border border-amber-200">
                          <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                            <Percent className="w-3.5 h-3.5 text-amber-700" />
                            Partial Accepted Amount:
                          </span>
                          <span className="font-bold text-amber-950 text-xs">
                            ₹ {(actionRecord.partialAmount || Math.round(actionRecord.amount / 2)).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        {actionRecord.partialReason && (
                          <div className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/60 text-left">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block mb-0.5">
                              Merchant Justification:
                            </span>
                            <span className="text-xs text-gray-700 italic">
                              "{actionRecord.partialReason}"
                            </span>
                          </div>
                        )}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setViewEvidenceRecord(actionRecord)}
                            className="text-xs font-bold text-[#800000] hover:text-[#600000] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Submitted Evidence</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                    {(userType === "merchant" || userType === "partner") && actionRecord.status !== "Partially Accepted" ? (
                      <>
                        Please choose whether to <strong>Consider</strong> (Approve),{" "}
                        <strong>Partially Accept</strong>, or <strong>Decline</strong> this chargeback request.
                      </>
                    ) : (
                      <>
                        Please choose whether to <strong>Consider</strong> (Approve) or{" "}
                        <strong>Decline</strong> this chargeback request.
                      </>
                    )}
                  </p>

                  {(userType === "merchant" || userType === "partner") && actionRecord.status !== "Partially Accepted" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
                      <button
                        type="button"
                        onClick={() => setActionType("accept")}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3.5 px-3 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Consider</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const rec = actionRecord;
                          setActionRecord(null);
                          setActionType(null);
                          setPartialModalRecord(rec);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3.5 px-3 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                        title="Partially accept with reason and evidence"
                      >
                        <Percent className="w-4 h-4 shrink-0" />
                        <span>Partially Accept</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActionType("reject")}
                        className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs py-3.5 px-3 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>Decline</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
                      <button
                        type="button"
                        onClick={() => setActionType("accept")}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Consider</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActionType("reject")}
                        className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ACCEPT CONFIRMATION STREAM (Image 2) */}
              {actionType === "accept" && (
                <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-6">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-2">
                    Confirmation!
                  </h3>
                  <div className="text-center space-y-2 max-w-sm">
                    <p className="text-sm font-semibold text-gray-800">
                      {actionRecord.status === "Partially Accepted"
                        ? `Are you sure you want to approve the partial settlement of ₹${(actionRecord.partialAmount || Math.round(actionRecord.amount / 2)).toLocaleString('en-IN')}?`
                        : "Are you sure you want to accept the chargeback?"}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {actionRecord.status === "Partially Accepted"
                        ? "On confirmation, the partial refund will be credited to the customer and the dispute will be settled."
                        : "On confirmation, the refund process to the customer will be initiated."}
                    </p>
                  </div>
                  {/* Confirmation block Buttons */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateStatus) {
                          onUpdateStatus(
                            actionRecord.id,
                            "Accepted",
                            actionRecord.status === "Partially Accepted"
                              ? "Partial Settlement Approved"
                              : "Considered & Approved",
                          );
                        }
                        setActionSuccessModal({
                          type: "consider",
                          record: actionRecord,
                        });
                        setActionRecord(null);
                        setActionType(null);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-md cursor-pointer transition-colors uppercase tracking-wider flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Yes, Consider & Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionRecord(null);
                        setActionType(null);
                      }}
                      className="border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs px-8 py-3 rounded-xl cursor-pointer transition-all uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* REJECT DECLINE REQUEST STREAM */}
              {actionType === "reject" && (
                <div className="space-y-5">
                  {/* Headline & helper text */}
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-[#800000]" />
                      Decline Dispute Request
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Please enter the rejection remark and attach supporting
                      document if needed.
                    </p>
                  </div>
                  {/* Grid of read-only prefilled parameters (RRN, Txn ID, Amount, Status, Created Date) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">
                        RRN
                      </label>
                      <input
                        type="text"
                        value={actionRecord.rrn}
                        disabled
                        className="w-full bg-white border border-gray-200 text-gray-800 font-mono font-bold text-xs px-3 py-1.5 rounded-lg cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">
                        Transaction ID
                      </label>
                      <input
                        type="text"
                        value={actionRecord.id}
                        disabled
                        className="w-full bg-white border border-gray-200 text-gray-800 font-mono font-bold text-xs px-3 py-1.5 rounded-lg cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">
                        Amount
                      </label>
                      <input
                        type="text"
                        value={`₹ ${actionRecord.amount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                          },
                        )}`}
                        disabled
                        className="w-full bg-white border border-gray-200 text-[#800000] font-bold text-xs px-3 py-1.5 rounded-lg cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">
                        User / Merchant
                      </label>
                      <input
                        type="text"
                        value={`${actionRecord.userName || "masteruser"} (${actionRecord.userId || "2222257001642755"})`}
                        disabled
                        className="w-full bg-white border border-gray-200 text-gray-800 font-medium text-xs px-3 py-1.5 rounded-lg cursor-not-allowed truncate"
                      />
                    </div>
                  </div>
                  {/* Reason for Rejection / Rejection Remark input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span>
                        Rejection Remark / Reason for Decline
                        <span className="text-red-500">*</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        Mandatory
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter the detailed rejection remark explaining why this dispute is declined..."
                      className="w-full border border-gray-300 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000] bg-white shadow-xs"
                    />
                  </div>
                  {/* Single Clean Attachment Input */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-800">
                      Attachment (Optional)
                    </label>
                    <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/80 hover:bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 text-[#800000] flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">
                            Attach Supporting Document
                          </span>
                          <span className="text-[11px] text-gray-400 block">
                            Upload rejection notice or proof letter (PDF, JPG,
                            PNG - Max 5MB)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {evidenceFiles["singleAttachment"] ? (
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 text-xs font-semibold">
                            <span className="truncate max-w-[180px]">
                              📄 {evidenceFiles["singleAttachment"]}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEvidenceFiles((prev) => ({
                                  ...prev,
                                  singleAttachment: "",
                                }))
                              }
                              className="text-red-500 hover:text-red-700 font-bold p-0.5 cursor-pointer ml-1"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              id="admin-single-attachment-input"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setEvidenceFiles((prev) => ({
                                    ...prev,
                                    singleAttachment: file.name,
                                  }));
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                document
                                  .getElementById(
                                    "admin-single-attachment-input",
                                  )
                                  ?.click()
                              }
                              className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5 rotate-180" />
                              <span>Attach File</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      disabled={!rejectionReason.trim()}
                      onClick={() => {
                        const currentRecord = {
                          ...actionRecord,
                        };
                        currentRecord.remarks = rejectionReason;
                        if (evidenceFiles["singleAttachment"]) {
                          currentRecord.subStatus = `Declined (${evidenceFiles["singleAttachment"]})`;
                        }
                        if (onUpdateStatus) {
                          onUpdateStatus(
                            currentRecord.id,
                            "Rejected",
                            "Declined by Admin",
                          );
                        }
                        setActionSuccessModal({
                          type: "decline",
                          record: currentRecord,
                          remarks: rejectionReason,
                          fileName: evidenceFiles["singleAttachment"],
                        });
                        setActionRecord(null);
                        setActionType(null);
                        setRejectionReason("");
                        setEvidenceFiles({});
                      }}
                      className={`font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider ${rejectionReason.trim() ? "bg-[#800000] hover:bg-[#680000] text-white shadow-md" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                    >
                      Submit Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionRecord(null);
                        setActionType(null);
                        setRejectionReason("");
                        setEvidenceFiles({});
                      }}
                      className="border border-gray-300 text-gray-700 font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ADJUSTMENT HISTORY MODAL (E-Commerce Platform AWB Tracking Style) */}
      {historyRecord && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-4 bg-[#800000] rounded-full inline-block"></span>
                  Dispute Lifecycle & AWB Tracking History
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  RRN: {historyRecord.rrn} | Dispute ID: {historyRecord.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryRecord(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">
                    User / Merchant
                  </span>
                  <span className="font-bold text-gray-800">
                    {historyRecord.userName || "masteruser"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">
                    Amount
                  </span>
                  <span className="font-bold text-[#800000]">
                    ₹{" "}
                    {historyRecord.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">
                    Current Status
                  </span>
                  <span
                    className={`font-bold ${historyRecord.status === "Rejected" || historyRecord.status === "Declined" ? "text-red-700" : "text-emerald-700"}`}
                  >
                    {historyRecord.status}
                  </span>
                </div>
              </div>
              {/* Vertical Timeline (AWB Tracking) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] border-b pb-2 flex items-center justify-between">
                  <span>Tracking Events</span>
                  <span className="font-mono text-[10px] text-gray-500">
                    AWB-{historyRecord.rrn}
                  </span>
                </h4>
                <div className="relative pl-6 space-y-5 pt-1 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300">
                  {/* Node 1: Dispute Raised */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                      ✓
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs">
                          Chargeback Raised / Initiated
                        </span>
                        <span className="font-mono text-[10px] text-gray-500 font-semibold">
                          {historyRecord.transactionDate || "2026-07-27"}{" "}
                          10:15:30 AM
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 flex items-center gap-2">
                        <span>
                          Actor: <strong>Issuer Bank / Customer</strong>
                        </span>
                        <span>•</span>
                        <span className="text-blue-700 font-bold">
                          Status: Chargeback New
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between text-[11px] mt-1">
                        <span className="font-medium text-gray-700">
                          Dispute Notice
                        </span>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(
                              `Downloading Chargeback_Notice_${historyRecord.rrn}.pdf`,
                            );
                          }}
                          className="text-[#800000] font-bold hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Chargeback_Notice_
                          {historyRecord.rrn}.pdf
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* Node 2: Merchant Evidence Submitted */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                      ✓
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs">
                          Merchant Evidence Uploaded
                        </span>
                        <span className="font-mono text-[10px] text-gray-500 font-semibold">
                          {historyRecord.transactionDate || "2026-07-27"}{" "}
                          02:45:12 PM
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 flex items-center gap-2">
                        <span>
                          Actor:{" "}
                          <strong>
                            Merchant ({historyRecord.userName || "masteruser"})
                          </strong>
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">
                          Status: Evidence Submitted
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between text-[11px] mt-1">
                        <span className="font-medium text-gray-700">
                          Uploaded Evidence Document
                        </span>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(
                              `Downloading Merchant_Evidence_${historyRecord.rrn}.pdf`,
                            );
                          }}
                          className="text-[#800000] font-bold hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Merchant_Evidence_
                          {historyRecord.rrn}.pdf
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* Node 3: Partner Review */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                      ✓
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs">
                          Partner / Bank Verification
                        </span>
                        <span className="font-mono text-[10px] text-gray-500 font-semibold">
                          2026-07-28 09:10:05 AM
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 flex items-center gap-2">
                        <span>
                          Actor: <strong>iServeU Partner Core</strong>
                        </span>
                        <span>•</span>
                        <span className="text-purple-700 font-bold">
                          Status: Under Review
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between text-[11px] mt-1">
                        <span className="font-medium text-gray-700">
                          Partner Audit Document
                        </span>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(
                              `Downloading Partner_Notice_${historyRecord.rrn}.pdf`,
                            );
                          }}
                          className="text-purple-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Partner_Notice_
                          {historyRecord.rrn}.pdf
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* Node 4: Admin Action (Declined or Considered) */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-xs ${historyRecord.status === "Rejected" || historyRecord.status === "Declined" ? "bg-red-600" : historyRecord.status === "Accepted" ? "bg-emerald-600" : "bg-amber-500"}`}
                    >
                      {historyRecord.status === "Rejected" ||
                      historyRecord.status === "Declined"
                        ? "✕"
                        : historyRecord.status === "Accepted"
                          ? "✓"
                          : "•"}
                    </div>
                    <div
                      className={`bg-white p-3 rounded-lg border shadow-2xs space-y-1.5 ${historyRecord.status === "Rejected" || historyRecord.status === "Declined" ? "border-red-200 bg-red-50/20" : historyRecord.status === "Accepted" ? "border-emerald-200 bg-emerald-50/20" : "border-amber-200"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs">
                          {historyRecord.status === "Rejected" ||
                          historyRecord.status === "Declined"
                            ? "Admin Action: Dispute Declined"
                            : historyRecord.status === "Accepted"
                              ? "Admin Action: Considered & Approved"
                              : "Admin Action Pending"}
                        </span>
                        <span className="font-mono text-[10px] text-gray-500 font-semibold">
                          2026-07-28 11:22:45 AM
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 flex items-center gap-2">
                        <span>
                          Actor: <strong>NSDL Admin</strong>
                        </span>
                        <span>•</span>
                        <span
                          className={`font-bold ${historyRecord.status === "Rejected" || historyRecord.status === "Declined" ? "text-red-700" : "text-emerald-700"}`}
                        >
                          Status: {historyRecord.status}
                        </span>
                      </div>
                      {/* REJECTION REMARK DISPLAYED PROMINENTLY */}
                      {(historyRecord.status === "Rejected" ||
                        historyRecord.status === "Declined" ||
                        historyRecord.remarks) && (
                        <div className="bg-red-50 border border-red-200/80 rounded-lg p-2.5 mt-2 space-y-1">
                          <span className="font-bold text-red-900 block text-[10px] uppercase tracking-wider">
                            Rejection Remark / Reason:
                          </span>
                          <p className="text-red-950 font-medium text-[11px] leading-relaxed">
                            {historyRecord.remarks ||
                              historyRecord.reasonDescription ||
                              "Merchant documentation verified as insufficient per NPCI Network rules. Dispute declined."}
                          </p>
                        </div>
                      )}
                      {/* ADMIN ATTACHMENT */}
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between text-[11px] mt-1">
                        <span className="font-medium text-gray-700">
                          Admin Decision Notice
                        </span>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(
                              `Downloading Admin_Notice_${historyRecord.rrn}.pdf`,
                            );
                          }}
                          className="text-[#800000] font-bold hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Admin_Notice_
                          {historyRecord.rrn}.pdf
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryRecord(null)}
                className="bg-[#800000] hover:bg-[#680000] text-white px-6 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors uppercase tracking-wider"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
      {/* REMARKS MODAL */}
      {remarksRecord && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Dispute Remarks & Notes
              </h3>
              <button
                onClick={() => setRemarksRecord(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-3 rounded border">
                <span className="font-bold text-gray-800 block mb-1">
                  System Audit Note:
                </span>
                <p className="text-gray-600">
                  Dispute initiated successfully with transaction reference RRN{" "}
                  <span className="font-mono">{remarksRecord.rrn}</span>. Settle
                  status is under evaluation.
                </p>
              </div>
              {remarksRecord.status === "Accepted" && (
                <div className="bg-emerald-50 p-3 rounded border border-emerald-100">
                  <span className="font-bold text-emerald-800 block mb-1">
                    Merchant Decision:
                  </span>
                  <p className="text-emerald-700">
                    Dispute has been accepted by Paritosh Upadhyay on behalf of
                    the merchant. Settle fund transaction scheduled.
                  </p>
                </div>
              )}
              {remarksRecord.status === "Rejected" && (
                <div className="bg-red-50 p-3 rounded border border-red-100">
                  <span className="font-bold text-red-800 block mb-1">
                    Decline Reason:
                  </span>
                  <p className="text-red-700 font-semibold">
                    Customer provided transaction signature. Supporting
                    documents (Invoice and Service Delivery confirmation)
                    uploaded to server.
                  </p>
                </div>
              )}
            </div>
            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setRemarksRecord(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MERCHANT ROLE DISPUTE ACTION MODAL FLOW (Pasted HTML spec) */}
      {/* ======================================================== */}
      {merchantModalRecord && merchantModalStep && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          {/* STAGE 1: INITIAL SELECTION MODAL */}
          {merchantModalStep === "initial" && (
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Take Action For Dispute!
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setMerchantModalRecord(null);
                    setMerchantModalStep(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-7 text-center space-y-6">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  Take Action For Dispute ID:{" "}
                  <span className="text-[#800000]">
                    {merchantModalRecord.id}!
                  </span>
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                  Kindly respond before deadline and help us represent the case
                  in your favour. If no response is received before deadline,
                  the dispute will be deemed accepted.
                </p>
                <div className="space-y-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResponseSelect("accept");
                      setMerchantModalStep("accept_confirm");
                    }}
                    className="w-full bg-[#1864ff] hover:bg-[#1255db] text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-full transition-all cursor-pointer shadow-xs uppercase tracking-wider"
                  >
                    Accept Dispute
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rec = merchantModalRecord;
                      setMerchantModalRecord(null);
                      setMerchantModalStep(null);
                      setPartialModalRecord(rec);
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-full transition-all cursor-pointer shadow-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Percent className="w-4 h-4 shrink-0" />
                    <span>Partially Accept</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMerchantModalStep("decline_form");
                    }}
                    className="w-full border-2 border-[#800000] hover:bg-rose-50/60 text-[#800000] font-bold text-xs sm:text-sm py-3.5 px-6 rounded-full transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Contest Dispute & Submit Evidence
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: ACCEPT CONFIRMATION MODAL WITH SVG */}
          {merchantModalStep === "accept_confirm" && (
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Ticket Action For Dispute ID: {merchantModalRecord.id}
                </h3>
                <button
                  type="button"
                  onClick={() => setMerchantModalStep("initial")}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50 space-y-5">
                  <h4 className="text-sm font-bold text-gray-800 border-b pb-2">
                    Confirmation!
                  </h4>
                  {/* Remarks input in accept confirm */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Remarks
                    </label>
                    <textarea
                      value={merchantRemarksText}
                      onChange={(e) => setMerchantRemarksText(e.target.value)}
                      placeholder="Enter remarks (optional)"
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-[#800000]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMerchantModalStep("initial")}
                      className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs px-5 py-2 rounded-lg cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateStatus) {
                          onUpdateStatus(
                            merchantModalRecord.id,
                            "Accepted",
                            "Merchant Accepted",
                          );
                        }
                        setMerchantModalStep("success_accepted");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Accept Dispute
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: CONTEST DISPUTE / DECLINE REQUEST FORM */}
          {merchantModalStep === "decline_form" && (
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Ticket Action For Dispute ID: {merchantModalRecord.id}
                </h3>
                <button
                  type="button"
                  onClick={() => setMerchantModalStep("initial")}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                {/* Radio switch to let them go back to Accept */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Select Your Response
                  </label>
                  <div className="flex flex-wrap gap-4 sm:gap-6 pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="merchantContestResp"
                        value="accept"
                        checked={false}
                        onChange={() => {
                          setResponseSelect("accept");
                          setMerchantModalStep("accept_confirm");
                        }}
                        className="accent-[#800000] w-4 h-4 cursor-pointer"
                      />
                      <span>Accept Dispute</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-700 cursor-pointer">
                      <input
                        type="radio"
                        name="merchantContestResp"
                        value="partial"
                        checked={false}
                        onChange={() => {
                          const rec = merchantModalRecord;
                          setMerchantModalRecord(null);
                          setMerchantModalStep(null);
                          setPartialModalRecord(rec);
                        }}
                        className="accent-amber-600 w-4 h-4 cursor-pointer"
                      />
                      <span>Partially Accept Dispute</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#800000] cursor-pointer">
                      <input
                        type="radio"
                        name="merchantContestResp"
                        value="contest"
                        checked={true}
                        readOnly
                        className="accent-[#800000] w-4 h-4 cursor-pointer"
                      />
                      <span>Contest Dispute & Submit Evidence</span>
                    </label>
                  </div>
                </div>
                {/* Subtitle banner */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3">
                  <h4 className="text-xs font-bold text-rose-900 uppercase">
                    Decline Request
                  </h4>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Please upload the document & Reason. The evidence will be
                    shared with the bank for review. Supported formats: JPEG,
                    PNG, PDF (Max 20MB).
                  </p>
                </div>
                {/* Read only parameters exactly matching decline form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                      RRN*
                    </label>
                    <input
                      type="text"
                      value={merchantModalRecord.rrn}
                      disabled
                      className="w-full bg-white border border-gray-200 text-gray-600 font-mono text-xs px-3 py-1.5 rounded-md cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                      Transaction Id*
                    </label>
                    <input
                      type="text"
                      value={merchantModalRecord.id}
                      disabled
                      className="w-full bg-white border border-gray-200 text-gray-600 font-mono text-xs px-3 py-1.5 rounded-md cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                      Amount*
                    </label>
                    <input
                      type="text"
                      value={`₹ ${merchantModalRecord.amount.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                        },
                      )}`}
                      disabled
                      className="w-full bg-white border border-gray-200 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-md cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                      Status
                    </label>
                    <input
                      type="text"
                      value="Chargeback Raise"
                      disabled
                      className="w-full bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-md cursor-not-allowed"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                      Created Date*
                    </label>
                    <input
                      type="text"
                      value={merchantModalRecord.transactionDate}
                      disabled
                      className="w-full bg-white border border-gray-200 text-gray-600 font-mono text-xs px-3 py-1.5 rounded-md cursor-not-allowed"
                    />
                  </div>
                </div>
                {/* Evidence uploads with simulation */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-1.5">
                    Submit Evidence (Upload Evidence 1 to 5)
                  </h4>
                  {/* Evidence 1 */}
                  <div
                    onDragOver={(e) => handleDragOver(e, "evidence1")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "evidence1", true)}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${dragOverKey === "evidence1" ? "bg-rose-50 border-dashed border-[#800000] scale-[1.01]" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"}`}
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">
                        Upload Evidence 1
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Delivery proof, dispatch logs, or shipping receipt
                      </span>
                    </div>
                    {uploadedEvidence.evidence1 ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-semibold text-[#800000] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full max-w-[200px] truncate"
                          title={uploadedEvidence.evidence1}
                        >
                          📄 {uploadedEvidence.evidence1}
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerMerchantRemoveFile("evidence1")}
                          className="text-red-500 font-bold hover:text-red-700 text-xs px-1.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          id="merchant-file-input-evidence1"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange("evidence1", e, true)
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById("merchant-file-input-evidence1")
                              ?.click()
                          }
                          className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-xs"
                        >
                          ☁ Choose a file
                        </button>
                      </>
                    )}
                  </div>
                  {/* Evidence 2 */}
                  <div
                    onDragOver={(e) => handleDragOver(e, "evidence2")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "evidence2", true)}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${dragOverKey === "evidence2" ? "bg-rose-50 border-dashed border-[#800000] scale-[1.01]" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"}`}
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">
                        Upload Evidence 2
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Invoice copy, service contract, or bill statement
                      </span>
                    </div>
                    {uploadedEvidence.evidence2 ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-semibold text-[#800000] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full max-w-[200px] truncate"
                          title={uploadedEvidence.evidence2}
                        >
                          📄 {uploadedEvidence.evidence2}
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerMerchantRemoveFile("evidence2")}
                          className="text-red-500 font-bold hover:text-red-700 text-xs px-1.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          id="merchant-file-input-evidence2"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange("evidence2", e, true)
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById("merchant-file-input-evidence2")
                              ?.click()
                          }
                          className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-xs"
                        >
                          ☁ Choose a file
                        </button>
                      </>
                    )}
                  </div>
                  {/* Evidence 3 */}
                  <div
                    onDragOver={(e) => handleDragOver(e, "evidence3")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "evidence3", true)}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${dragOverKey === "evidence3" ? "bg-rose-50 border-dashed border-[#800000] scale-[1.01]" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"}`}
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">
                        Upload Evidence 3
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Refund receipt, cancellation note, or credit memo
                      </span>
                    </div>
                    {uploadedEvidence.evidence3 ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-semibold text-[#800000] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full max-w-[200px] truncate"
                          title={uploadedEvidence.evidence3}
                        >
                          📄 {uploadedEvidence.evidence3}
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerMerchantRemoveFile("evidence3")}
                          className="text-red-500 font-bold hover:text-red-700 text-xs px-1.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          id="merchant-file-input-evidence3"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange("evidence3", e, true)
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById("merchant-file-input-evidence3")
                              ?.click()
                          }
                          className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-xs"
                        >
                          ☁ Choose a file
                        </button>
                      </>
                    )}
                  </div>
                  {/* Evidence 4 */}
                  <div
                    onDragOver={(e) => handleDragOver(e, "evidence4")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "evidence4", true)}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${dragOverKey === "evidence4" ? "bg-rose-50 border-dashed border-[#800000] scale-[1.01]" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"}`}
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">
                        Upload Evidence 4
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Customer communication, email transcripts, or consent
                        logs
                      </span>
                    </div>
                    {uploadedEvidence.evidence4 ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-semibold text-[#800000] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full max-w-[200px] truncate"
                          title={uploadedEvidence.evidence4}
                        >
                          📄 {uploadedEvidence.evidence4}
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerMerchantRemoveFile("evidence4")}
                          className="text-red-500 font-bold hover:text-red-700 text-xs px-1.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          id="merchant-file-input-evidence4"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange("evidence4", e, true)
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById("merchant-file-input-evidence4")
                              ?.click()
                          }
                          className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-xs"
                        >
                          ☁ Choose a file
                        </button>
                      </>
                    )}
                  </div>
                  {/* Evidence 5 */}
                  <div
                    onDragOver={(e) => handleDragOver(e, "evidence5")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "evidence5", true)}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${dragOverKey === "evidence5" ? "bg-rose-50 border-dashed border-[#800000] scale-[1.01]" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"}`}
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">
                        Upload Evidence 5
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Additional supporting document or bank statement
                      </span>
                    </div>
                    {uploadedEvidence.evidence5 ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-semibold text-[#800000] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full max-w-[200px] truncate"
                          title={uploadedEvidence.evidence5}
                        >
                          📄 {uploadedEvidence.evidence5}
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerMerchantRemoveFile("evidence5")}
                          className="text-red-500 font-bold hover:text-red-700 text-xs px-1.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          id="merchant-file-input-evidence5"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange("evidence5", e, true)
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById("merchant-file-input-evidence5")
                              ?.click()
                          }
                          className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-xs"
                        >
                          ☁ Choose a file
                        </button>
                      </>
                    )}
                  </div>
                  {/* Render additional rows if added */}
                  {additionalEvidenceRows.map((label, idx) => {
                    const rowKey = `additional_${idx}`;
                    return (
                      <div
                        key={rowKey}
                        onDragOver={(e) => handleDragOver(e, rowKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, rowKey, true)}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${dragOverKey === rowKey ? "bg-rose-50 border-dashed border-[#800000] scale-[1.01]" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"}`}
                      >
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">
                            {label}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Additional merchant support documents
                          </span>
                        </div>
                        {uploadedEvidence[rowKey] ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-xs font-semibold text-[#800000] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full max-w-[200px] truncate"
                              title={uploadedEvidence[rowKey]}
                            >
                              📄 {uploadedEvidence[rowKey]}
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerMerchantRemoveFile(rowKey)}
                              className="text-red-500 font-bold hover:text-red-700 text-xs px-1.5 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              id={`merchant-file-input-${rowKey}`}
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) =>
                                handleFileChange(rowKey, e, true)
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                document
                                  .getElementById(
                                    `merchant-file-input-${rowKey}`,
                                  )
                                  ?.click()
                              }
                              className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-xs"
                            >
                              ☁ Choose a file
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {/* Add more button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newIdx = additionalEvidenceRows.length + 1;
                      setAdditionalEvidenceRows((prev) => [
                        ...prev,
                        `Additional Evidence ${newIdx}`,
                      ]);
                    }}
                    className="text-xs font-bold text-[#800000] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    ➕ Add Additional Evidence
                  </button>
                </div>
                {/* Additional Remarks input */}
                <div className="space-y-1.5 pt-2 border-t">
                  <label className="block text-xs font-bold text-gray-700">
                    Reason for Rejection / Additional Remarks
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={rejectionReasonText}
                    onChange={(e) => setRejectionReasonText(e.target.value)}
                    placeholder="Maximum 500 Characters. Please detail why this dispute should be declined..."
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
                  />
                  <div className="text-right text-[10px] text-gray-400 font-mono">
                    {rejectionReasonText.length}/500 Characters
                  </div>
                </div>
                {/* Evidence Required Alert Banner */}
                {!Object.values(uploadedEvidence).some((val) => Boolean(val && String(val).trim())) && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>Evidence Required:</strong> As a merchant or partner, you cannot reject a chargeback without uploading at least one piece of evidence.
                    </span>
                  </div>
                )}
                {/* Cancel & Submit */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setMerchantModalStep("initial")}
                    className="border border-[#800000] text-[#800000] font-bold text-xs px-6 py-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      !rejectionReasonText.trim() ||
                      !Object.values(uploadedEvidence).some((val) => Boolean(val && String(val).trim()))
                    }
                    onClick={() => {
                      if (!Object.values(uploadedEvidence).some((val) => Boolean(val && String(val).trim()))) {
                        alert("As a merchant or partner, you cannot reject a chargeback without uploading at least one piece of evidence.");
                        return;
                      }
                      if (onUpdateStatus) {
                        onUpdateStatus(
                          merchantModalRecord.id,
                          "Pending",
                          "Evidence Submitted",
                        );
                      }
                      setMerchantModalStep("success_evidence");
                    }}
                    className={`font-bold text-xs px-6 py-2.5 rounded-lg transition-all cursor-pointer uppercase ${
                      rejectionReasonText.trim() &&
                      Object.values(uploadedEvidence).some((val) => Boolean(val && String(val).trim()))
                        ? "bg-[#800000] hover:bg-[#680000] text-white shadow-md"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS ACCEPTED MODAL */}
          {merchantModalStep === "success_accepted" && (
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-6 text-center space-y-6">
                {/* Checkmark SVG circle graphic */}
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-[#800000]/10 flex items-center justify-center animate-ping absolute opacity-30" />
                  <div className="w-16 h-16 rounded-full bg-[#800000] flex items-center justify-center shadow-lg relative">
                    <svg
                      className="w-9 h-9 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-gray-900">
                    Dispute Accepted Successfully!
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    Dispute Amount will be refunded to your customer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMerchantModalRecord(null);
                    setMerchantModalStep(null);
                  }}
                  className="bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs py-2.5 px-8 rounded-lg cursor-pointer transition-colors w-full"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS EVIDENCE SUBMITTED MODAL */}
          {merchantModalStep === "success_evidence" && (
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-6 text-center space-y-6">
                {/* Green Checkmark SVG circular banner */}
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-ping absolute opacity-30" />
                  <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg relative">
                    <svg
                      className="w-9 h-9 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-gray-900">
                    Evidence Submitted Successfully!
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                    Your evidence has been submitted for review. The internal
                    team will evaluate and update the status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMerchantModalRecord(null);
                    setMerchantModalStep(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-8 rounded-lg cursor-pointer transition-colors w-full"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ADMIN DETAILS MODAL */}
      {detailsModalRecord &&
        (() => {
          const userId = detailsModalRecord.userId || "2222257001642755";
          const userName = detailsModalRecord.userName || "masteruser";
          const aging = detailsModalRecord.aging || "4 days";
          const hasMerchantDoc = true;
          const hasPartnerDoc = true;
          return (
            <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <div>
                    <h3 className="text-base font-bold text-gray-800">
                      Dispute Details & Attachments
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      Dispute ID: {detailsModalRecord.id} | RRN:{" "}
                      {detailsModalRecord.rrn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsModalRecord(null)}
                    className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-5 text-xs">
                  {/* Key Parameters Grid */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-[#800000] rounded-full inline-block"></span>
                      Transaction & User Information
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">
                          User ID
                        </span>
                        <span className="font-mono font-bold text-gray-800">
                          {userId}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">
                          User Name
                        </span>
                        <span className="font-bold text-gray-800">
                          {userName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">
                          RRN
                        </span>
                        <span className="font-mono font-bold text-gray-800">
                          {detailsModalRecord.rrn}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">
                          Transaction ID
                        </span>
                        <span className="font-mono font-bold text-gray-800">
                          {detailsModalRecord.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">
                          Aging
                        </span>
                        <span className="font-bold text-gray-800">{aging}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">
                          Transaction Amount
                        </span>
                        <span className="font-bold text-[#800000] text-sm">
                          ₹{" "}
                          {detailsModalRecord.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">
                          Status
                        </span>
                        <span className="font-bold text-emerald-700">
                          {detailsModalRecord.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">
                          Sub Status
                        </span>
                        <span className="font-semibold text-gray-700">
                          {detailsModalRecord.subStatus || "Chargeback New"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">
                          Created Date
                        </span>
                        <span className="font-mono text-gray-700">
                          {detailsModalRecord.transactionDate || "2026-07-27"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Remarks Section */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-blue-600 rounded-full inline-block"></span>
                      Dispute Reason & Remarks
                    </h4>
                    <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 space-y-1.5">
                      <span className="font-bold text-amber-900 block text-[11px]">
                        Reason Description:
                      </span>
                      <p className="text-gray-700 font-medium leading-relaxed">
                        {detailsModalRecord.reasonDescription ||
                          "Unauthorized Transaction / Dispute filed for non-receipt of goods or services."}
                      </p>
                      {detailsModalRecord.remarks && (
                        <div className="border-t border-amber-200/60 pt-2 mt-2">
                          <span className="font-bold text-amber-900 block text-[10px] uppercase">
                            Logged Remarks:
                          </span>
                          <p className="text-gray-700 font-mono text-[11px]">
                            {detailsModalRecord.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Partial Acceptance Details & Evidence Section if present */}
                  {(detailsModalRecord.status === "Partially Accepted" || detailsModalRecord.partialAmount) && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <span className="w-1.5 h-3 bg-amber-600 rounded-full inline-block"></span>
                        Partial Acceptance Resolution & Evidence
                      </h4>
                      <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 pb-2 border-b border-amber-200">
                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase font-bold">
                              Accepted Partial Refund
                            </span>
                            <span className="font-bold text-emerald-700 text-sm">
                              ₹ {(detailsModalRecord.partialAmount || Math.round(detailsModalRecord.amount / 2)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase font-bold">
                              Retained Merchant Balance
                            </span>
                            <span className="font-bold text-amber-900 text-sm">
                              ₹ {(detailsModalRecord.amount - (detailsModalRecord.partialAmount || Math.round(detailsModalRecord.amount / 2))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="font-bold text-amber-900 block text-[11px] mb-0.5">
                            Mandatory Partial Reason:
                          </span>
                          <p className="text-gray-800 font-medium">
                            {detailsModalRecord.partialReason || "Customer agreed to accept partial refund settlement for verified delivered services."}
                          </p>
                        </div>

                        {detailsModalRecord.partialEvidenceFiles && detailsModalRecord.partialEvidenceFiles.length > 0 && (
                          <div className="pt-2 border-t border-amber-200 space-y-1">
                            <span className="font-bold text-amber-900 block text-[11px]">
                              Evidence Attached ({detailsModalRecord.partialEvidenceFiles.length}):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {detailsModalRecord.partialEvidenceFiles.map((file, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[11px] font-semibold text-gray-800"
                                >
                                  📄 {file}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {detailsModalRecord.partialEvidenceRemarks && (
                          <p className="text-[11px] text-gray-600 font-mono">
                            Remarks: {detailsModalRecord.partialEvidenceRemarks}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attached Documents Section (Merchant & Partner / Both) */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center justify-between border-b pb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-3 bg-purple-600 rounded-full inline-block"></span>
                        Attached Documents
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Uploaded by BOTH Merchant & Partner
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Merchant Attached Document */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                            Merchant Attachment
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            PDF • 1.4 MB
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-[#800000] shrink-0" />
                          <span
                            className="font-semibold text-gray-800 truncate"
                            title={`Merchant_Evidence_${detailsModalRecord.rrn}.pdf`}
                          >
                            Merchant_Evidence_{detailsModalRecord.rrn}.pdf
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `Opening Merchant Evidence for RRN ${detailsModalRecord.rrn}`,
                              )
                            }
                            className="flex-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-[11px] py-1.5 rounded-lg transition-colors cursor-pointer text-center"
                          >
                            View Document
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const csvContent = `Merchant Evidence Document\nRRN: ${detailsModalRecord.rrn}\nDispute ID: ${detailsModalRecord.id}\nStatus: ${detailsModalRecord.status}`;
                              const blob = new Blob([csvContent], {
                                type: "text/plain",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `Merchant_Doc_${detailsModalRecord.rrn}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors cursor-pointer"
                            title="Download Merchant File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Partner Attached Document */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase">
                            Partner Attachment
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            PDF • 850 KB
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-purple-700 shrink-0" />
                          <span
                            className="font-semibold text-gray-800 truncate"
                            title={`Partner_Rejection_Notice_${detailsModalRecord.rrn}.pdf`}
                          >
                            Partner_Notice_{detailsModalRecord.rrn}.pdf
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `Opening Partner Document for RRN ${detailsModalRecord.rrn}`,
                              )
                            }
                            className="flex-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-[11px] py-1.5 rounded-lg transition-colors cursor-pointer text-center"
                          >
                            View Document
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const csvContent = `Partner / Bank Document\nRRN: ${detailsModalRecord.rrn}\nDispute ID: ${detailsModalRecord.id}\nStatus: ${detailsModalRecord.status}`;
                              const blob = new Blob([csvContent], {
                                type: "text/plain",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `Partner_Doc_${detailsModalRecord.rrn}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors cursor-pointer"
                            title="Download Partner File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex justify-between items-center">
                  {userType === "merchant" &&
                  (detailsModalRecord.status === "New" ||
                    detailsModalRecord.status === "Pending" ||
                    detailsModalRecord.status === "Under Review") ? (
                    <button
                      type="button"
                      onClick={() => {
                        const rec = detailsModalRecord;
                        setDetailsModalRecord(null);
                        setPartialModalRecord(rec);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>Partially Accept</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailsModalRecord(null)}
                    className="bg-[#800000] hover:bg-[#680000] text-white px-6 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs uppercase tracking-wider"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      {/* ADMIN ACTION REMARKS MODAL matching Screenshot */}
      {adminActionPopoverRecord && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-800">Remarks</h3>
              <button
                onClick={() => setAdminActionPopoverRecord(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Document Block */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-800 tracking-wide uppercase">
                    Document
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const csvContent =
                        "data:text/csv;charset=utf-8,Dispute ID,RRN,Status,Amount\n" +
                        `${adminActionPopoverRecord.id},${adminActionPopoverRecord.rrn},${adminActionPopoverRecord.status},${adminActionPopoverRecord.amount}`;
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "Admin_document.CSV");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-[#800000] hover:text-[#600000] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#800000]/10 flex items-center justify-center text-[#800000]">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 font-mono">
                    Admin_document.CSV
                  </span>
                </div>
              </div>
              {/* Reason Block */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-800 tracking-wide uppercase block">
                  Reason
                </span>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-700 leading-relaxed">
                  Based on internal investigation and transaction monitoring,
                  this case exhibits patterns consistent with suspicious or
                  unauthorized activity. The merchant's supporting documents do
                  not adequately address the discrepancies or provide sufficient
                  evidence to counter the risk indicators. As a result, the
                  chargeback response has been declined...
                </div>
              </div>
              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateStatus) {
                      onUpdateStatus(
                        adminActionPopoverRecord.id,
                        "Accepted",
                        "Considered by Bank Admin",
                      );
                    }
                    setAdminActionPopoverRecord(null);
                    setAdminActionSuccessToast(
                      "Chargeback considered and approved successfully!",
                    );
                    setTimeout(() => setAdminActionSuccessToast(null), 4000);
                  }}
                  className="w-full bg-[#00c853] hover:bg-[#00b24a] text-white font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                >
                  Consider
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateStatus) {
                      onUpdateStatus(
                        adminActionPopoverRecord.id,
                        "Rejected",
                        "Declined by Bank Admin",
                      );
                    }
                    setAdminActionPopoverRecord(null);
                    setAdminActionSuccessToast(
                      "Chargeback declined successfully!",
                    );
                    setTimeout(() => setAdminActionSuccessToast(null), 4000);
                  }}
                  className="w-full bg-[#d50000] hover:bg-[#b20000] text-white font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CONSIDER CONFIRMATION MODAL */}
      {considerModalRecord && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-emerald-600 border-b border-gray-100 pb-3">
              <CheckCircle2 className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Consider Chargeback
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  RRN: {considerModalRecord.rrn}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to <strong>Consider & Approve</strong> the
              dispute for RRN <strong>{considerModalRecord.rrn}</strong>{" "}
              (Amount: ₹{considerModalRecord.amount.toLocaleString("en-IN")})?
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setConsiderModalRecord(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateStatus) {
                    onUpdateStatus(
                      considerModalRecord.id,
                      "Accepted",
                      "Considered by Bank Admin",
                    );
                  }
                  setConsiderModalRecord(null);
                  setAdminActionSuccessToast(
                    "Chargeback considered and approved successfully!",
                  );
                  setTimeout(() => setAdminActionSuccessToast(null), 4000);
                }}
                className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Confirm Consider
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DECLINE MODAL WITH REJECTION REMARK INPUT FIELD */}
      {declineModalRecord && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-gray-900">
                  Decline Chargeback
                </h3>
              </div>
              <button
                onClick={() => setDeclineModalRecord(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600">
              Decline dispute for RRN <strong>{declineModalRecord.rrn}</strong>.
              Please provide a mandatory rejection remark.
            </p>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Rejection Remark / Reason{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={adminRejectionRemarkInput}
                onChange={(e) => setAdminRejectionRemarkInput(e.target.value)}
                placeholder="Enter rejection remark or reason for declining..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setDeclineModalRecord(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!adminRejectionRemarkInput.trim()}
                onClick={() => {
                  if (!adminRejectionRemarkInput.trim()) return;
                  if (onUpdateStatus) {
                    onUpdateStatus(
                      declineModalRecord.id,
                      "Rejected",
                      adminRejectionRemarkInput,
                    );
                  }
                  setDeclineModalRecord(null);
                  setAdminActionSuccessToast(
                    "Chargeback declined successfully!",
                  );
                  setTimeout(() => setAdminActionSuccessToast(null), 4000);
                }}
                className={`px-5 py-2 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs ${adminRejectionRemarkInput.trim() ? "bg-[#e11d48] hover:bg-[#be123c]" : "bg-gray-300 cursor-not-allowed"}`}
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ACTION SUCCESS POPUP MODAL (Consider & Decline Success Message) */}
      {actionSuccessModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4 animate-in zoom-in-95 duration-150">
            {actionSuccessModal.type === "consider" ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    Dispute Considered & Approved!
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    RRN: {actionSuccessModal.record.rrn} | Txn ID:{" "}
                    {actionSuccessModal.record.id}
                  </p>
                </div>
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 text-left space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Status updated to: <strong>Accepted / Considered</strong>
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    The dispute has been successfully approved by Admin. Refund
                    processing and settlement adjustments have been queued.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-rose-100 text-[#800000] rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <XCircle className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    Dispute Declined Successfully
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    RRN: {actionSuccessModal.record.rrn} | Txn ID:{" "}
                    {actionSuccessModal.record.id}
                  </p>
                </div>
                <div className="bg-red-50/80 border border-red-200 rounded-xl p-3.5 text-xs text-red-950 text-left space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-red-700 block">
                      Rejection Remark:
                    </span>
                    <p className="font-medium text-red-900">
                      {actionSuccessModal.remarks || "No remark provided"}
                    </p>
                  </div>
                  {actionSuccessModal.fileName && (
                    <div className="border-t border-red-200/60 pt-1.5">
                      <span className="text-[10px] uppercase font-bold text-red-700 block">
                        Attached Document:
                      </span>
                      <p className="font-mono text-[11px] text-red-900 truncate">
                        📄 {actionSuccessModal.fileName}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setActionSuccessModal(null)}
              className="w-full bg-[#800000] hover:bg-[#680000] text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors uppercase tracking-wider cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
      {/* ADMIN ACTION SUCCESS TOAST */}
      {adminActionSuccessToast && (
        <div className="fixed bottom-6 right-6 z-[130] bg-[#800000] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{adminActionSuccessToast}</span>
        </div>
      )}

      {/* Partial Acceptance Modal */}
      <PartialAcceptModal
        record={partialModalRecord}
        isOpen={Boolean(partialModalRecord)}
        onClose={() => setPartialModalRecord(null)}
        onConfirm={handleConfirmPartialAccept}
        userType={userType}
      />

      {/* View Partial Evidence Modal */}
      <ViewPartialEvidenceModal
        record={viewEvidenceRecord}
        isOpen={Boolean(viewEvidenceRecord)}
        onClose={() => setViewEvidenceRecord(null)}
      />
    </div>
  );
};
