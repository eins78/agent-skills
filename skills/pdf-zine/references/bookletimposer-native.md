# bookletimposer — native (non-Docker) usage

For users who can't or don't want to run Docker. Upstream: <https://kjo.herbesfolles.org/bookletimposer/>

## When to use this

- No Docker available (or undesirable on the host)
- Already on a Debian/Ubuntu box where `bookletimposer` is one `apt` away
- Want the GTK GUI alongside the CLI

Otherwise, prefer the Docker path in `SKILL.md` — it's faster to set up and identical in output.

## Install

**Debian / Ubuntu:**

```bash
sudo apt install bookletimposer
```

**From source:**

```bash
git clone https://git.codecoop.org/kjo/bookletimposer
cd bookletimposer
# Requires Python 3 and PyPDF2; follow upstream README for the exact build steps.
```

**macOS:** not officially supported. Build from source with Homebrew Python + `pip install pypdf2`. The GTK GUI is unlikely to work cleanly; CLI mode (`--no-gui`) does.

You'll also want `qpdf` for the cover-flip step:

```bash
sudo apt install qpdf       # Debian/Ubuntu
brew install qpdf           # macOS
```

## CLI usage

```bash
bookletimposer --no-gui --booklet [--format=A4] input.pdf output.pdf
```

Key flags:

| Flag | Purpose |
|------|---------|
| `--no-gui` | Run in CLI mode (skip the GTK interface) |
| `--booklet` | Booklet imposition (2-up, fold-in-half order) |
| `--format=SIZE` | Force output paper size (e.g. `A4`, `A3`) |
| `--paper-format` | Alias on some versions; check `--help` |

Run `man bookletimposer` or `bookletimposer --help` for the full list (orientation, reduce mode, etc.).

## Reproducing pdf2zine's default

`pdf2zine`'s default does two things: move page 1 to the end (the InDesign "back-of-cover-on-page-1" convention), then booklet-impose on A4. Native equivalent:

```bash
qpdf --pages input.pdf 2-z,1 -- moved.pdf
bookletimposer --no-gui --booklet --format=A4 moved.pdf output.pdf
rm moved.pdf
```

To skip the cover-flip (matches `pdf2zine --keep-cover`):

```bash
bookletimposer --no-gui --booklet --format=A4 input.pdf output.pdf
```

To skip the forced A4 (matches `pdf2zine --keep-format`): drop `--format=A4`.

## Limitations

- `bookletimposer` cannot merge multiple PDFs. Concatenate first with `qpdf --empty --pages a.pdf b.pdf -- merged.pdf` (or `pdfunite`).
- The GTK GUI exists but is unnecessary for CLI use.
- Tested primarily on GNU/Linux per upstream; other platforms work but are less validated.
