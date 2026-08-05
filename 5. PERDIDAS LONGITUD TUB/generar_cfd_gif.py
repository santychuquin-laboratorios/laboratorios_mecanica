from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import random

W, H = 1000, 420
FRAMES = 54
PIPE_X0, PIPE_X1 = 70, 940
PIPE_Y0, PIPE_Y1 = 145, 305
random.seed(21)

def font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()

F_TITLE, F_LABEL, F_SMALL = font(24, True), font(16, True), font(13)

particles = []
for _ in range(170):
    y_norm = random.uniform(-0.94, 0.94)
    particles.append((random.random(), y_norm, random.uniform(0.75, 1.25), random.uniform(1.8, 3.7)))

def color_map(speed):
    # Azul = baja velocidad; cian/amarillo = núcleo rápido.
    stops = [(14, 68, 155), (18, 144, 214), (39, 219, 214), (246, 219, 74)]
    t = max(0, min(0.999, speed)) * (len(stops)-1)
    i, f = int(t), t-int(t)
    a, b = stops[i], stops[min(i+1, len(stops)-1)]
    return tuple(int(a[j]*(1-f)+b[j]*f) for j in range(3))

def frame(k):
    im = Image.new("RGB", (W, H), "#f5f9fd")
    d = ImageDraw.Draw(im)
    # Fondo técnico.
    for x in range(0, W, 25): d.line((x, 0, x, H), fill="#e8f0f6", width=1)
    for y in range(0, H, 25): d.line((0, y, W, y), fill="#e8f0f6", width=1)
    d.text((38, 22), "PÉRDIDAS POR LONGITUD DE TUBERÍA · VISUALIZACIÓN CFD", font=F_TITLE, fill="#102b4e")
    d.text((39, 56), "La fricción con la pared disipa energía y produce una caída continua de presión.", font=F_SMALL, fill="#58708c")

    # Línea de energía y gradiente de presión.
    energy_y0, energy_y1 = 94, 126
    d.line((PIPE_X0, energy_y0, PIPE_X1, energy_y1), fill="#ef4444", width=4)
    d.polygon([(PIPE_X1, energy_y1), (PIPE_X1-13, energy_y1-8), (PIPE_X1-12, energy_y1+7)], fill="#ef4444")
    d.text((PIPE_X0, 76), "ENERGÍA / PRESIÓN", font=F_SMALL, fill="#c62f3a")
    d.text((PIPE_X1-138, 100), "Δhƒ", font=F_LABEL, fill="#c62f3a")

    # Sombra y pared metálica.
    shadow = Image.new("RGBA", (W, H), (0,0,0,0)); sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((PIPE_X0-14, PIPE_Y0-13, PIPE_X1+14, PIPE_Y1+17), radius=28, fill=(10,35,60,70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(9)); im.paste(shadow, (0,0), shadow); d = ImageDraw.Draw(im)
    d.rounded_rectangle((PIPE_X0-8, PIPE_Y0-10, PIPE_X1+8, PIPE_Y1+10), radius=24, fill="#596876", outline="#394955", width=4)

    # Campo de velocidad parabólico dentro de la tubería.
    cy, radius = (PIPE_Y0+PIPE_Y1)/2, (PIPE_Y1-PIPE_Y0)/2
    for y in range(PIPE_Y0, PIPE_Y1):
        yn = abs((y-cy)/radius)
        velocity = max(0, 1-yn**2)
        col = color_map(velocity)
        d.line((PIPE_X0, y, PIPE_X1, y), fill=col, width=1)
    # Capas límite y esfuerzo cortante pulsante.
    pulse = int(10 + 4*math.sin(k/FRAMES*2*math.pi))
    d.rectangle((PIPE_X0, PIPE_Y0, PIPE_X1, PIPE_Y0+pulse), fill="#144e9a")
    d.rectangle((PIPE_X0, PIPE_Y1-pulse, PIPE_X1, PIPE_Y1), fill="#144e9a")
    for x in range(PIPE_X0+20, PIPE_X1-10, 48):
        shift = (k*5) % 48
        xx = PIPE_X0 + ((x-PIPE_X0+shift) % (PIPE_X1-PIPE_X0-20))
        d.line((xx, PIPE_Y0+5, xx+18, PIPE_Y0+5), fill="#ff8a47", width=3)
        d.line((xx+18, PIPE_Y1-5, xx, PIPE_Y1-5), fill="#ff8a47", width=3)

    # Partículas: velocidad local menor cerca de la pared.
    for base_x, yn, jitter, size in particles:
        local_v = max(0.08, 1-yn*yn)
        phase = (base_x + k/FRAMES*1.30*local_v*jitter) % 1
        x = PIPE_X0 + phase*(PIPE_X1-PIPE_X0)
        y = cy + yn*(radius-10) + math.sin(k*.19+base_x*18)*1.5
        c = color_map(local_v)
        r = size if local_v > .35 else size*.75
        d.ellipse((x-r,y-r,x+r,y+r), fill=c, outline="#d8fbff")

    # Perfil de velocidad a la salida.
    px = PIPE_X1-45
    d.line((px, PIPE_Y0+8, px, PIPE_Y1-8), fill="#ffffff", width=2)
    points=[]
    for y in range(PIPE_Y0+8, PIPE_Y1-7, 4):
        yn=(y-cy)/(radius-8); vel=max(0,1-yn*yn)
        points.append((px-int(vel*70),y))
    d.line(points, fill="#ffffff", width=3)
    d.text((PIPE_X1-190, PIPE_Y1+18), "Perfil de velocidad", font=F_SMALL, fill="#234665")

    # Leyendas inferiores.
    d.rounded_rectangle((48, 345, 952, 397), radius=13, fill="#ffffff", outline="#d5e1ec", width=2)
    d.ellipse((69,362,83,376),fill="#f4d84d"); d.text((92,359),"Núcleo: mayor velocidad",font=F_SMALL,fill="#243e5c")
    d.ellipse((292,362,306,376),fill="#14509b"); d.text((315,359),"Pared: V ≈ 0",font=F_SMALL,fill="#243e5c")
    d.line((478,369,510,369),fill="#ff8a47",width=4); d.text((520,359),"Esfuerzo cortante",font=F_SMALL,fill="#243e5c")
    d.line((708,369,740,369),fill="#ef4444",width=4); d.text((750,359),"Pérdida acumulada hƒ",font=F_SMALL,fill="#243e5c")
    return im

frames = [frame(i) for i in range(FRAMES)]
frames[0].save("perdidas-longitud-cfd.gif", save_all=True, append_images=frames[1:], duration=70, loop=0, disposal=2, optimize=False)
print("GIF generado: perdidas-longitud-cfd.gif")
