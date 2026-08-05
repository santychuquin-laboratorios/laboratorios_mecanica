from collections import deque
from PIL import Image

path = "flujometro-ultrasonico.png"
image = Image.open(path).convert("RGBA")
width, height = image.size
pixels = image.load()
queue = deque()
seen = set()
background = set()

for x in range(width):
    queue.append((x, 0))
    queue.append((x, height - 1))
for y in range(height):
    queue.append((0, y))
    queue.append((width - 1, y))

while queue:
    x, y = queue.popleft()
    if (x, y) in seen:
        continue
    seen.add((x, y))
    red, green, blue, _ = pixels[x, y]
    if min(red, green, blue) < 210 or max(red, green, blue) - min(red, green, blue) > 18:
        continue
    background.add((x, y))
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in seen:
            queue.append((nx, ny))

for x, y in background:
    red, green, blue, _ = pixels[x, y]
    alpha = max(0, min(255, int((255 - min(red, green, blue)) * 5.7)))
    pixels[x, y] = red, green, blue, alpha

image.save(path, optimize=True)
print(f"Fondo eliminado: {len(background)} píxeles procesados")
