import re

with open('src/components/ViewChargeback.tsx', 'r') as f:
    text = f.read()

# Replace the thead block
target_thead_start = """            {userType === "admin" && adminTableView === "full" ? ("""
target_thead_end = """              </tr>
            )}
          </thead>"""

start_idx = text.find(target_thead_start)
end_idx = text.find(target_thead_end) + len(target_thead_end)

new_thead = """            {userType === "admin" ? (
              /* Admin Summary Table Headers matching user requirements */
              <tr className="bg-[#f8f9fa] text-slate-700 font-bold text-xs border-b border-gray-200 whitespace-nowrap">
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">User Name</th>
                <th className="py-3.5 px-4">RRN</th>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Aging</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Sub status</th>
                <th className="py-3.5 px-4">Transaction amount</th>
                <th className="py-3.5 px-4 text-center">Action</th>
                <th className="py-3.5 px-4 text-center">Details</th>
              </tr>
            ) : (
              /* Clean Summary Table Headers for Merchant / Partner */
              <tr className="bg-[#0b1120] text-slate-400 font-semibold text-xs border-b border-slate-800/80 whitespace-nowrap">
                <th className="py-4 px-4">Case ID</th>
                <th className="py-4 px-4">Visa ID</th>
                <th className="py-4 px-4">Dispute Type</th>
                <th className="py-4 px-4">Merchant Name</th>
                <th className="py-4 px-4">MID</th>
                <th className="py-4 px-4">ARN</th>
                <th className="py-4 px-4">Dispute Status</th>
                <th className="py-4 px-4">Respond By</th>
                <th className="py-4 px-4">Amount</th>
                <th className="py-4 px-4 text-center">Action</th>
                <th className="py-4 px-4 text-center">Details</th>
              </tr>
            )}
          </thead>"""

if start_idx != -1 and end_idx > start_idx:
    text = text[:start_idx] + new_thead + text[end_idx:]
    with open('src/components/ViewChargeback.tsx', 'w') as f:
        f.write(text)
    print("Fixed thead")
else:
    print("Could not find thead")
