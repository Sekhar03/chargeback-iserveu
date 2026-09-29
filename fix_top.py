import re

with open('src/components/ViewChargeback.tsx', 'r') as f:
    text = f.read()

# Fix filters
text = text.replace("""    subStatus: "",
  );
  const [appliedFilters, setAppliedFilters] = useState<FilterParams>(filters);""",
"""    subStatus: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterParams>(filters);""")

# Fix selectedRecord
text = text.replace("""  const [selectedRecord, setSelectedRecord] = useState<ChargebackRecord | null>(
    null,
  const [searchQuery, setSearchQuery] = useState("");""",
"""  const [selectedRecord, setSelectedRecord] = useState<ChargebackRecord | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");""")

# Fix actionRecord
text = text.replace("""  const [actionRecord, setActionRecord] = useState<ChargebackRecord | null>(
    null,
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(""",
"""  const [actionRecord, setActionRecord] = useState<ChargebackRecord | null>(
    null
  );
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(""")

# Fix actionType
text = text.replace("""  const [actionType, setActionType] = useState<"accept" | "reject" | null>(
    null,
  // Rejection form inputs""",
"""  const [actionType, setActionType] = useState<"accept" | "reject" | null>(
    null
  );
  // Rejection form inputs""")

# Fix evidenceFiles
text = text.replace("""    evidence4: "",
    evidence5: "",
  // Merchant-specific high-fidelity Take Action flow states""",
"""    evidence4: "",
    evidence5: "",
  });
  // Merchant-specific high-fidelity Take Action flow states""")

with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.write(text)

