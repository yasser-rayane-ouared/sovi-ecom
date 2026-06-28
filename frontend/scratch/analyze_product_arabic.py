# -*- coding: utf-8 -*-
import re

def main():
    file_path = r"c:\Users\LENOVO\OneDrive\Desktop\s\frontend\src\app\(dashboard)\products\[id]\page.tsx"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find string literals in double or single quotes containing Arabic characters
    double_quotes = re.findall(r'\"([^\"]*[\u0600-\u06FF]+[^\"]*)\"', content)
    single_quotes = re.findall(r'\'([^\']*[\u0600-\u06FF]+[^\']*)\'', content)
    jsx_text = re.findall(r'>\s*([\u0600-\u06FF]+[^<]*)\s*<', content)

    arabic_texts = set(double_quotes + single_quotes + jsx_text)
    
    # Save the list to a file for encoding-safe viewing
    out_file = r"c:\Users\LENOVO\OneDrive\Desktop\s\frontend\unique_arabic_products.txt"
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(f"Total unique Arabic strings: {len(arabic_texts)}\n\n")
        for t in sorted(list(arabic_texts)):
            f.write(f"- {t}\n")
            
    print(f"Found {len(arabic_texts)} unique Arabic strings. Wrote to {out_file}")

if __name__ == '__main__':
    main()
