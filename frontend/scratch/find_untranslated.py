# -*- coding: utf-8 -*-
import os
import re

# Unicode range for Arabic characters
ARABIC_REGEX = re.compile(r'[\u0600-\u06FF]+')

# Directories to search
SEARCH_DIRS = [
    r"c:\Users\LENOVO\OneDrive\Desktop\s\frontend\src\app\(dashboard)",
    r"c:\Users\LENOVO\OneDrive\Desktop\s\frontend\src\components"
]

def scan_files():
    found_lines = []
    for base_dir in SEARCH_DIRS:
        if not os.path.exists(base_dir):
            continue
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if not file.endswith(('.tsx', '.ts')):
                    continue
                file_path = os.path.join(root, file)
                
                # Read file
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
                    continue
                
                # Check each line
                for idx, line in enumerate(lines):
                    cleaned_line = line.strip()
                    # Ignore comment lines
                    if cleaned_line.startswith(('//', '*', '/*')):
                        continue
                    
                    # Search for Arabic characters
                    if ARABIC_REGEX.search(line):
                        if 'console.log' in line or 'console.error' in line:
                            continue
                        
                        rel_path = os.path.relpath(file_path, r"c:\Users\LENOVO\OneDrive\Desktop\s\frontend\src")
                        found_lines.append(f"{rel_path}:{idx+1}: {cleaned_line}")
                        
    # Write results to utf-8 file
    out_file = r"c:\Users\LENOVO\OneDrive\Desktop\s\frontend\untranslated_results.txt"
    with open(out_file, "w", encoding="utf-8") as f:
        if found_lines:
            f.write("\n".join(found_lines))
            print(f"Found {len(found_lines)} hardcoded Arabic occurrences. Wrote results to {out_file}")
        else:
            f.write("No hardcoded Arabic characters found!")
            print("No hardcoded Arabic characters found!")

if __name__ == '__main__':
    scan_files()
