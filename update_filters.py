import sys

with open('src/components/ViewChargeback.tsx', 'r') as f:
    content = f.read()

start_marker = '{/* Filter Bar Form matching Screenshot 1 */}'
end_marker = '{/* Records Table formatted exactly like NSDL Bank Portal in Screenshots */}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

new_content = """{/* Filter Bar Form matching Screenshot 1 */}
      {userType === 'admin' ? (
        <>
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* From Date */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  From Date
                </label>
              </div>
              <div 
                onClick={() => {
                  if (fromDateRef.current) {
                    try {
                      fromDateRef.current.showPicker ? fromDateRef.current.showPicker() : fromDateRef.current.focus();
                    } catch {
                      fromDateRef.current.focus();
                    }
                  }
                }}
                className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:border-[#800000] cursor-pointer hover:border-gray-400 transition-colors"
              >
                <input
                  ref={fromDateRef}
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleDateChange('fromDate', e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-800 focus:outline-none cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-gray-400 shrink-0 ml-1 pointer-events-none" />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                To Date
              </label>
              <div 
                onClick={() => {
                  if (toDateRef.current) {
                    try {
                      toDateRef.current.showPicker ? toDateRef.current.showPicker() : toDateRef.current.focus();
                    } catch {
                      toDateRef.current.focus();
                    }
                  }
                }}
                className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:border-[#800000] cursor-pointer hover:border-gray-400 transition-colors"
              >
                <input
                  ref={toDateRef}
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleDateChange('toDate', e.target.value)}
                  min={filters.fromDate || undefined}
                  className="w-full bg-transparent text-xs text-gray-800 focus:outline-none cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-gray-400 shrink-0 ml-1 pointer-events-none" />
              </div>
            </div>

            {/* Merchant Name */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Merchant Name
              </label>
              <input
                type="text"
                placeholder="Enter Merchant Name"
                value={filters.merchantName || ''}
                onChange={(e) => handleFilterChange('merchantName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#800000]"
              />
            </div>

            {/* Enter RRN */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                RRN Number
              </label>
              <input
                type="text"
                placeholder="Enter RRN"
                value={filters.rrnNumber}
                onChange={(e) => handleFilterChange('rrnNumber', e.target.value)}
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
                onChange={(e) => handleFilterChange('transactionId', e.target.value)}
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
                  handleFilterChange('status', e.target.value);
                  handleFilterChange('subStatus', '');
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
                onChange={(e) => handleFilterChange('subStatus', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#800000] bg-white cursor-pointer"
              >
                <option value="">Sub Status</option>
                {(() => {
                  const s = filters.status;
                  if (s === 'Differed Chargeback Raise') {
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
                  if (s === 'Fraud Chargeback Raise') {
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
                  if (s === 'Pre-Arbitration Raise') {
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
                  if (s === 'Arbitration Raise') {
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
                onClick={handleResetFilters}
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden mt-4">
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
                className="bg-[#4a4a4a] hover:bg-black text-white font-medium text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
                title="Download File"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
        </>
      ) : (
        <div className="bg-[#0b1120] border border-slate-800/60 rounded-xl p-4 shadow-xl space-y-4 text-slate-300">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1.5" />
              <input
                type="text"
                placeholder="Quick Search: Enter Transaction ID, Case ID, ARN or TID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#151c2c] border border-slate-700/50 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00a86b]"
              />
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <select 
                value={merchantTimeRange}
                onChange={(e) => setMerchantTimeRange(e.target.value)}
                className="bg-[#151c2c] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00a86b] cursor-pointer">
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 6 Months</option>
                <option>Custom DateRange</option>
              </select>

              <button
                type="button"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="flex items-center gap-1.5 border border-[#00a86b]/40 text-[#00a86b] hover:bg-[#00a86b]/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                Advanced Search
              </button>

              <button
                type="button"
                onClick={exportToExcel}
                className="flex items-center gap-1.5 border border-slate-700/50 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {showAdvancedSearch && (
            <div className="pt-4 border-t border-slate-800/50 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    DISPUTE TYPE
                  </label>
                  <select className="w-full bg-[#151c2c] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00a86b] cursor-pointer">
                    <option>All Dispute Types</option>
                    <option>Chargeback</option>
                    <option>Pre-Arbitration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PAYMENT SCHEME
                  </label>
                  <select className="w-full bg-[#151c2c] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00a86b] cursor-pointer">
                    <option>All Schemes</option>
                    <option>Visa</option>
                    <option>Mastercard</option>
                    <option>RuPay</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    DISPUTE SUB-STATUS
                  </label>
                  <select 
                    value={filters.subStatus}
                    onChange={(e) => handleFilterChange('subStatus', e.target.value)}
                    className="w-full bg-[#151c2c] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00a86b] cursor-pointer"
                  >
                    <option value="">All Sub-Statuses</option>
                    <option>Action Required</option>
                    <option>Lost- Self Accepected</option>
                    <option>Lost- Deemed Accepected</option>
                    <option>Under review - Evidence Submitted</option>
                    <option>Action Requied - Resubmit Evidence</option>
                    <option>Under Review - Approved and sent to Bank</option>
                    <option>Won</option>
                    <option>Lost- Arbitration Decision</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    CASE ID / ARN NUMBER SEARCH
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Case ID"
                      className="w-1/2 bg-[#151c2c] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00a86b]"
                    />
                    <input
                      type="text"
                      placeholder="ARN"
                      value={filters.rrnNumber}
                      onChange={(e) => handleFilterChange('rrnNumber', e.target.value)}
                      className="w-1/2 bg-[#151c2c] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00a86b]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    TID SEARCH
                  </label>
                  <input
                    type="text"
                    placeholder="TID"
                    className="w-full bg-[#151c2c] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00a86b]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    RRN / TRANSACTION ID SEARCH
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Txn ID"
                      value={filters.transactionId}
                      onChange={(e) => handleFilterChange('transactionId', e.target.value)}
                      className="w-1/2 bg-[#151c2c] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00a86b]"
                    />
                    <input
                      type="text"
                      placeholder="RRN"
                      className="w-1/2 bg-[#151c2c] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00a86b]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons for Filter */}
              <div className="md:col-span-3 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-[#00a86b] hover:bg-[#008f5a] text-white px-6 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      """

final_content = content[:start_idx] + new_content + content[end_idx:]

with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.write(final_content)
