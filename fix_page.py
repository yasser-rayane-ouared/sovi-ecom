#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix the corrupted page.tsx file by reconstructing the proper 3-column layout.
This script replaces lines from 1509 onwards with a correct structure.
"""

import sys
import os

PAGE_PATH = r'c:\Users\LENOVO\OneDrive\Desktop\s\frontend\src\app\(dashboard)\products\[id]\page.tsx'
BACKUP_PATH = PAGE_PATH + '.bak2'

# Read the file
with open(PAGE_PATH, encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print("Total lines: " + str(len(lines)), file=sys.stderr)

# ==== PART 1: Keep lines 1-1508 (indices 0-1507) ====
part1 = ''.join(lines[:1508])

# ==== PART 2: Extract Column 1 content (sections sidebar) ====
# Lines 1521-1761 (indices 1520-1760)
col1_inner = ''.join(lines[1520:1761])

# ==== PART 3: Extract phone preview content ====
# Lines 2617-end (indices 2616 onwards)
preview_content = ''.join(lines[2616:])

# ==== PART 4: Build Column 2 with a new section router ====
# We need to build section-specific editors based on currentSelectedId
# Using the editors from the form_fields area (1835-2605)
# We'll build a switch-based router for the selected section

# Extract the form fields content and convert the "activeList.map" to a switch
# based on the current section type
# First let's read what's in the form fields area
form_area = ''.join(lines[1834:2606])

# The form_area contains: {activeList.map((section) => { ... })}
# We need to convert this to: show only the selected section
# The simplest way: instead of mapping over ALL, we extract the section
# and just show the editor for it

# Build new column 2 content that:
# 1. Finds the currently selected section
# 2. Shows its specific editor
# We'll build this by using the same if/else logic but for a single section

col2_editor = '''            {/* Column 2: Middle Column (Active Section Editor, lg:w-[45%]) */}
            <div className="w-full lg:w-[45%] space-y-6">
            {(() => {
              const activeList_c2 = activeList;
              const selectedSection = activeList_c2.find((s: any) => s.id === currentSelectedId);
              if (!selectedSection) {
                return (
                  <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                      <Layers className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">الرجاء اختيار قسم للتعديل</h4>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      اختر أحد أقسام صفحة المنتج النشطة من القائمة اليمنى لبدء تحرير المحتوى وتخصيص التفاصيل.
                    </p>
                  </div>
                );
              }
              // Render only the selected section editor
              return (
                <div className="space-y-6">
                  {[selectedSection].map((section) => {
'''

# Now we need to insert all the section editors from form_area
# form_area starts with: "            {activeList.map((section) => {\n"
# We need just the inner body of the map function

# Find the start of the map body  
map_start = form_area.find('{activeList.map((section) => {')
if map_start == -1:
    print("ERROR: Could not find activeList.map in form area!", file=sys.stderr)
    sys.exit(1)

# Find the section body - skip past the opening brace
body_start = form_area.find('{', map_start + len('{activeList.map((section) => {'))
# Actually we want everything AFTER "{activeList.map((section) => {\n"
after_map_header = form_area[form_area.find('\n', map_start) + 1:]

# Find the closing of the map: "})}
# It ends with: "            })}\\n            </div>"
map_end = after_map_header.rfind('            })}')
if map_end == -1:
    print("ERROR: Could not find end of map!", file=sys.stderr)
    # Try alternative
    map_end = after_map_header.rfind('})}')
    
print("Map body start/end found: " + str(map_end > 0), file=sys.stderr)

# Extract the map body (the if/else blocks for each section type)
map_body = after_map_header[:map_end]

col2_editor += map_body

col2_editor += '''                  })}
                </div>
              );
            })()}
            </div>
'''

# ==== ASSEMBLE THE FULL NEW SECTION (from line 1509 onwards) ====
new_section = '''        {enableAbTest && activeTab === 'B' && !abTestProductBId ? (
          /* Premium Placeholder Card for Creating Version B */
          <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-lg my-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <SplitSquareHorizontal className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">لم يتم إنشاء النسخة البديلة (النسخة B) بعد</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                لتفعيل اختبار الـ A/B، يجب إنشاء صفحة بديلة تحتوي على تعديلات مختلفة في العنوان أو الصور أو الأسعار.
              </p>
            </div>
            <Button
              type="button"
              variant="glow"
              className="text-sm font-bold px-6 py-2.5 h-auto rounded-xl flex items-center gap-2 mx-auto"
              onClick={handleCreateVersionB}
            >
              <Plus className="h-4 w-4" />
              إنشاء النسخة B الآن
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
            
            {/* Column 1: Right Column (Sections Sidebar, lg:w-[25%]) */}
            <div className="w-full lg:w-[25%] space-y-4">
''' + col1_inner + '''            </div>

''' + col2_editor + '''
          {/* Column 3: Left Column (Phone Preview, lg:w-[30%]) */}
''' + preview_content

# Wait, preview_content starts with "          {/* Live Preview Column (30%) */}"
# We need to check what the preview starts with and make sure it's properly closed

print("New section length: " + str(len(new_section)) + " chars", file=sys.stderr)

# Write backup
with open(BACKUP_PATH, 'w', encoding='utf-8') as f:
    f.write(''.join(lines))
print("Backup written to: " + BACKUP_PATH, file=sys.stderr)

# Write the new file
new_content = part1 + new_section
with open(PAGE_PATH, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done! New file written.", file=sys.stderr)
new_lines = new_content.split('\n')
print("New total lines: " + str(len(new_lines)), file=sys.stderr)
