import sys

with open('src/components/ViewChargeback.tsx', 'r') as f:
    content = f.read()

start_marker = "/* Default Summary Table Row matching user screenshots */"
end_marker = "</tbody>"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

new_content = """/* Default Summary Table Row matching user screenshots */
                    const canTakeAction = userType === 'merchant' && 
                      (r.status === 'New' || r.status === 'Pending') && 
                      r.subStatus !== 'Evidence Submitted';

                    return (
                      <tr key={r.id} className="bg-[#0b1120] hover:bg-[#111827] transition-colors border-b border-slate-800/60 text-xs">
                        
                        {/* Case ID */}
                        <td className="py-4 px-4 font-mono font-bold text-[#00a86b]">
                          {r.id || `CB_${r.rrn.substring(0, 5)}`}
                        </td>

                        {/* Visa ID */}
                        <td className="py-4 px-4 font-mono text-slate-300">
                          {`V_${r.rrn.substring(5, 11)}`}
                        </td>

                        {/* Dispute Type */}
                        <td className="py-4 px-4">
                          <span className="bg-amber-500/10 text-amber-500 font-bold px-2.5 py-1 rounded-md text-[10px] uppercase">
                            {isPreArb ? 'Pre-Arbitration' : 'Chargeback'}
                          </span>
                        </td>

                        {/* Merchant Name */}
                        <td className="py-4 px-4 font-semibold text-slate-200">
                          {r.merchantName || 'ABC Fashion Store'}
                        </td>

                        {/* MID */}
                        <td className="py-4 px-4 font-mono text-slate-400">
                          {r.merchantId || 'MID_990123'}
                        </td>

                        {/* ARN */}
                        <td className="py-4 px-4 font-mono text-slate-400">
                          {r.rrn + '000000'}
                        </td>

                        {/* Dispute Status */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            <span className="font-bold text-slate-200">
                              {r.status === 'New' ? 'Action Required' : (r.subStatus || r.status)}
                            </span>
                          </div>
                        </td>

                        {/* Respond By */}
                        <td className="py-4 px-4">
                          <div className="text-slate-300 font-mono mb-1">{createdDate}</div>
                          <span className="bg-amber-500/20 text-amber-500 font-bold px-2 py-0.5 rounded text-[10px]">
                            {r.aging || `${(idx % 5) * 12 + 4}d left`}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 font-bold text-slate-200 text-sm">
                          ₹ {r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 text-center relative whitespace-nowrap">
                          {canTakeAction ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMerchantModalRecord(r);
                                setMerchantModalStep('initial');
                              }}
                              className="bg-[#00a86b] hover:bg-[#008f5a] text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" /> Take Action
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDetailsModalRecord(r)}
                              className="border border-[#00a86b]/40 text-[#00a86b] hover:bg-[#00a86b]/10 font-bold text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          )}
                        </td>

                        {/* Details */}
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setDetailsModalRecord(r)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors inline-flex items-center justify-center cursor-pointer"
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
                    <td colSpan={11} className="text-center py-12 text-slate-400">
                      No chargebacks found
                    </td>
                  </tr>
                )}
                """

final_content = content[:start_idx] + new_content + content[end_idx:]

with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.write(final_content)
