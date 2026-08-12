# DelphiTools Version Tracking

## Current Tracked Version

**Commit:** `12919e0`
**Full SHA:** `12919e0872fb1129edc725b661b458ba8b160bde`
**Date:** 2026-04-10
**Tools:** 47
**Source:** https://github.com/1612elphi/delphitools

## Download

### From Source (recommended)

```bash
git clone https://github.com/1612elphi/delphitools.git
cd delphitools
git checkout 12919e0
bun install && bun run build
```

### As Archive

```bash
curl -L https://github.com/1612elphi/delphitools/archive/12919e0.tar.gz -o delphitools.tar.gz
tar xzf delphitools.tar.gz
cd delphitools-12919e0*
bun install && bun run build
```

### Pre-Built Bundle (from agent-skills releases)

```bash
gh release download --repo eins78/agent-skills --pattern 'delphitools-bundle-*.tgz' --output delphitools-bundle.tgz
```

## Live Site

The tools are always available at:
- **Primary:** https://delphi.tools
- **Alternate:** https://tools.rmv.fyi

## Version History

| Date | Commit | Changes |
|------|--------|---------|
| 2026-04-10 | `12919e0` | Image Clipper added, global colour notation, iOS TestFlight card |
| 2026-04-08 | `0d309c2` | Paste Image merged (community contribution) |

## Note on Tags

The DelphiTools repository does not use git tags or GitHub releases. This skill tracks by commit hash on the `main` branch. When the project adopts tags, this file and the GitHub Action will be updated to track tagged releases instead.
