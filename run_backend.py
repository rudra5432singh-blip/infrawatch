import os
import sys

# Ensure backend directory is on Python path
BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.chdir(BACKEND_DIR)

if __name__ == '__main__':
    import uvicorn
    print('Starting INFRAWATCH Backend on http://localhost:8000 ...')
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)
