#!/usr/bin/env python3
"""Generate PWA app icons for Live Shopping Network"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """Create a circular purple icon with shopping bag emoji"""
    # Create image with transparency
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw purple circle background
    draw.ellipse([0, 0, size, size], fill='#9333ea')
    
    # Draw white inner circle for contrast
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], fill='white')
    
    # Draw smaller purple circle
    margin2 = size // 6
    draw.ellipse([margin2, margin2, size-margin2, size-margin2], fill='#9333ea')
    
    # Draw shopping bag icon (simplified)
    # Bag body
    bag_top = size // 3
    bag_bottom = size * 2 // 3
    bag_left = size // 3
    bag_right = size * 2 // 3
    draw.rectangle([bag_left, bag_top, bag_right, bag_bottom], fill='white')
    
    # Bag handle
    handle_width = size // 8
    handle_height = size // 6
    handle_left = size // 2 - handle_width
    handle_right = size // 2 + handle_width
    handle_top = bag_top - handle_height // 2
    draw.arc([handle_left, handle_top, handle_right, bag_top + handle_height // 2], 
             start=0, end=180, fill='white', width=size//20)
    
    # Save icon
    img.save(output_path, 'PNG')
    print(f"✅ Generated {output_path} ({size}x{size})")

def main():
    # Output directory
    output_dir = '/home/ubuntu/live-shopping-network/client/public'
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate icons
    create_icon(192, os.path.join(output_dir, 'icon-192.png'))
    create_icon(512, os.path.join(output_dir, 'icon-512.png'))
    
    print("\n🎉 All PWA icons generated successfully!")

if __name__ == '__main__':
    main()
