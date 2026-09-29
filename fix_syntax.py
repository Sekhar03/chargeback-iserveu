import re

with open('src/components/ViewChargeback.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() == ");":
        pass
    else:
        new_lines.append(line)

with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.writelines(new_lines)
