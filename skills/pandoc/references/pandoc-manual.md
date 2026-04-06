# Pandoc Manual (Curated Reference)

> Curated from pandoc 3.9.0.2 man page. For the complete manual: `man pandoc` or https://pandoc.org/MANUAL.html

## Table of Contents

- [Description](#description)
- [Using Pandoc](#using-pandoc)
- [Specifying Formats](#specifying-formats)
- [Creating a PDF](#creating-a-pdf)
- [Reading from the Web](#reading-from-the-web)
- [Options Reference](#options)
  - [General Options](#general-options)
  - [Reader Options](#reader-options)
  - [General Writer Options](#general-writer-options)
  - [Options Affecting Specific Writers](#options-affecting-specific-writers)
  - [Citation Rendering](#citation-rendering)
  - [Math Rendering in HTML](#math-rendering-in-html)
- [Exit Codes](#exit-codes)
- [Defaults Files](#defaults-files)
- [Templates](#templates)
- [Template Variables](#variables)
  - [Metadata Variables](#metadata-variables)
  - [Language Variables](#language-variables)
  - [Variables for HTML](#variables-for-html)
  - [Variables for LaTeX](#variables-for-latex)
  - [Variables Set Automatically](#variables-set-automatically)
- [Extensions](#extensions)
- [Markdown Variants](#markdown-variants)
- [Custom Readers and Writers](#custom-readers-and-writers)
- [Security Notes](#a-note-on-security)

---

# DESCRIPTION

Pandoc is a Haskell library for converting from one markup format to another, and a command-line tool that uses this library.

Pandoc has a modular design: it consists of a set of readers, which parse text in a given format and produce a native representation of the document (an *abstract syntax tree* or AST), and a set of writers, which convert this native representation into a target format. Thus, adding an input or output format requires only adding a reader or writer. Users can also run custom pandoc filters to modify the intermediate AST.

Because pandoc's intermediate representation of a document is less expressive than many of the formats it converts between, one should not expect perfect conversions between every format and every other. Pandoc attempts to preserve the structural elements of a document, but not formatting details such as margin size. Conversions from formats more expressive than pandoc's Markdown can be expected to be lossy.

## Using pandoc

If no *input-files* are specified, input is read from *stdin*. Output goes to *stdout* by default. For output to a file, use the `-o`/`--output` option:

    pandoc -o output.html input.txt

By default, pandoc produces a document fragment. To produce a standalone document (e.g. a valid HTML file including `<head>` and `<body>`), use the `-s` or `--standalone` flag:

    pandoc -s -o output.html input.txt

If multiple input files are given, pandoc will concatenate them all (with blank lines between them) before parsing. (Use `--file-scope` to parse files individually.)

## Specifying formats

The input format can be specified using the `-f/--from` option, the output format using the `-t/--to` option:

    pandoc -f markdown -t latex hello.txt
    pandoc -f html -t markdown hello.html

If not specified explicitly, pandoc guesses from file extensions. If no output file is specified, output defaults to HTML. If no input file is specified, input is assumed to be Markdown.

List available formats:

    pandoc --list-input-formats
    pandoc --list-output-formats

## Character encoding

Pandoc uses UTF-8 for both input and output. Pipe through `iconv` if needed:

    iconv -t utf-8 input.txt | pandoc | iconv -f utf-8

## Creating a PDF

Specify an output file with a `.pdf` extension:

    pandoc test.txt -o test.pdf

By default, pandoc uses LaTeX to create the PDF, which requires a LaTeX engine. Alternatives:

    pandoc --pdf-engine=xelatex -o test.pdf test.txt      # Unicode/custom fonts
    pandoc --pdf-engine=typst -o test.pdf test.txt         # lightweight, no LaTeX
    pandoc -t html --pdf-engine=weasyprint -o test.pdf test.txt  # via HTML/CSS
    pandoc -t context -o test.pdf test.txt                 # via ConTeXt

To debug PDF creation, look at the intermediate representation:

    pandoc -s -o test.tex test.txt    # then: pdflatex test.tex

When using LaTeX, the following packages are required (included in TeX Live): `amsfonts`, `amsmath`, `lm`, `unicode-math`, `iftex`, `fancyvrb`, `longtable`, `booktabs`, `graphicx`, `bookmark`, `xcolor`, `soul`, `geometry`, `setspace`, and `babel`.

## Reading from the Web

Instead of an input file, an absolute URI may be given:

    pandoc -f html -t markdown https://www.fsf.org

Custom headers:

    pandoc -f html -t markdown --request-header User-Agent:"Mozilla/5.0" \
      https://www.fsf.org

---

# OPTIONS

## General options

`-f` *FORMAT*, `-r` *FORMAT*, `--from=`*FORMAT*, `--read=`*FORMAT*
Specify input format. Use `pandoc --list-input-formats` for the full list. Key formats:

| Format | Description |
|--------|-------------|
| `markdown` | Pandoc's Markdown (default input) |
| `gfm` | GitHub-Flavored Markdown |
| `commonmark` | CommonMark |
| `commonmark_x` | CommonMark with pandoc extensions |
| `html` | HTML |
| `latex` | LaTeX |
| `docx` | Word docx |
| `odt` | OpenDocument text |
| `epub` | EPUB |
| `rst` | reStructuredText |
| `org` | Emacs Org mode |
| `csv` / `tsv` | CSV/TSV tables |
| `ipynb` | Jupyter notebook |
| `jira` | Jira/Confluence wiki markup |
| `man` | roff man page |
| `docbook` | DocBook XML |
| `mediawiki` | MediaWiki markup |
| `rtf` | Rich Text Format |
| `typst` | Typst |

Extensions can be individually enabled or disabled by appending `+EXTENSION` or `-EXTENSION` to the format name.

`-t` *FORMAT*, `-w` *FORMAT*, `--to=`*FORMAT*, `--write=`*FORMAT*
Specify output format. Use `pandoc --list-output-formats` for the full list. Key formats in addition to those above:

| Format | Description |
|--------|-------------|
| `pdf` | PDF (via LaTeX, Typst, HTML, or ConTeXt) |
| `beamer` | LaTeX Beamer slides |
| `revealjs` | reveal.js HTML slides |
| `pptx` | PowerPoint slides |
| `ansi` | Text with ANSI escape codes (terminal) |
| `plain` | Plain text |
| `context` | ConTeXt |
| `texinfo` | GNU Texinfo |
| `tei` | TEI Simple |

Note that `odt`, `docx`, `epub`, and `pdf` output will not be directed to *stdout* unless forced with `-o -`.

`-o` *FILE*, `--output=`*FILE*
Write output to *FILE* instead of *stdout*. If *FILE* is `-`, output goes to *stdout*.

`--data-dir=`*DIRECTORY*
Specify the user data directory for pandoc data files. Default: `$HOME/.local/share/pandoc` (macOS/Linux) or `%APPDATA%\pandoc` (Windows). Check with `pandoc --version`.

`-d` *FILE*, `--defaults=`*FILE*
Specify a set of default option settings as a YAML file. See [Defaults Files](#defaults-files).

`--verbose`
Give verbose debugging output.

`--quiet`
Suppress warning messages.

`--fail-if-warnings[=true|false]`
Exit with error status if there are any warnings.

`--log=`*FILE*
Write log messages in JSON format to *FILE*.

`--list-input-formats`
List supported input formats, one per line.

`--list-output-formats`
List supported output formats, one per line.

`--list-extensions`[`=`*FORMAT*]
List supported extensions for *FORMAT*, preceded by `+` or `-` indicating default status.

`--list-highlight-languages`
List supported languages for syntax highlighting.

`--list-highlight-styles`
List supported styles for syntax highlighting.

`-D` *FORMAT*, `--print-default-template=`*FORMAT*
Print the system default template for an output *FORMAT*.

`-v`, `--version`
Print version.

`-h`, `--help`
Show usage message.

## Reader options

`--shift-heading-level-by=`*NUMBER*
Shift heading levels by a positive or negative integer. `--shift-heading-level-by=-1` is useful for converting HTML/Markdown documents that use level-1 headings for the document title.

`--file-scope[=true|false]`
Parse each file individually before combining for multifile documents. Allows footnotes in different files with the same identifiers to work. Reading binary files (docx, odt, epub) implies `--file-scope`.

`-F` *PROGRAM*, `--filter=`*PROGRAM*
Specify an executable to be used as a filter transforming the pandoc AST after the input is parsed and before the output is written. The executable should read JSON from stdin and write JSON to stdout.

`-L` *SCRIPT*, `--lua-filter=`*SCRIPT*
Transform the document using pandoc's built-in Lua filtering system. The given Lua script is expected to return a list of Lua filters. Lua filters are preferred over JSON filters for performance. Looked up in: specified path, then `$DATADIR/filters`.

`-M` *KEY*[`=`*VAL*], `--metadata=`*KEY*[`:`*VAL*]
Set the metadata field *KEY* to the value *VAL*. Values are parsed as YAML boolean or string. Affects document metadata (accessible from filters) and template variables. Values are escaped when inserted into the template.

`--metadata-file=`*FILE*
Read metadata from a YAML (or JSON) file. Can be repeated; later files take precedence. Document metadata overrides file metadata.

`--track-changes=accept`|`reject`|`all`
What to do with MS Word "Track Changes". `accept` (default) processes all insertions/deletions. `reject` ignores them. `all` includes everything with classes. Only affects docx reader.

`--extract-media=`*DIR*|*FILE*`.zip`
Extract images and other media from the source document to *DIR*, adjusting references. If path ends in `.zip`, creates a zip archive instead.

## General writer options

`-s`, `--standalone`
Produce output with appropriate header and footer (standalone document). Set automatically for `pdf`, `epub`, `docx`, and `odt` output.

`--template=`*FILE*|*URL*
Use a custom template. Implies `--standalone`. See [Templates](#templates).

`-V` *KEY*[`=`*VAL*], `--variable=`*KEY*[`=`*VAL*]
Set template variable *KEY* to string value *VAL* in standalone mode.

`--sandbox[=true|false]`
Run pandoc in a sandbox, limiting IO operations. Recommended for untrusted input.

`--wrap=auto`|`none`|`preserve`
Determine text wrapping. `auto` (default) wraps to `--columns` width. `none` disables wrapping. `preserve` keeps source wrapping.

`--columns=`*NUMBER*
Specify line length (default 72). Affects wrapping and plain text table widths.

`--toc[=true|false]`, `--table-of-contents[=true|false]`
Include automatically generated table of contents. Requires `-s/--standalone`.

`--toc-depth=`*NUMBER*
Number of section levels in TOC (default 3).

`-N`, `--number-sections=[true|false]`
Number section headings in LaTeX, ConTeXt, HTML, Docx, ms, or EPUB output.

`--syntax-highlighting=default|none|idiomatic|`*STYLE*`|`*FILE*
Method for code syntax highlighting. Styles: `pygments` (default), `kate`, `monochrome`, `breezeDark`, `espresso`, `zenburn`, `haddock`, `tango`.

`-H` *FILE*, `--include-in-header=`*FILE*|*URL*
Include contents of *FILE* at end of header (e.g. for custom CSS/JS). Implies `--standalone`.

`-B` *FILE*, `--include-before-body=`*FILE*|*URL*
Include contents at beginning of document body.

`-A` *FILE*, `--include-after-body=`*FILE*|*URL*
Include contents at end of document body.

`--resource-path=`*SEARCHPATH*
Paths to search for images and other resources. Separated by `:` (Unix) or `;` (Windows).

`--embed-resources[=true|false]`
Produce a standalone HTML file with no external dependencies, using `data:` URIs. Only works with HTML output formats.

`-c` *URL*, `--css=`*URL*
Link to a CSS style sheet. Can be repeated. Only affects HTML and EPUB output.

`--reference-doc=`*FILE*|*URL*
Use the specified file as a style reference for docx or ODT output. To create a custom reference:

    pandoc -o custom-reference.docx --print-default-data-file reference.docx

Then modify styles in Word and save.

## Options affecting specific writers

`--slide-level=`*NUMBER*
Headings at this level create slides. Headings above divide into sections; below create subheads within slides.

`-i`, `--incremental[=true|false]`
Make list items in slide shows display incrementally.

`--section-divs[=true|false]`
Wrap sections in `<section>` tags in HTML output.

`--id-prefix=`*STRING*
Prefix for all identifiers and internal links.

`--split-level=`*NUMBER*
Heading level at which to split EPUB or chunked HTML into separate files (default: 1).

`--epub-cover-image=`*FILE*
Use the specified image as EPUB cover.

`--epub-metadata=`*FILE*
Dublin Core metadata XML for EPUB.

`--epub-embed-font=`*FILE*
Embed font in EPUB. Can be repeated. Supports wildcards.

`--ipynb-output=all|none|best`
How ipynb output cells are treated. `best` (default) picks the richest compatible format.

`--pdf-engine=`*PROGRAM*
PDF engine. Valid values:

| Engine | Format | Notes |
|--------|--------|-------|
| `pdflatex` | LaTeX (default) | Standard, fast |
| `xelatex` | LaTeX | Unicode, system fonts |
| `lualatex` | LaTeX | Unicode, Lua scripting |
| `tectonic` | LaTeX | Self-contained, downloads packages |
| `latexmk` | LaTeX | Handles multiple passes |
| `typst` | Typst | Lightweight, no LaTeX needed |
| `weasyprint` | HTML | CSS-based PDF |
| `prince` | HTML | Commercial, high quality |
| `wkhtmltopdf` | HTML | WebKit-based |
| `pagedjs-cli` | HTML | Paged.js polyfill |
| `context` | ConTeXt | Alternative to LaTeX |
| `pdfroff` / `groff` | ms | roff-based |

`--pdf-engine-opt=`*STRING*
Command-line argument to pass to the pdf-engine.

## Citation rendering

`-C`, `--citeproc`
Process citations, replacing them with rendered citations and adding a bibliography. Requires bibliographic data via `--bibliography` or metadata.

`--bibliography=`*FILE*
Set bibliography file. Can be repeated. Supports BibTeX, BibLaTeX, CSL JSON, and CSL YAML formats.

`--csl=`*FILE*
Set citation style (CSL file). Default: `chicago-author-date`.

`--natbib` / `--biblatex`
Use natbib/biblatex for citations in LaTeX output (not for use with `--citeproc`).

## Math rendering in HTML

`--mathjax`[`=`*URL*]
Use MathJax to display TeX math in HTML. Default: Cloudflare CDN.

`--mathml`
Convert TeX math to MathML. Default in `odt` output. Supported natively by browsers.

`--katex`[`=`*URL*]
Use KaTeX to display TeX math in HTML.

---

# EXIT CODES

| Code | Error |
|------|-------|
| 0 | Success |
| 1 | PandocIOError |
| 3 | PandocFailOnWarningError |
| 4 | PandocAppError |
| 5 | PandocTemplateError |
| 6 | PandocOptionError |
| 21 | PandocUnknownReaderError |
| 22 | PandocUnknownWriterError |
| 23 | PandocUnsupportedExtensionError |
| 24 | PandocCiteprocError |
| 43 | PandocPDFError |
| 47 | PandocPDFProgramNotFoundError |
| 61 | PandocHttpError |
| 64 | PandocParseError |
| 66 | PandocMakePDFError |
| 83 | PandocFilterError |
| 84 | PandocLuaError |
| 97 | PandocCouldNotFindDataFileError |
| 99 | PandocResourceNotFound |

---

# DEFAULTS FILES

The `--defaults` option specifies a package of options as a YAML file:

    verbosity: INFO

Environment variables can be interpolated in file path fields:

    csl: ${HOME}/mycsldir/special.csl

`${.}` resolves to the directory containing the defaults file:

    epub-cover-image: ${.}/cover.jpg
    resource-path:
    - .
    - ${.}/images

Defaults files can be placed in the `defaults` subdirectory of the user data directory and invoked from any directory:

    pandoc --defaults letter    # uses letter.yaml from defaults dir

When multiple defaults are used, their contents are combined. Command-line options that can be repeated (`--css`, `--metadata`, `--variable`, etc.) combine with defaults file values rather than replacing them.

**Mapping between command line and defaults file:**

    # Command line → defaults file
    -f markdown         → reader: markdown
    -t html             → writer: html
    -o output.html      → output-file: output.html
    -s                  → standalone: true
    --toc               → table-of-contents: true
    --columns=80        → columns: 80
    --wrap=none         → wrap: none
    -V key=val          → variables:
                            key: val
    -M key=val          → metadata:
                            key: val
    --filter prog       → filters:
                            - prog
    --lua-filter f.lua  → filters:
                            - type: lua
                              path: f.lua
    --citeproc          → citeproc: true
    --bibliography f    → metadata:
                            bibliography: f
    --css style.css     → css:
                            - style.css

---

# TEMPLATES

When `-s/--standalone` is used, pandoc uses a template to add header and footer material. To see the default template:

    pandoc -D FORMAT

Custom templates can be specified with `--template`. Override system defaults by placing templates in `templates/default.FORMAT` in the user data directory.

Exceptions:
- For `odt` output, customize `default.opendocument`
- For `docx` output, customize `default.openxml`
- For `pdf` output, customize the template for the intermediate format (`default.latex`, `default.context`, `default.ms`, or `default.html`)
- `pptx` has no template

Templates contain *variables* set via `-V/--variable`, document metadata (`-M/--metadata` or YAML blocks), or pandoc defaults.

## Template syntax overview

**Comments:** `$--` to end of line

**Delimiters:** `$...$` or `${...}`

**Variables:** `$foo$`, `$foo.bar.baz$`, `${foo}`

**Conditionals:**

    $if(variable)$
    X
    $else$
    Y
    $endif$

**For loops:**

    $for(author)$
    - $author$
    $sep$,
    $endfor$

**Partials (includes):**

    ${ partial.html() }

---

# Variables

## Metadata variables

`title`, `author`, `date`
Basic document identification. Set via title block or YAML metadata:

    ---
    author:
    - Aristotle
    - Peter Abelard
    ...

`subtitle`
Document subtitle (HTML, EPUB, LaTeX, ConTeXt, docx).

`abstract`
Document summary (HTML, LaTeX, ConTeXt, AsciiDoc, docx).

`keywords`
List of keywords (HTML, PDF, ODT, pptx, docx).

`subject`
Document subject (ODT, PDF, docx, EPUB, pptx).

`description`
Document description (ODT, docx, pptx).

## Language variables

`lang`
Main language using IETF/BCP 47 tags (e.g., `en`, `en-GB`, `fr-CA`). Controls hyphenation in PDF output.

`dir`
Base script direction: `rtl` or `ltr`.

## Variables for HTML

| Variable | Effect |
|----------|--------|
| `document-css` | Include default CSS (default: true unless `--css` used) |
| `mainfont` | CSS `font-family` on `html` element |
| `fontsize` | Base CSS `font-size` (e.g., `20px`) |
| `fontcolor` | CSS `color` on `html` element |
| `linkcolor` | CSS `color` on links |
| `monofont` | CSS `font-family` on `code` elements |
| `monobackgroundcolor` | CSS `background-color` on `code` |
| `linestretch` | CSS `line-height` (unitless preferred) |
| `maxwidth` | CSS `max-width` (default: `36em`) |
| `backgroundcolor` | CSS `background-color` on `html` |
| `margin-left/right/top/bottom` | CSS `padding` on `body` |

Override CSS inline:

    ---
    header-includes: |
      <style>
      blockquote { font-style: italic; }
      </style>
    ---

## Variables for LaTeX

### Layout

| Variable | Purpose |
|----------|---------|
| `documentclass` | `article`, `book`, `report`, or KOMA-Script equivalents |
| `classoption` | Options for document class (e.g., `twocolumn`, `landscape`) |
| `geometry` | Options for `geometry` package (e.g., `margin=1in`) |
| `papersize` | Paper size (e.g., `letter`, `a4`) |
| `fontsize` | Body text font size (10pt, 11pt, 12pt) |
| `linestretch` | Line spacing via `setspace` (e.g., `1.25`) |
| `margin-left/right/top/bottom` | Margins if `geometry` not used |
| `indent` | Use document class indentation settings |
| `pagestyle` | `plain` (default), `empty`, `headings` |
| `secnumdepth` | Section numbering depth |

### Fonts

| Variable | Engine | Purpose |
|----------|--------|---------|
| `fontfamily` | pdflatex | Font package (default: Latin Modern) |
| `fontenc` | pdflatex | Font encoding (default: `T1`) |
| `mainfont` | xelatex/lualatex | Main system font |
| `sansfont` | xelatex/lualatex | Sans-serif font |
| `monofont` | xelatex/lualatex | Monospace font |
| `mathfont` | xelatex/lualatex | Math font |
| `CJKmainfont` | xelatex/lualatex | CJK main font |

Example:

    ---
    documentclass: scrartcl
    geometry:
    - top=30mm
    - left=20mm
    mainfont: "TeX Gyre Pagella"
    ...

## Variables set automatically

| Variable | Description |
|----------|-------------|
| `body` | Document body content |
| `date-meta` | Date in ISO 8601 format (HTML formats) |
| `header-includes` | Contents from `-H` |
| `include-before` | Contents from `-B` |
| `include-after` | Contents from `-A` |
| `meta-json` | JSON of all document metadata |
| `numbersections` | Set if `--number-sections` used |
| `sourcefile` | Source filename(s) |
| `outputfile` | Output filename |
| `toc` | Set if `--toc` used |
| `toc-title` | Title of table of contents |
| `curdir` | Working directory |
| `pandoc-version` | Pandoc version string |

---

# EXTENSIONS

Extensions adjust reader/writer behavior. Enable with `+EXTENSION`, disable with `-EXTENSION`:

    pandoc --from markdown_strict+footnotes       # strict MD with footnotes
    pandoc --from markdown-footnotes-pipe_tables   # pandoc MD without those features

List extensions for a format:

    pandoc --list-extensions=gfm

### Commonly toggled extensions

| Extension | Description |
|-----------|-------------|
| `smart` | Typographic quotes, dashes, ellipses |
| `auto_identifiers` | Auto-generate heading IDs |
| `raw_html` | Allow raw HTML passthrough |
| `raw_tex` | Allow raw LaTeX passthrough |
| `citations` | Pandoc citation syntax |
| `yaml_metadata_block` | YAML metadata blocks |
| `pipe_tables` | Pipe-style tables |
| `footnotes` | Pandoc footnotes |
| `strikeout` | Strikethrough with `~~` |
| `task_lists` | GitHub-style task lists |
| `fenced_code_blocks` | Fenced code blocks |
| `fenced_code_attributes` | Attributes on fenced code |
| `fenced_divs` | Fenced divs with `:::` |
| `bracketed_spans` | Bracketed spans |
| `definition_lists` | Definition lists |
| `example_lists` | Numbered example lists |
| `line_blocks` | Line blocks with `|` |
| `table_captions` | Table captions |
| `implicit_figures` | Images alone in paragraph → figure |
| `link_attributes` | Attributes on links/images |
| `inline_notes` | Inline footnotes |
| `emoji` | GitHub-style emoji shortcodes |
| `alerts` | GitHub-style alert blocks |
| `tex_math_dollars` | TeX math between `$` |

---

# Markdown variants

| Variant | Description |
|---------|-------------|
| `markdown` | Pandoc's Markdown — all extensions enabled by default |
| `gfm` | GitHub-Flavored Markdown |
| `commonmark` | CommonMark |
| `commonmark_x` | CommonMark with many pandoc extensions |
| `markdown_strict` | Original Markdown.pl |
| `markdown_phpextra` | PHP Markdown Extra |
| `markdown_mmd` | MultiMarkdown |
| `markdown_github` | Deprecated; use `gfm` |

To see which extensions are enabled by default:

    pandoc --list-extensions=FORMAT

Note: extension lists for `commonmark`, `gfm`, and `commonmark_x` are defined relative to default CommonMark.

---

# CUSTOM READERS AND WRITERS

Pandoc can be extended with custom readers and writers written in Lua:

    pandoc -t data/sample.lua
    pandoc -f my_custom_markup.lua -t latex -s

A custom reader defines a `Reader` function that takes a string and returns a Pandoc AST. A custom writer defines functions specifying how to render each AST element.

Custom writers have no default template — use `--template` with `--standalone`.

Scripts are searched in: specified path, then `custom` subdirectory of user data directory.

---

# A NOTE ON SECURITY

1. Filters and custom writers can perform arbitrary IO. Audit them carefully.
2. Some input formats (LaTeX, Org, RST, Typst) support `include` directives — use `--sandbox` for untrusted input.
3. Some output formats (RTF, EPUB, HTML with `--embed-resources`, Docx, ODT) embed images — use `--sandbox` to prevent file disclosure.
4. The `commonmark` parser is much less vulnerable to pathological performance than the `markdown` parser — prefer it for untrusted input.
5. HTML generated by pandoc is not guaranteed to be safe. Run through an HTML sanitizer for untrusted input.
6. Use `+RTS -M512M -RTS` to limit heap size and prevent DOS attacks.
