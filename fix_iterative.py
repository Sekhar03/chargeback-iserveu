import subprocess
import re
import sys

for _ in range(50):
    res = subprocess.run(["npx", "tsc", "--noEmit"], capture_output=True, text=True)
    if res.returncode == 0:
        print("Fixed everything!")
        sys.exit(0)
    
    # parse first error
    match = re.search(r'src/components/ViewChargeback.tsx\((\d+),\d+\): error TS(1135|1005)', res.stdout)
    if not match:
        print("Cannot find recognizable error!")
        print(res.stdout[:500])
        sys.exit(1)
        
    line_num = int(match.group(1))
    
    with open('src/components/ViewChargeback.tsx', 'r') as f:
        lines = f.readlines()
        
    # Insert `  );\n` at line_num - 1
    lines.insert(line_num - 1, "  );\n")
    
    with open('src/components/ViewChargeback.tsx', 'w') as f:
        f.writelines(lines)
        
    print(f"Inserted ); before line {line_num}")
