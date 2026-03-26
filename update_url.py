import io, re, os
try:
    import qrcode
except ImportError:
    print("[Warning] 'qrcode' library not found. QR code will not be updated.")
    qrcode = None

def generate_qr(url, output_path="frontend/assets/qrcode.png"):
    if not qrcode:
        return
    print(f"Generating QR Code for: {url}")
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#161b22", back_color="#84cc16")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"QR Code updated at: {output_path}")

try:
    text = io.open('serveo_url.txt', 'r', encoding='utf-16le').read()
except:
    try:
        text = open('serveo_url.txt', 'r', encoding='utf-8', errors='ignore').read()
    except:
        text = ""

# Look for the tunnel URL
match = re.search(r'https://[a-zA-Z0-9\.-]+\.serveousercontent\.com', text)
if match:
    url = match.group(0)
    
    # 1. Update script.js for API calls
    with open('frontend/script.js', 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'const API_BASE_URL\s*=\s*"[^"]+";', f'const API_BASE_URL = "{url}";', content)
    with open('frontend/script.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Injected URL into script.js:", url)
    
    # 2. Update QR code to point to this URL (assuming frontend is also tunneled or it's a direct demo)
    # If the user wants the QR to point to a different frontend URL, we can adjust here.
    generate_qr(url)
    
else:
    print("URL not found in serveo_url.txt. File snippet:", repr(text[:100]))

