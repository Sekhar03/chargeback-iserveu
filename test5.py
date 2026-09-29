with open("temp_filter_section.txt", "r") as f:
    text = f.read()

start_old_marker = "{/* Filter Bar Form matching Screenshot 1 */}"
end_old_marker = "{/* Records Table formatted exactly like NSDL Bank Portal in Screenshots */}"

start_idx = text.find(start_old_marker)
end_idx = text.find(end_old_marker)

segment = text[start_idx:end_idx]

print(f"open_divs in segment: {segment.count('<div')}")
print(f"close_divs in segment: {segment.count('</div')}")
