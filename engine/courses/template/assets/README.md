# Course Assets

This folder holds all supplementary files for the course. The structure is:

```
assets/
├── images/          ← visual assets used in the course
│   ├── diagrams/        Lesson diagrams and screenshots
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
assets:
  images:
    - assets/images/diagrams/<lesson-diagram>.png
```

Course card and hero artwork is generated automatically from
`classification.category`; do not add banner, thumbnail, OG, or certificate
badge files unless a specific lesson explicitly references them.

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

Reference solutions may live in the public course tree. OpenCourses assumes
learners use them for review and submit their own work with integrity.
