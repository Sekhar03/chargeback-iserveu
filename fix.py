import sys

with open('src/components/ViewChargeback.tsx', 'r') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if "</table>" in lines[i]:
        # Insert a </div> after </table></div>
        lines.insert(i + 2, "      </div>\n")
        break

with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.writelines(lines)
