# Course Assets

This folder holds all supplementary files for the course. The structure is:

```
assets/
├── images/          ← visual assets used in the course
│   ├── banner.png       Course card image (1200×630 px)
│   └── ...
├── starter/         ← starter code distributed to students
│   ├── ch-01/
│   │   ├── README.md    Instructions specific to this chapter's exercise
│   │   └── starter.py   (or .js, .sh, .go, etc.)
│   └── final-project/
│       └── template/
├── solutions/       ← reference solutions (see note below)
│   └── ch-01/
│       └── solution.py
├── slides/          ← PDF slide decks, one per chapter
│   └── ch-01-slides.pdf
└── data/            ← datasets for exercises
    └── sample.csv
```

## Referencing assets in `course.yaml`

### Images
```yaml
thumbnail: "./assets/images/banner.png"
```

### Starter code — inline (preferred for short snippets)
```yaml
starter_code: |
  # starter.py
  def main():
      pass  # implement here
```

### Starter code — file reference (for larger projects)
```yaml
description: >
  Download the starter files from
  https://raw.githubusercontent.com/manojpisini/opencourses/main/engine/courses/<slug>/assets/starter/ch-01/starter.py
```

### Slides / PDFs
```yaml
url: "https://raw.githubusercontent.com/manojpisini/opencourses/main/engine/courses/<slug>/assets/slides/ch-01-slides.pdf"
```

## Notes on solutions/

Reference solutions should ideally live in a **separate private branch** or
be excluded from the public repo via `.gitignore` to prevent students from
copying them directly. If you include them here, do so only after the cohort
that uses them has finished.
