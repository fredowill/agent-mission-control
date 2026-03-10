#!/usr/bin/env python3
"""Fix stray quotes left by mojibake byte-level cleanup."""
import re, json, sys

target = sys.argv[1] if len(sys.argv) > 1 else 'data/campaigns.json'

with open(target, encoding='utf-8') as f:
    content = f.read()

# Pattern: --" followed by space+letter = stray quote from mojibake fix
# The mojibake was: em_dash -> bytes -> "--" but the " is a stray artifact
# Pattern: --" followed by space = stray quote from mojibake (the " is not a JSON delimiter)
# Safe because valid JSON --" would be at end of string value (--",\n or --"\n})
content = re.sub(r'--"(?= )', '--', content)

with open(target, 'w', encoding='utf-8') as f:
    f.write(content)

try:
    json.loads(content)
    print('JSON VALID')
except json.JSONDecodeError as e:
    print(f'STILL BROKEN at line {e.lineno} col {e.colno}: {e.msg}')
    # Show context around error
    lines = content.split('\n')
    if e.lineno <= len(lines):
        line = lines[e.lineno - 1]
        start = max(0, e.colno - 40)
        end = min(len(line), e.colno + 40)
        print(f'Context: ...{line[start:end]}...')
