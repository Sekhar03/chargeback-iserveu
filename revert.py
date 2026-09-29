import sys

with open('src/components/ViewChargeback.tsx', 'r') as f:
    content = f.read()

with open('temp_filter_section.txt', 'r') as f:
    old_content = f.read()

# Extract old filter bar code
start_old_marker = "{/* Filter Bar Form matching Screenshot 1 */}"
end_old_marker = "{/* Records Table formatted exactly like NSDL Bank Portal in Screenshots */}"
start_old_idx = old_content.find(start_old_marker)
end_old_idx = old_content.find(end_old_marker)
old_filter_code = old_content[start_old_idx:end_old_idx]

# Extract new filter bar code boundaries
start_idx = content.find(start_old_marker)
end_idx = content.find(end_old_marker)

final_content = content[:start_idx] + old_filter_code + content[end_idx:]

with open('src/components/ViewChargeback.tsx', 'w') as f:
    f.write(final_content)
