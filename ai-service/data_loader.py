import os
import json
import glob
import csv

def load_all_data(data_dir="data"):
    """
    Load data from multiple formats in the data directory.
    Supports .json, .txt
    """
    all_docs = []
    
    # helper for clean logging
    def log(msg):
        print(f"[Data Loader] {msg}")

    # Ensure dir exists
    if not os.path.exists(data_dir):
        log(f"Directory {data_dir} not found. Creating...")
        os.makedirs(data_dir)
        return all_docs

    # 1. JSON Files (Recursive)
    # Search in all subdirectories
    json_files = glob.glob(os.path.join(data_dir, "**", "*.json"), recursive=True)
    for jf in json_files:
        try:
            # Extract category from folder name if possible
            folder_category = os.path.basename(os.path.dirname(jf))
            if folder_category == "data": folder_category = "General"
            
            with open(jf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Case A: List of items
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            content = item.get('content') or item.get('text') or item.get('description') or str(item)
                            category = item.get('category', folder_category)
                            all_docs.append(f"Knowledge ({category}): {content}")
                        elif isinstance(item, str):
                            all_docs.append(f"Knowledge ({folder_category}): {item}")
                            
                # Case B: Single Object (e.g. Kaggle Metadata)
                elif isinstance(data, dict):
                    # Try to find a description or text field
                    content = data.get('description') or data.get('content') or data.get('text')
                    if content:
                        all_docs.append(f"Knowledge ({folder_category} Metadata): {content}")
                        log(f"Loaded metadata from {jf}")
            log(f"Loaded {len(data)} items from {jf}")
        except Exception as e:
            log(f"Error loading {jf}: {e}")

    # 2. Text Files (Recursive)
    txt_files = glob.glob(os.path.join(data_dir, "**", "*.txt"), recursive=True)
    for tf in txt_files:
        try:
            folder_category = os.path.basename(os.path.dirname(tf))
            if folder_category == "data": folder_category = "General"

            with open(tf, 'r', encoding='utf-8') as f:
                text = f.read()
                paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
                # Add context to each paragraph
                labeled_paragraphs = [f"Knowledge ({folder_category}): {p}" for p in paragraphs]
                all_docs.extend(labeled_paragraphs)
            log(f"Loaded {len(paragraphs)} paragraphs from {tf}")
        except Exception as e:
            log(f"Error loading {tf}: {e}")
            
    # 3. CSV Files (Recursive)
    csv_files = glob.glob(os.path.join(data_dir, "**", "*.csv"), recursive=True)
    for cf in csv_files:
        try:
            folder_category = os.path.basename(os.path.dirname(cf))
            if folder_category == "data": folder_category = "Dataset"
            
            with open(cf, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                headers = next(reader, None) # Skip header if present
                
                row_count = 0
                for row in reader:
                    if row:
                        # Join all columns into a single string representation
                        row_text = " | ".join(row)
                        all_docs.append(f"Knowledge ({folder_category}): {row_text}")
                        row_count += 1
                        
            log(f"Loaded {row_count} rows from {cf}")
        except Exception as e:
            # Try with different encoding if utf-8 fails
            try:
                with open(cf, 'r', encoding='latin-1') as f:
                    reader = csv.reader(f)
                    headers = next(reader, None)
                    row_count = 0
                    for row in reader:
                        if row:
                            row_text = " | ".join(row)
                            all_docs.append(f"Knowledge ({folder_category}): {row_text}")
                            row_count += 1
                log(f"Loaded {row_count} rows from {cf} (latin-1)")
            except Exception as e2:
                log(f"Error loading {cf}: {e}")

    return all_docs
