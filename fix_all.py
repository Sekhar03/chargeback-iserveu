import subprocess
import re
import sys

res = subprocess.run(["npx", "tsc", "--noEmit"], capture_output=True, text=True)
if res.returncode == 0:
    print("Fixed everything!")
    sys.exit(0)

errors = []
for line in res.stdout.splitlines():
    match = re.search(r'src/components/ViewChargeback.tsx\((\d+),\d+\): error TS(1135|1005)', line)
    if match:
        errors.append(int(match.group(1)))

if not errors:
    print("No matching errors found")
    sys.exit(1)

# unique and sort descending
errors = sorted(list(set(errors)), reverse=True)

with open('src/components/ViewChargeback.tsx', 'r') as f:
    lines = f.readlines()

for line_num in errors:
    # insert before the line
    lines.insert(line_num - 1, "  );\n")
    print(f"Inserted ); before line {line_num}")

with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.writelines(lines)

print("Done fixing all!")
