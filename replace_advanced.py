import sys

with open('src/components/ViewChargeback.tsx', 'r') as f:
    content = f.read()

target_str = """          {/* Buttons */}
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
      </form>"""

replacement_str = """          {/* Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="text-[#800000] hover:text-[#680000] text-xs font-bold px-4 py-2 hover:bg-[#800000]/5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              Advanced Search
              <svg className={`w-4 h-4 transition-transform duration-200 ${showAdvancedSearch ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                handleResetFilters();
                setAdvancedFilters({ disputeType: "", paymentScheme: "", caseId: "", tidSearch: "" });
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
        
        {/* Advanced Search Options */}
        {showAdvancedSearch && (
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Dispute Type */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Dispute Type
              </label>
              <select
                value={advancedFilters.disputeType}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, disputeType: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#800000] bg-white cursor-pointer"
              >
                <option value="">Select Dispute Type</option>
                <option>Fraud</option>
                <option>Non-Fraud</option>
                <option>Pre-Arbitration</option>
              </select>
            </div>
            {/* Payment Scheme */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Payment Scheme
              </label>
              <select
                value={advancedFilters.paymentScheme}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, paymentScheme: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#800000] bg-white cursor-pointer"
              >
                <option value="">Select Scheme</option>
                <option>Visa</option>
                <option>Mastercard</option>
                <option>RuPay</option>
                <option>UPI</option>
              </select>
            </div>
            {/* Case ID / ARN Number Search */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Case ID / ARN Number
              </label>
              <input
                type="text"
                placeholder="Enter Case ID or ARN"
                value={advancedFilters.caseId}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, caseId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#800000]"
              />
            </div>
            {/* TID Search */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                TID Search
              </label>
              <input
                type="text"
                placeholder="Enter Terminal ID"
                value={advancedFilters.tidSearch}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, tidSearch: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#800000]"
              />
            </div>
          </div>
        )}
      </form>"""

if target_str in content:
    content = content.replace(target_str, replacement_str)
    with open('src/components/ViewChargeback.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Target string not found!")
