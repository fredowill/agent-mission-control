#!/usr/bin/env python3
"""Fix mojibake (corrupted UTF-8) in JSON data files. Run from agent-hub root."""
import sys, os

target = sys.argv[1] if len(sys.argv) > 1 else 'data/campaigns.json'

with open(target, encoding='utf-8') as f:
    content = f.read()

original = content

# Mojibake em dash (most common)
content = content.replace('\u00e2\u20ac\u201c', '--')
content = content.replace('\u00e2\u20ac\u0094', '--')
# Mojibake right single quote
content = content.replace('\u00e2\u20ac\u2122', "'")
# Mojibake left/right double quotes
content = content.replace('\u00e2\u20ac\u0153', '"')
content = content.replace('\u00e2\u20ac\u009d', '"')
content = content.replace('\u00e2\u20ac\u009c', '"')
# Replacement character
content = content.replace('\ufffd', '')
# Actual Unicode chars (belt and suspenders)
content = content.replace('\u2014', '--')
content = content.replace('\u2013', '-')
content = content.replace('\u2192', '->')
content = content.replace('\u201c', '"')
content = content.replace('\u201d', '"')
content = content.replace('\u2018', "'")
content = content.replace('\u2019', "'")
content = content.replace('\u2026', '...')

if content != original:
    with open(target, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed mojibake in {target}')
else:
    print(f'No mojibake found in {target}')

# Validate JSON
import json
try:
    json.loads(content)
    print('JSON valid')
except json.JSONDecodeError as e:
    print(f'JSON STILL BROKEN: {e}')
