import subprocess
import re
import sys

for iteration in range(300):
    res = subprocess.run(["npx", "tsc", "--noEmit"], capture_output=True, text=True)
    if res.returncode == 0:
        print("Build passed!")
        sys.exit(0)
    
    # Extract all line numbers with errors
    matches = re.finditer(r'src/components/ViewChargeback\.tsx\((\d+),\d+\): error TS', res.stdout)
    line_nums = [int(m.group(1)) for m in matches]
    
    if not line_nums:
        print("No matches in ViewChargeback.tsx.")
        print(res.stdout[:500])
        sys.exit(1)
        
    line_nums = sorted(list(set(line_nums)), reverse=True)
    
    with open('src/components/ViewChargeback.tsx', 'r') as f:
        lines = f.readlines()
        
    changed = False
    for line_num in line_nums:
        # Check if the line has `);` or `)` or `);` etc
        idx = line_num - 1
        if idx < len(lines):
            stripped = lines[idx].strip()
            if stripped in [');', ')', '];', '}', '},']:
                # Delete the line!
                del lines[idx]
                changed = True
                print(f"Deleted line {line_num} containing: {stripped}")
    
    if not changed:
        print("Could not fix anything in this pass. Remaining errors:")
        print(res.stdout[:1000])
        sys.exit(1)
        
    with open('src/components/ViewChargeback.tsx', 'w') as f:
        f.writelines(lines)
