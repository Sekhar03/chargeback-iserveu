import sys

with open('src/components/ViewChargeback.tsx', 'r') as f:
    content = f.read()

start_marker = "/* Clean Summary Table Headers for Merchant / Partner */"
end_marker = "</thead>"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

new_content = """/* Clean Summary Table Headers for Merchant / Partner */
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
            """

final_content = content[:start_idx] + new_content + content[end_idx:]

with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.write(final_content)
