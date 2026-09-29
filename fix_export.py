import sys

with open('src/components/ViewChargeback.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "const exportToExcel = () => {" in line:
        start_idx = i
    if start_idx != -1 and i > start_idx and "Chargebacks_Export_" in line:
        end_idx = i + 3
        break

if start_idx != -1 and end_idx != -1:
    new_export = """  const exportToExcel = () => {
    let exportData;
    if (userType === 'admin') {
      exportData = filteredRecords.map((r) => ({
        "User ID": "2222257001642755",
        "User Name": "masteruser",
        "RRN": r.rrn,
        "Transaction ID": "530346139645447349",
        "Aging": "4 days",
        "Status": r.status,
        "Sub status": r.subStatus,
        "Transaction amount": `₹${r.amount}`
      }));
    } else {
      exportData = filteredRecords.map((r) => ({
        "Case ID": r.id,
        "Visa ID": r.rrn,
        "Dispute Type": getAdjustmentType(r),
        "Merchant Name": r.merchantName,
        "MID": r.merchantId,
        "ARN": r.rrn,
        "Dispute Status": r.status,
        "Respond By": "24h",
        "Amount": `₹${r.amount}`
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chargebacks");
    XLSX.writeFile(workbook, `Chargebacks_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
"""
    lines = lines[:start_idx] + [new_export] + lines[end_idx:]
    with open('src/components/ViewChargeback.tsx', 'w') as f:
        f.writelines(lines)
    print("Fixed exportToExcel")
else:
    print("Could not find exportToExcel bounds")

