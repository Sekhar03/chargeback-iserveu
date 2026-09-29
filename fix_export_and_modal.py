import re
import sys

with open('src/components/ViewChargeback.tsx', 'r') as f:
    text = f.read()

# Fix Export CSV button color
text = text.replace(
    'className="bg-[#4a4a4a] hover:bg-black text-white font-medium text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"',
    'className="bg-[#800000] hover:bg-[#680000] text-white font-medium text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"'
)

# Remove SVG image in confirmation modal
svg_start = """                  {/* SVG Illustration Representation */}"""
svg_end = """                  {/* Remarks input in accept confirm */}"""
s_idx = text.find(svg_start)
e_idx = text.find(svg_end)
if s_idx != -1 and e_idx != -1:
    text = text[:s_idx] + text[e_idx:]
    print("Removed SVG Illustration")

# Remove "Select Your Response" dropdown in STAGE 2
select_start = """                {/* Select dropdown block precisely matching pasted code */}"""
select_end = """                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50 space-y-5">"""
s_idx = text.find(select_start)
e_idx = text.find(select_end)
if s_idx != -1 and e_idx != -1:
    text = text[:s_idx] + text[e_idx:]
    print("Removed Select Dropdown")

# Let's save these changes
with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.write(text)

