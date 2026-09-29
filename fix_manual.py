with open('src/components/ViewChargeback.tsx', 'r') as f:
    lines = f.readlines()

def insert_after(line_prefix, text):
    global lines
    for i, line in enumerate(lines):
        if line.startswith(line_prefix):
            lines.insert(i + 1, text + '\n')
            return

def replace_line(line_prefix, new_line):
    global lines
    for i, line in enumerate(lines):
        if line.startswith(line_prefix):
            lines[i] = new_line + '\n'
            return

insert_after('    subStatus: "",', '  });')
insert_after('  const [selectedRecord, setSelectedRecord] = useState<ChargebackRecord | null>(', '    null\n  );')
replace_line('    null,', '')
insert_after('  const [actionRecord, setActionRecord] = useState<ChargebackRecord | null>(', '    null\n  );')
insert_after('  const [actionType, setActionType] = useState<"accept" | "reject" | null>(', '    null\n  );')
insert_after('    evidence5: "",', '  });')
# wait, evidence5 is repeated. 
# Let's do it using regex or index.
