import os
import glob
from PIL import Image

src_dir = r"c:\Users\PC\Desktop\ANTIGRAVITY PROJECTS\bumer\apps\web-front\public\social"
dest_dir = r"C:\Users\PC\.gemini\antigravity-ide\brain\f5ed298c-326a-4952-a150-9fdd895720c7"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

print(f"Resizing images from {src_dir} to {dest_dir}...")

for filepath in glob.glob(os.path.join(src_dir, "*.png")):
    filename = os.path.basename(filepath)
    print(f"Processing {filename}...")
    try:
        with Image.open(filepath) as img:
            # Resize
            img.thumbnail((300, 300))
            # Convert to RGB if needed
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3]) # 3 is alpha
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            dest_path = os.path.join(dest_dir, f"resized_{filename}")
            img.save(dest_path, "JPEG", quality=85)
            print(f"Saved {dest_path}")
    except Exception as e:
        print(f"Error processing {filename}: {e}")

print("Done!")
