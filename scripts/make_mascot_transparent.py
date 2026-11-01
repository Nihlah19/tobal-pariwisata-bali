import numpy as np
from PIL import Image
from collections import deque
import os

input_path = 'public/images/mascot-barong.jpg'
output_path = 'public/images/mascot-barong.png'
head_output_path = 'public/images/mascot-barong-head.png'

img = Image.open(input_path).convert('RGBA')
width, height = img.size
data = np.array(img)

# Flood fill outer white border
visited = np.zeros((height, width), dtype=bool)
queue = deque()

# Add all 4 borders to queue if near white (> 230)
for x in range(width):
    for y in [0, height - 1]:
        r, g, b, _ = data[y, x]
        if r > 220 and g > 220 and b > 220:
            queue.append((x, y))
            visited[y, x] = True

for y in range(height):
    for x in [0, width - 1]:
        if not visited[y, x]:
            r, g, b, _ = data[y, x]
            if r > 220 and g > 220 and b > 220:
                queue.append((x, y))
                visited[y, x] = True

while queue:
    cx, cy = queue.popleft()
    data[cy, cx, 3] = 0  # make transparent
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nx, ny = cx + dx, cy + dy
        if 0 <= nx < width and 0 <= ny < height and not visited[ny, nx]:
            r, g, b, _ = data[ny, nx]
            # Threshold for outer white/near-white area including faint grey margin
            if r > 210 and g > 210 and b > 210:
                visited[ny, nx] = True
                queue.append((nx, ny))

result = Image.fromarray(data)

# Trim transparent bounding box with 8px padding
bbox = result.getbbox()
if bbox:
    pad = 8
    crop_box = (
        max(0, bbox[0] - pad),
        max(0, bbox[1] - pad),
        min(width, bbox[2] + pad),
        min(height, bbox[3] + pad)
    )
    result = result.crop(crop_box)

result.save(output_path, 'PNG')
print(f"Saved full mascot: {output_path} ({result.size})")

# Also generate a square avatar/head crop for navbar & mini badges
rw, rh = result.size
# Head region is approximately the top 65% of the mascot
head_crop = result.crop((int(rw * 0.05), int(rh * 0.02), int(rw * 0.95), int(rh * 0.65)))
head_crop.save(head_output_path, 'PNG')
print(f"Saved head mascot: {head_output_path} ({head_crop.size})")
