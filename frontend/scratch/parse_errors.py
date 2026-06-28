import re

def main():
    try:
        content = open(r'c:\Users\LENOVO\OneDrive\Desktop\s\frontend\compile_errors.txt', encoding='utf-16').read()
    except Exception as e:
        print("Error reading compile_errors.txt:", e)
        return

    # Find pattern: src/app/.../page.tsx(179,66): error TS2345: Argument of type '"announcementDefaultText"' is not assignable
    # Note: File path might contain slashes. Key is double quoted.
    pattern = r'([^\(\n]+)\((\d+),\d+\): error TS2345: Argument of type \'\"([^\"]+)\"\' is not assignable'
    matches = re.findall(pattern, content)

    errors = {}
    for filename, line, key in matches:
        filename = filename.strip()
        if filename not in errors:
            errors[filename] = set()
        errors[filename].add((int(line), key))

    for filename, errs in sorted(errors.items()):
        print(f"{filename}:")
        for line, key in sorted(list(errs)):
            print(f"  Line {line}: {key}")

if __name__ == '__main__':
    main()
