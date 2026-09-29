import sys

with open('src/components/ViewChargeback.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "No chargebacks found" in line:
        print(f"Line {i+1}: {line.strip()}")
