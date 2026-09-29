with open("temp_filter_section.txt", "r") as f:
    text = f.read()

open_divs = text.count('<div')
close_divs = text.count('</div')

print(f"open_divs in temp: {open_divs}")
print(f"close_divs in temp: {close_divs}")
