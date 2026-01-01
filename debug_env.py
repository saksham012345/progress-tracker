```python
import os

def check_file(path):
    print(f"Checking {path}...")
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                lines = f.readlines()
                print(f"Line count: {len(lines)}")
                for i, line in enumerate(lines):
                    line_stripped = line.strip()
                    if '=' in line_stripped:
                        parts = line_stripped.split('=', 1)
                        if len(parts) > 1:
                            key = parts[0].strip()
                            val = parts[1].strip()
                            if key.startswith("GROQ_API_KEY"): # Assuming GROQ key starts with GROQ_API_KEY
                                print(f"Line {i}: Key: '{key}', Prefix: {val[:4]}...")
                            else:
                                print(f"Line {i}: {line_stripped[:10].strip()}...")
                        else:
                            print(f"Line {i}: {line_stripped[:10].strip()}...")
                    else:
                        print(f"Line {i}: {line_stripped[:10].strip()}...")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("Not found.")

check_file(os.path.join(os.getcwd(), 'backend', '.env'))
check_file(os.path.join(os.getcwd(), '.env'))
