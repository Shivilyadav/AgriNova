import qrcode
import sys
import os

def generate_qr(url, output_path="frontend/assets/qrcode.png"):
    print(f"[QR] Generating code for: {url}")
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Signature AgriNova Colors: Dark Navy (#161b22) and Lime Green (#84cc16)
    img = qr.make_image(fill_color="#161b22", back_color="#84cc16")
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"[QR] Success! Saved to {output_path}")

if __name__ == "__main__":
    # Default URL from Netlify if no argument provided
    target_url = sys.argv[1] if len(sys.argv) > 1 else "https://agrinova-ai.netlify.app"
    generate_qr(target_url)

