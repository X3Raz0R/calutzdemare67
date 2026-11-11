# Antonio Medeleanu, portfolio

A static site: one HTML page, one stylesheet, one script. No build step.

```
index.html            the page (all text lives here)
assets/css/style.css  design tokens, layout, animations
assets/js/main.js     scroll reveals, tabs, lightbox, hero dot grid, theme toggle
assets/img/           photos and screenshots
cv.pdf                the CV the buttons link to
```

## Preview it

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Put it online with GitHub Pages

In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. The site appears at `https://x3raz0r.github.io/calutzdemare67/`.

## Add a photo to the gallery

1. Put the image in `assets/img/` (about 1600 px wide is plenty; `.webp` or `.jpg`).
2. Copy one `<figure>` block inside `<div class="gallery" id="gallery-items">` in `index.html` and change the file name, the `alt` text, the caption and the two `data-` attributes on the button.

Tall photos look best with `class="tall"` on the `<figure>`.

## Add a project

Copy one `<article class="card">` block in the "More projects" section of `index.html`. Use `class="card wide"` for a card that spans half the row. The small animation at the top of each card is plain CSS in `style.css` (search for `viz:`).

## Notes

- Dark and light themes follow the visitor's system setting; the button in the header overrides it and remembers the choice.
- Animations are switched off for visitors who ask their system to reduce motion.
