import re

with open("src/components/ViewChargeback.tsx", "r") as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    # Find all <div... and </div>
    # A bit naive but usually works for simple JSX if formatted well
    # let's just strip strings and comments first to be safe, but actually let's just do regex
    div_opens = re.finditer(r'<div\b[^>]*>', line)
    for _ in div_opens:
        stack.append(i + 1)
        
    div_closes = re.finditer(r'</div\s*>', line)
    for _ in div_closes:
        if stack:
            stack.pop()
        else:
            print(f"Extra closing div on line {i + 1}")

print("Unclosed divs opened on lines:")
print(stack)
