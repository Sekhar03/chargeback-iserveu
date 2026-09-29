import re

with open("src/components/ViewChargeback.tsx", "r") as f:
    text = f.read()

open_divs = len(re.findall(r'<div\b[^>]*>', text))
close_divs = len(re.findall(r'</div>', text))

print(f"open_divs: {open_divs}")
print(f"close_divs: {close_divs}")
