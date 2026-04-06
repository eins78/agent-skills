# Pandoc Advanced Topics

## Table of Contents

- [Lua Filters](#lua-filters)
- [Custom Readers and Writers](#custom-readers-and-writers)
- [Metadata and YAML Frontmatter](#metadata-and-yaml-frontmatter)
- [Citation Processing](#citation-processing-citeproc)
- [Slide Deck Generation](#slide-deck-generation)
- [Template Customization](#template-customization)
- [Defaults Files](#defaults-files-in-depth)
- [Jupyter Notebook Handling](#jupyter-notebook-handling)
- [EPUB Production](#epub-production)
- [Batch Processing Patterns](#batch-processing-patterns)

---

## Lua Filters

Lua filters are the primary extension mechanism for pandoc. They modify the document AST between reading and writing, without external dependencies (Lua is built into pandoc).

### Basic usage

```bash
pandoc --lua-filter=filter.lua -o output.md input.md
# Or short form:
pandoc -L filter.lua -o output.md input.md
```

### Filter structure

A Lua filter returns a table of functions indexed by AST element names:

```lua
-- uppercase.lua: Convert all text to uppercase
return {
  {
    Str = function(elem)
      return pandoc.Str(elem.text:upper())
    end,
  }
}
```

### Common filter patterns

**Remove all images:**

```lua
return {{
  Image = function(elem)
    return {}  -- empty list removes the element
  end
}}
```

**Add class to all code blocks:**

```lua
return {{
  CodeBlock = function(elem)
    elem.classes:insert("highlight")
    return elem
  end
}}
```

**Replace divs with custom output:**

```lua
return {{
  Div = function(elem)
    if elem.classes:includes("warning") then
      return pandoc.RawBlock("html",
        "<div class='alert alert-warning'>" ..
        pandoc.write(pandoc.Pandoc(elem.content), "html") ..
        "</div>")
    end
  end
}}
```

**Read and write within a filter:**

```lua
-- The pandoc module provides read/write functions
local doc = pandoc.read("**bold text**", "markdown")
local html = pandoc.write(doc, "html")
```

### Key AST element types

| Element | Description |
|---------|-------------|
| `Pandoc` | Top-level document |
| `Meta` | Document metadata |
| `Block` | Block-level elements (Para, Header, CodeBlock, BulletList, etc.) |
| `Inline` | Inline elements (Str, Emph, Strong, Code, Link, Image, etc.) |
| `Header` | Heading with level, attributes, and inline content |
| `Para` | Paragraph |
| `CodeBlock` | Code block with attributes |
| `Div` | Generic block container with attributes |
| `Span` | Generic inline container with attributes |

### Filter search path

1. Specified full or relative path
2. `$DATADIR/filters` (user data directory)

### Community filters

- https://github.com/pandoc/lua-filters — Official collection
- Filters can be installed to `$DATADIR/filters` for global availability

---

## Custom Readers and Writers

### Custom reader

A Lua script defining a `Reader(input, options)` function:

```lua
-- my-reader.lua
function Reader(input)
  -- input is a string; return a Pandoc AST
  return pandoc.Pandoc({pandoc.Para({pandoc.Str(input)})})
end
```

Usage: `pandoc -f my-reader.lua -t html`

### Custom writer

A Lua script defining rendering functions for each AST element:

```bash
# See the built-in djot writer as an example:
pandoc --print-default-data-file djot-writer.lua
```

Custom writers have no default template — pair with `--template`:

```bash
pandoc -t my-writer.lua --template my-template.txt -s input.md
```

---

## Metadata and YAML Frontmatter

### YAML metadata blocks

Pandoc reads YAML metadata blocks delimited by `---` and `...` (or `---`):

```yaml
---
title: My Document
author:
  - Alice
  - Bob
date: 2024-01-15
abstract: |
  This is a multi-paragraph abstract.

  It supports **Markdown** formatting.
keywords: [pandoc, conversion, metadata]
lang: en-US
---
```

### Multiple metadata blocks

A document can contain multiple YAML blocks. Later values override earlier ones for scalar fields. List fields are concatenated.

### Metadata vs variables

| Mechanism | Flag | Template access | Filter access | Escaping |
|-----------|------|-----------------|---------------|----------|
| Metadata | `-M key=val` | Yes | Yes | Yes (escaped) |
| Variable | `-V key=val` | Yes | No | No (raw) |
| YAML block | N/A | Yes | Yes | Yes (escaped) |

- Use **metadata** (`-M`) for document properties (title, author, etc.)
- Use **variables** (`-V`) for template-only values (page geometry, custom flags)
- YAML blocks are the most common way to set metadata

### Metadata files

```bash
pandoc --metadata-file=meta.yaml -o output.html input.md
```

Multiple files can be specified; later files take precedence.

---

## Citation Processing (citeproc)

### Basic usage

```bash
pandoc --citeproc --bibliography=refs.bib -o output.html input.md
```

### Citation syntax in Markdown

```markdown
Blah blah [@smith2020, p. 33].          # parenthetical
Blah blah @smith2020.                   # in-text / narrative
Blah blah [-@smith2020].                # suppress author
[@smith2020; @jones2021]                # multiple citations
[@smith2020, p. 33-35, fig. 1]         # with locator
```

### Bibliography formats

| Format | Extension | Notes |
|--------|-----------|-------|
| BibTeX | `.bib` | Most common |
| BibLaTeX | `.bib` | Extended BibTeX |
| CSL JSON | `.json` | Language-independent |
| CSL YAML | `.yaml` | Language-independent |

### Citation style

```bash
# Default: chicago-author-date
pandoc --citeproc --csl=ieee.csl --bibliography=refs.bib input.md -o output.html
```

CSL styles available at: https://www.zotero.org/styles

### Via YAML metadata

```yaml
---
bibliography: refs.bib
csl: ieee.csl
link-citations: true
---
```

### Bibliography placement

By default, the bibliography is placed at the end. Control with a div:

```markdown
# References

::: {#refs}
:::

# Appendix

Content after the bibliography.
```

---

## Slide Deck Generation

### Formats

| Format | Command | Notes |
|--------|---------|-------|
| reveal.js | `pandoc -t revealjs -s` | HTML5, full-featured |
| PowerPoint | `pandoc -o slides.pptx` | Native PPTX |
| Beamer | `pandoc -t beamer -o slides.pdf` | LaTeX, requires TeX |
| Slidy | `pandoc -t slidy -s` | HTML, W3C |
| S5 | `pandoc -t s5 -s` | HTML, lightweight |
| DZSlides | `pandoc -t dzslides -s` | HTML5, minimal |

### Structuring slides

Pandoc determines slide boundaries from headings:

```markdown
---
title: My Talk
author: Alice
---

# Section Title        ← section separator (not a slide)

## Slide Title         ← slide boundary (level 2)

Content on this slide.

## Another Slide

- Bullet 1
- Bullet 2

---                    ← horizontal rule also creates a slide break
```

The `--slide-level` option controls which heading level creates slides (default: auto-detected).

### Speaker notes

```markdown
## Slide Title

Content visible to audience.

::: notes
These are speaker notes, visible only in presenter view.
:::
```

### Incremental lists

```bash
pandoc -t revealjs -s -i input.md -o slides.html
```

Or per-list in the source:

```markdown
::: incremental
- Item 1
- Item 2
:::

::: nonincremental
- Always shown together
:::
```

### Columns (reveal.js, Beamer, PowerPoint)

```markdown
:::::::::::::: {.columns}
::: {.column width="50%"}
Left column content
:::
::: {.column width="50%"}
Right column content
:::
::::::::::::::
```

### reveal.js configuration

```yaml
---
title: My Talk
revealjs-url: https://unpkg.com/reveal.js@^5
theme: moon
transition: slide
---
```

### PowerPoint templates

```bash
pandoc -o slides.pptx --reference-doc=template.pptx input.md
```

Create a custom template:

```bash
pandoc -o custom-reference.pptx --print-default-data-file reference.pptx
# Edit in PowerPoint, modify slide layouts, save
```

---

## Template Customization

### Extract the default template

```bash
pandoc -D html > my-template.html
pandoc -D latex > my-template.tex
```

### Use a custom template

```bash
pandoc --template=my-template.html -s -o output.html input.md
```

### Template syntax

**Variables:** `$title$`, `${author}$`

**Conditionals:**

```
$if(toc)$
<nav id="TOC">$table-of-contents$</nav>
$endif$
```

**Loops:**

```
$for(author)$
<meta name="author" content="$author$">
$endfor$
```

**Partials (includes):**

```
${ styles.html() }
```

### Common customization patterns

**Add custom CSS to HTML:**

```bash
pandoc -s --css=custom.css -o output.html input.md
```

**Add custom LaTeX preamble:**

```bash
pandoc -s -H preamble.tex -o output.pdf input.md
```

**Set variables from the command line:**

```bash
pandoc -s -V geometry:margin=1in -V fontsize=12pt -o output.pdf input.md
```

---

## Defaults Files (In-Depth)

A YAML file that pre-configures pandoc options. Eliminates repetitive command lines.

### Example: article defaults

```yaml
# article.yaml
reader: markdown
writer: pdf
standalone: true
pdf-engine: xelatex
variables:
  documentclass: scrartcl
  geometry:
    - margin=1in
  fontsize: 11pt
  mainfont: "TeX Gyre Pagella"
  monofont: "Fira Code"
  linestretch: 1.2
table-of-contents: true
toc-depth: 2
number-sections: true
metadata:
  lang: en-US
```

Usage:

```bash
pandoc -d article -o paper.pdf paper.md
```

### Example: HTML report defaults

```yaml
# report.yaml
reader: markdown
writer: html5
standalone: true
table-of-contents: true
css:
  - https://cdn.simplecss.org/simple.min.css
variables:
  maxwidth: 48em
metadata:
  lang: en-US
embed-resources: true
```

### Chaining defaults

```bash
pandoc -d base -d article input.md   # base.yaml + article.yaml
```

Later defaults override earlier ones for scalar values; list values are merged.

---

## Jupyter Notebook Handling

### Notebook to Markdown

```bash
pandoc -o output.md notebook.ipynb
pandoc --extract-media=media/ -o output.md notebook.ipynb   # with images
```

### Markdown to Notebook

```bash
pandoc -o output.ipynb input.md
```

Code blocks with language attributes become code cells:

````markdown
```python
import pandas as pd
df = pd.read_csv("data.csv")
df.head()
```
````

### Output cell handling

`--ipynb-output=all|none|best`

- `all`: preserve all output formats from original
- `none`: strip outputs
- `best`: pick richest compatible format (default)

### Markdown extensions in notebooks

Markdown extensions specified for `ipynb` format affect Markdown cells:

```bash
pandoc --from ipynb+raw_html -o output.md notebook.ipynb
```

---

## EPUB Production

### Basic EPUB

```bash
pandoc -o book.epub title.md chapter1.md chapter2.md
```

### With metadata

```yaml
---
title: My Book
author: Jane Doe
date: 2024-01-01
lang: en-US
cover-image: cover.jpg
css: epub-style.css
---
```

### Key options

```bash
pandoc -o book.epub \
  --epub-cover-image=cover.jpg \
  --epub-embed-font=fonts/*.ttf \
  --css=epub.css \
  --toc --toc-depth=2 \
  --split-level=2 \
  title.md chapters/*.md
```

### EPUB metadata via XML

```bash
pandoc --epub-metadata=metadata.xml -o book.epub input.md
```

### Styling

Pandoc looks for `epub.css` in the user data directory if no CSS is specified. Custom CSS:

```bash
pandoc --css=my-epub-style.css -o book.epub input.md
```

---

## Batch Processing Patterns

### Convert all files in a directory

```bash
for f in *.md; do
  pandoc -s -o "${f%.md}.html" "$f"
done
```

### DOCX to Markdown with media extraction

```bash
for f in *.docx; do
  name="${f%.docx}"
  mkdir -p "$name/media"
  pandoc --extract-media="$name/media" --wrap=none -o "$name/$name.md" "$f"
done
```

### Using a defaults file for batch jobs

```bash
for f in chapters/*.md; do
  pandoc -d article -o "output/$(basename "${f%.md}.pdf")" "$f"
done
```

### Makefile pattern

```makefile
SOURCES := $(wildcard *.md)
PDFS := $(SOURCES:.md=.pdf)
HTMLS := $(SOURCES:.md=.html)

all: $(PDFS) $(HTMLS)

%.pdf: %.md
	pandoc -d article -o $@ $<

%.html: %.md
	pandoc -s --toc -o $@ $<

clean:
	rm -f $(PDFS) $(HTMLS)
```

### Parallel conversion with GNU parallel

```bash
find . -name '*.md' | parallel pandoc -s -o {.}.html {}
```
