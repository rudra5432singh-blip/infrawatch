import sys, os
os.makedirs(os.path.dirname(sys.argv[1]), exist_ok=True) if os.path.dirname(sys.argv[1]) else None
open(sys.argv[1], 'w', encoding='utf-8').write(sys.stdin.read())
print('Saved:', sys.argv[1])
