with open('src/components/ViewChargeback.tsx', 'r') as f:
    lines = f.readlines()

bad_lines = [56, 58, 60, 62, 64, 66, 68, 70, 95, 97, 99, 101]

new_lines = []
for i, line in enumerate(lines):
    if (i + 1) not in bad_lines:
        new_lines.append(line)

with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.writelines(new_lines)
