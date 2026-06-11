# Meshach Ando Portfolio

Minimal editorial portfolio website for Meshach Ando, built as a static GitHub Pages site.

## Purpose

The site provides four focused professional entry paths:

- `water-resources/` for water resources, stormwater, hydraulics, modeling, and GIS.
- `environmental/` for environmental systems, solid waste, methane, PFAS, and atmospheric modeling.
- `geotech/` for geotechnical, civil field, QA/QC, and waste containment work.
- `research/` for research areas, manuscripts, methods, figures, datasets, code, and presentations.

## File Structure

```text
.
|-- index.html
|-- water-resources/
|   `-- index.html
|-- environmental/
|   `-- index.html
|-- geotech/
|   `-- index.html
|-- research/
|   `-- index.html
|-- assets/
|   |-- css/
|   |   `-- style.css
|   |-- js/
|   |   `-- main.js
|   |-- images/
|   |   `-- placeholders/
|   `-- docs/
|       |-- Meshach_Ando_Full_CV.pdf
|       |-- Meshach_Ando_Water_Resources_Resume.pdf
|       |-- Meshach_Ando_Environmental_Resume.pdf
|       |-- Meshach_Ando_Geotech_Resume.pdf
|       `-- Meshach_Ando_Research_CV.pdf
|-- README.md
`-- .gitignore
```

## Editing Text

Edit the HTML file for the page you want to update. The homepage is `index.html`. Each focused portfolio page lives in its own folder as `index.html`.

Shared design settings, layout, colors, typography, spacing, and responsive rules live in `assets/css/style.css`.

Small JavaScript behavior for reveal animations and the footer year lives in `assets/js/main.js`.

## Replacing Resume PDFs

Replace the placeholder files in `assets/docs/` with final PDFs using the same filenames. Keeping the filenames unchanged means all download buttons will continue to work.

## Replacing Image Placeholders

The first version uses CSS visual placeholders to avoid broken images. To add real images:

1. Put image files in `assets/images/placeholders/` or another folder under `assets/images/`.
2. Replace a `<div class="visual-placeholder">...</div>` block with an `<img>` element.
3. Use relative paths, such as `../assets/images/placeholders/example.jpg` from subpages or `assets/images/placeholders/example.jpg` from the homepage.

## GitHub Pages Deployment

This site is designed for the `meshando-unf.github.io` GitHub Pages user-site repository.

Recommended Pages settings:

- Source: Deploy from branch
- Branch: `main`
- Folder: `/root`

Expected live routes:

- `https://meshando-unf.github.io/`
- `https://meshando-unf.github.io/water-resources/`
- `https://meshando-unf.github.io/environmental/`
- `https://meshando-unf.github.io/geotech/`
- `https://meshando-unf.github.io/research/`

No `CNAME` file is included yet because the requested live URL uses the default GitHub Pages domain. Add a `CNAME` file only when a real custom domain is ready.
