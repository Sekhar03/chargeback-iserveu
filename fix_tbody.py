import re

with open('src/components/ViewChargeback.tsx', 'r') as f:
    text = f.read()

start_marker = 'if (userType === "admin" && adminTableView === "full") {'
end_marker = '                  if (userType === "admin") {'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_text = text[:start_idx] + text[end_idx:]
    with open('src/components/ViewChargeback.tsx', 'w') as f:
        f.write(new_text)
    print("Success")
else:
    print("Could not find start/end markers")
