# Images

Drop your own image files in this folder, then reference them from `style.css`.

## Currently supported slots

| Slot | CSS rule in `style.css` | Suggested size |
|------|------------------------|----------------|
| Home hero background | `.hero-bg` | 1200 x 800 px, landscape |
| Generating screen background | `.gen-screen` | 1200 x 900 px, landscape |

## How to add a hero image

1. Save your file here, e.g. `images/hero.jpg`
2. Open `style.css`, find `.hero-bg` and uncomment the `background-image` line:

```css
.hero-bg{
  /* ...existing gradient... */
  background-image:
    linear-gradient(155deg, rgba(23,92,64,.88), rgba(11,51,36,.94)),
    url("images/hero.jpg");
  background-size: cover;
  background-position: center;
}
```

Keep the dark gradient layer on top of the photo — it is what keeps the white
heading text readable. Without it, light areas of the photo will wash out the text.

## Keep file sizes small

Large photos make the app slow to load on mobile data. Aim for under 300 KB per
image. Resize to no more than 1600 px on the long edge and export as JPEG at
around 80% quality, or WebP for smaller files.

## Attribution

If a licence requires credit, add it to the main README so it ships with the
repository.
