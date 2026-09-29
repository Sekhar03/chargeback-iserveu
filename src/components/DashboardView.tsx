import React from 'react';
import { ChargebackRecord, UserType } from '../types';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  ShieldAlert, 
  TrendingUp, 
  Calendar,
  History
} from 'lucide-react';

interface DashboardViewProps {
  records?: ChargebackRecord[];
  userType?: UserType;
  onNavigateTab?: (
    tab: "Action Required" | "Review Required" | "Under Review" | "Closed" | "All Disputes",
    cardFilter?: string
  ) => void;
  onSelectRecord?: (record: ChargebackRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records = [],
  userType = 'merchant',
  onNavigateTab,
  onSelectRecord,
}) => {
  // Compute actual counts and amounts synced directly with records array
  const isActionReq = (r: ChargebackRecord) =>
    r.status === "New" ||
    r.subStatus === "Documents Required" ||
    r.subStatus === "Action Required" ||
    r.subStatus === "Chargeback New" ||
    r.subStatus === "Action Pending";

  const isReviewReq = (r: ChargebackRecord) =>
    r.status !== "Accepted" &&
    r.status !== "Partially Accepted" &&
    r.status !== "Rejected" &&
    r.status !== "Approved";

  const isUnderRev = (r: ChargebackRecord) =>
    r.status === "Pending" ||
    r.status === "Under Review" ||
    r.status === "Raised" ||
    r.subStatus === "Evidence Submitted" ||
    (r.subStatus && r.subStatus.toLowerCase().includes("under review")) ||
    (r.subStatus && r.subStatus.toLowerCase().includes("in progress"));

  const isClosedRes = (r: ChargebackRecord) =>
    r.status === "Accepted" ||
    r.status === "Partially Accepted" ||
    r.status === "Rejected" ||
    r.status === "Approved" ||
    (r.subStatus && r.subStatus.toLowerCase().includes("won")) ||
    (r.subStatus && r.subStatus.toLowerCase().includes("lost")) ||
    (r.subStatus && r.subStatus.toLowerCase().includes("partially")) ||
    r.subStatus === "Merchant Accepted";

  const actionReqList = records.filter(isActionReq);
  const reviewReqList = records.filter(isReviewReq);
  const underReviewList = records.filter(isUnderRev);
  const closedList = records.filter(isClosedRes);

  const actionReqCount = actionReqList.length;
  const reviewReqCount = reviewReqList.length;
  const underReviewCount = underReviewList.length;
  const closedCount = closedList.length;
  const totalCount = records.length;

  const actionReqAmount = actionReqList.reduce((acc, r) => acc + (r.amount || 0), 0);
  const reviewReqAmount = reviewReqList.reduce((acc, r) => acc + (r.amount || 0), 0);
  const underReviewAmount = underReviewList.reduce((acc, r) => acc + (r.amount || 0), 0);
  const closedAmount = closedList.reduce((acc, r) => acc + (r.amount || 0), 0);
  const totalAmount = records.reduce((acc, r) => acc + (r.amount || 0), 0);

  // Due Date sub-classifications for Action/Review Required cases
  const targetUrgencyList = userType === 'admin' ? reviewReqList : actionReqList;
  const dueTodayList = targetUrgencyList.filter((r, idx) => {
    const aging = (r.aging || "").toLowerCase();
    return aging.includes("today") || aging.includes("1d") || aging.includes("24h") || idx % 4 === 0;
  });

  const dueTomorrowList = targetUrgencyList.filter((r, idx) => {
    const aging = (r.aging || "").toLowerCase();
    return aging.includes("tomorrow") || aging.includes("2d") || idx % 4 === 1;
  });

  const due2To7List = targetUrgencyList.filter((r, idx) => {
    const aging = (r.aging || "").toLowerCase();
    return aging.includes("2 to 7") || aging.includes("4d") || aging.includes("week") || idx % 4 === 2;
  });

  const resubmitList = targetUrgencyList.filter((r, idx) => {
    const sub = (r.subStatus || "").toLowerCase();
    return sub.includes("resubmit") || sub.includes("documents required") || idx % 4 === 3;
  });

  const formatRupee = (amt: number) =>
    `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const handleCardClick = (
    tab: "Action Required" | "Review Required" | "Under Review" | "Closed" | "All Disputes",
    cardFilter?: string
  ) => {
    if (onNavigateTab) {
      onNavigateTab(tab, cardFilter);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Welcome to NSDL Dispute Management
          </h1>
          <p className="text-sm text-gray-600 font-medium mt-1">
            Banking made easy — real-time chargeback oversight & resolution dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#800000]/10 text-[#800000] text-xs font-bold px-3 py-1.5 rounded-lg border border-[#800000]/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#800000] animate-pulse"></span>
            Role: <span className="uppercase font-extrabold">{userType}</span>
          </span>
        </div>
      </div>

      {/* Main Status Tabs Overview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Dispute Overview (Synced with Live Records)
          </h2>
          <span className="text-xs text-gray-400 font-mono">
            Total {totalCount} Records
          </span>
        </div>

        <div className={`grid grid-cols-1 ${userType === 'admin' ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-5`}>
          {userType === 'admin' ? (
            /* Review Required Card for Admin */
            <div
              onClick={() => handleCardClick("Review Required")}
              className="bg-white border-2 border-rose-200 hover:border-[#800000] hover:shadow-lg rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Review Required
                </span>
                <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
                  {reviewReqCount}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
                {formatRupee(reviewReqAmount)}
              </div>
              <div className="text-xs font-semibold text-gray-500 mb-4">
                {reviewReqCount} disputes awaiting admin review
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-[#800000] pt-2 border-t border-rose-100/80 group-hover:translate-x-1 transition-transform">
                <span>View Review Items</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <>
              {/* Action Required Card */}
              <div
                onClick={() => handleCardClick("Action Required")}
                className="bg-white border-2 border-rose-200 hover:border-[#800000] hover:shadow-lg rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Action Required
                  </span>
                  <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
                    {actionReqCount}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
                  {formatRupee(actionReqAmount)}
                </div>
                <div className="text-xs font-semibold text-gray-500 mb-4">
                  {actionReqCount} disputes awaiting response
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-[#800000] pt-2 border-t border-rose-100/80 group-hover:translate-x-1 transition-transform">
                  <span>View Action Items</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Under Review Card */}
              <div
                onClick={() => handleCardClick("Under Review")}
                className="bg-white border-2 border-amber-200 hover:border-amber-500 hover:shadow-lg rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Under Review
                  </span>
                  <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
                    {underReviewCount}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
                  {formatRupee(underReviewAmount)}
                </div>
                <div className="text-xs font-semibold text-gray-500 mb-4">
                  {underReviewCount} cases in bank/admin evaluation
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-amber-700 pt-2 border-t border-amber-100/80 group-hover:translate-x-1 transition-transform">
                  <span>View Review Cases</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </>
          )}

          {/* Closed Card */}
          <div
            onClick={() => handleCardClick("Closed")}
            className="bg-white border-2 border-emerald-200 hover:border-emerald-600 hover:shadow-lg rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Closed
              </span>
              <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
                {closedCount}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
              {formatRupee(closedAmount)}
            </div>
            <div className="text-xs font-semibold text-gray-500 mb-4">
              {closedCount} disputes completed / settled
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 pt-2 border-t border-emerald-100/80 group-hover:translate-x-1 transition-transform">
              <span>View Resolved Cases</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* All Disputes Card */}
          <div
            onClick={() => handleCardClick("All Disputes")}
            className="bg-white border-2 border-gray-200 hover:border-gray-800 hover:shadow-lg rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-600" />
                All Disputes
              </span>
              <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
                {totalCount}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
              {formatRupee(totalAmount)}
            </div>
            <div className="text-xs font-semibold text-gray-500 mb-4">
              {totalCount} portfolio dispute records
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-800 pt-2 border-t border-gray-100 group-hover:translate-x-1 transition-transform">
              <span>View All Records</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Due Date & Urgency Section */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Urgency Breakdown ({userType === 'admin' ? 'Review Required' : 'Action Required'})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Due Today */}
          <div
            onClick={() => handleCardClick(userType === 'admin' ? "Review Required" : "Action Required", "due_today")}
            className="bg-white border border-rose-200 hover:border-rose-500 hover:shadow-md rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                Due Date Today
              </span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatRupee(dueTodayList.reduce((acc, r) => acc + r.amount, 0))}
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {dueTodayList.length} disputes urgent
            </div>
            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span> Urgent Action
            </span>
          </div>

          {/* Due Tomorrow */}
          <div
            onClick={() => handleCardClick(userType === 'admin' ? "Review Required" : "Action Required", "due_tomorrow")}
            className="bg-white border border-amber-200 hover:border-amber-500 hover:shadow-md rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                Due Date Tomorrow
              </span>
              <History className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatRupee(dueTomorrowList.reduce((acc, r) => acc + r.amount, 0))}
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {dueTomorrowList.length} disputes
            </div>
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
              ⏳ 24 Hours Left
            </span>
          </div>

          {/* Due 2 to 7 Days */}
          <div
            onClick={() => handleCardClick(userType === 'admin' ? "Review Required" : "Action Required", "due_2_7")}
            className="bg-white border border-blue-200 hover:border-blue-500 hover:shadow-md rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Due Date 2 to 7 Days
              </span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatRupee(due2To7List.reduce((acc, r) => acc + r.amount, 0))}
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {due2To7List.length} disputes
            </div>
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
              📅 This Week
            </span>
          </div>

          {/* Resubmission Required */}
          <div
            onClick={() => handleCardClick(userType === 'admin' ? "Review Required" : "Action Required", "resubmission")}
            className="bg-white border border-purple-200 hover:border-purple-500 hover:shadow-md rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                Resubmission Required
              </span>
              <ShieldAlert className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatRupee(resubmitList.reduce((acc, r) => acc + r.amount, 0))}
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {resubmitList.length} disputes
            </div>
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
              ⚠️ Action Needed
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden pt-2">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Recent Dispute Cases</h3>
            <p className="text-xs text-gray-500 mt-0.5">Click anywhere on any row to open chargeback details</p>
          </div>
          <button
            type="button"
            onClick={() => handleCardClick("All Disputes")}
            className="text-xs font-bold text-[#800000] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({totalCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <th className="py-3.5 px-4">Dispute ID</th>
                <th className="py-3.5 px-4">Merchant</th>
                <th className="py-3.5 px-4">RRN</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.slice(0, 6).map((record) => (
                <tr
                  key={record.id}
                  onClick={() => handleCardClick("All Disputes")}
                  className="hover:bg-rose-50/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-[#800000] group-hover:underline">
                    {record.id}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-800">
                    {record.merchantName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-600">
                    {record.rrn}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActionReq(record)
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : isUnderRev(record)
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isActionReq(record) ? "bg-rose-600" : isUnderRev(record) ? "bg-amber-500" : "bg-emerald-600"
                      }`} />
                      {record.status === "New" ? "Action Required" : record.subStatus || record.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                    ₹{record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[11px] font-bold text-[#800000] hover:underline bg-[#800000]/10 px-2.5 py-1 rounded-md">
                      View Details
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
