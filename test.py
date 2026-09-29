with open("src/components/ViewChargeback.tsx", "r") as f:
    text = f.read()

def count_tags(tag):
    return text.count(tag)

print(f"<div>: {count_tags('<div')}")
print(f"</div>: {count_tags('</div')}")
