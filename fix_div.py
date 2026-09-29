import sys

with open('src/components/ViewChargeback.tsx', 'r') as f:
    lines = f.readlines()

# find the exact lines
for i in range(len(lines)):
    if "</table>" in lines[i]:
        # we found </table> at i
        # i+1 should be </div> (closes overflow-x-auto)
        # i+2 should be </div> (closes the old wrapper)
        if "</div>" in lines[i+1] and "</div>" in lines[i+2]:
            print("Found </div> </div> after </table>")
            # delete lines[i+2]
            lines.pop(i+2)
            break

with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.writelines(lines)
