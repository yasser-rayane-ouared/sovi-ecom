with open("c:/Users/LENOVO/OneDrive/Desktop/s/frontend/src/app/(dashboard)/themes/customize/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "aspect-[9/18.5]" in line:
        print(f"Line {i+1}: {line.strip()}")
