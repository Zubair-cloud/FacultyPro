import re

FILE_PATH = "app/src/main/assets/index_modular.html"

# Color Mappings
# Mapping specific Tailwind arbitrary values to CSS variables
REPLACEMENTS = [
    # Primary Color (Gold -> --primary)
    (r'text-\[#DEBE63\]', 'text-[var(--primary)]'),
    (r'bg-\[#DEBE63\]', 'bg-[var(--primary)]'),
    (r'border-\[#DEBE63\]', 'border-[var(--primary)]'),
    (r'shadow-\[0_0_15px_rgba\(222,190,99,0.2\)\]', 'shadow-[0_0_15px_var(--primary-dim)]'),
    
    # Primary Dim (Gold/20 -> --primary-dim)
    (r'text-\[#DEBE63\]/20', 'text-[var(--primary-dim)]'), # Likely rare but possible
    (r'bg-\[#DEBE63\]/20', 'bg-[var(--primary-dim)]'),
    (r'border-\[#DEBE63\]/20', 'border-[var(--primary-dim)]'),
    (r'bg-\[#DEBE63\]/5', 'bg-[var(--primary-dim)]'), # Approximate /5 to dim for simplicity or keep separate?
    # Let's keep /5 separate if we want exactness, but mostly --primary-dim covers the "faint bg" use case.
    # Actually, let's just map /20 and /5 to --primary-dim for now to simplify, or create --primary-faint.
    # User plan had --primary-dim. Let's stick to that.
    
    # Background Surface (Black #101010 -> --bg-surface)
    (r'bg-\[#101010\]', 'bg-[var(--bg-surface)]'),
    
    # Handle text-[#DEBE63] appearing inside other strings or confusing contexts?
    # The regex above is specific to the tailwind class syntax.
]

def refactor_colors():
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_len = len(content)
    
    for pattern, replacement in REPLACEMENTS:
        # Use simple string replace for speed and safety if regex not strictly needed, 
        # but regex allows partial checks if needed. 
        # Actually simple replace is safer for literal strings like 'text-[#DEBE63]'
        # BUT regex is better if there are variations.
        # Let's use simple string replace for exact matches found in the file.
        
        # We need to be careful. `text-[#DEBE63]` is a literal string in the file.
        # Regex needs escaping for [ ] and #.
        
        # Let's construct a cleaner loop using simple replace where possible.
        pass

    # Doing straight string replacements for safety
    new_content = content
    
    # 1. Primary Gold Matches
    new_content = new_content.replace('text-[#DEBE63]', 'text-[var(--primary)]')
    new_content = new_content.replace('bg-[#DEBE63]', 'bg-[var(--primary)]')
    new_content = new_content.replace('border-[#DEBE63]', 'border-[var(--primary)]')
    new_content = new_content.replace('decoration-[#DEBE63]', 'decoration-[var(--primary)]')
    
    # 2. Primary Alpha Matches (Manual mapping to variable)
    # 20% Opacity
    new_content = new_content.replace('bg-[#DEBE63]/20', 'bg-[var(--primary-dim)]')
    new_content = new_content.replace('border-[#DEBE63]/20', 'border-[var(--primary-dim)]')
    
    # 5% Opacity - Let's map this to primary-dim as well for now, or --primary-faint if defined
    # "bg-[#DEBE63]/5" -> let's make a new variable or just reuse primary-dim (it's 20% in License.js)
    # Wait, License.js said --primary-dim is 0.1 (10%) or 0.2 (20%).
    # Let's map it to var(--primary-dim).
    new_content = new_content.replace('bg-[#DEBE63]/5', 'bg-[var(--primary-dim)]')
    new_content = new_content.replace('border-[#DEBE63]/5', 'border-[var(--primary-dim)]')

    # 3. Background Matches
    new_content = new_content.replace('bg-[#101010]', 'bg-[var(--bg-surface)]')
    
    # 4. Special Shadows
    new_content = new_content.replace('shadow-[0_0_15px_rgba(222,190,99,0.2)]', 'shadow-[0_0_15px_var(--primary-dim)]')

    if len(new_content) != original_len:
        print(f"Modified file. Length changed from {original_len} to {len(new_content)}")
    else:
        # Check if content actually changed (same length possible)
        if new_content == content:
            print("No changes needed or patterns not found.")
        else:
            print("Modified file (length same).")

    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == "__main__":
    refactor_colors()
