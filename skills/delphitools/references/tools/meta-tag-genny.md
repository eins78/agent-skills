# Meta Tag Generator

**Category:** Other Tools
**URL:** https://delphi.tools/tools/meta-tag-genny
**Status:** stable

## What It Does

Generates HTML meta tags for SEO and social sharing (Open Graph and Twitter Card) from a structured form, and shows a live preview of how the page will appear in search results and social media cards.

## When to Use

- Producing complete `<head>` meta tag blocks for a new web page without writing them by hand
- Verifying how a page title and description will appear in Google search results or social link previews
- Quickly copying correct Open Graph and Twitter Card markup to paste into an HTML template

## Browser Mode

### Inputs

- **Title field:** page title (also used for `og:title` and `twitter:title`); recommended max 60 characters
- **Description field:** page description (also used for `og:description` and `twitter:description`); recommended max 160 characters
- **URL field:** canonical page URL (used for `og:url`)
- **Image URL field:** absolute URL of the social share image (used for `og:image` and `twitter:image`); recommended 1200×630 px
- **Site name field:** name of the website (used for `og:site_name`)
- **Type selector:** dropdown — Article | Website | Product | Profile (sets `og:type`)
- **Twitter card type selector:** dropdown — Summary | Summary with Large Image | App | Player (sets `twitter:card`)

### Step-by-Step

1. Navigate to https://delphi.tools/tools/meta-tag-genny
2. Type the page title into the **Title** field
3. Type the page description into the **Description** field; watch the character counter to stay within the recommended limit
4. Enter the full page URL (starting with `https://`) into the **URL** field
5. Enter the absolute URL of the social share image into the **Image URL** field
6. Enter the website name into the **Site name** field
7. Select the content type from the **Type** dropdown (most pages: **Website**; articles: **Article**)
8. Select the Twitter card style from the **Twitter card type** dropdown (**Summary with Large Image** is the most common choice)
9. Read the generated HTML meta tags in the **Output** code block below the form
10. Click the **Copy** button on the code block to copy all tags to the clipboard
11. Check the **Search result preview** panel to see the simulated Google snippet and the **Social preview** panel to see the simulated social card

### Output

- A formatted HTML code block containing all relevant `<meta>` tags: standard SEO tags (`description`, `robots`), Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `og:site_name`), and Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
- **Copy** button on the code block for one-click clipboard copy
- **Search result preview:** rendered simulation of a Google search result snippet using the title, URL, and description
- **Social preview:** rendered simulation of a social media link card using the title, description, and image

### Options

- **Type** dropdown: controls `og:type` value
- **Twitter card type** dropdown: controls `twitter:card` value; "Summary with Large Image" displays a full-width image above the card text

## CLI Mode (Node.js)

### Underlying Library

N/A — meta tag generation is straightforward template string assembly.

### Recipe

```js
// Inline template — no library needed
function generateMetaTags({ title, description, url, imageUrl, siteName, type = 'website', twitterCard = 'summary_large_image' }) {
  return `<!-- SEO -->
<meta name="description" content="${description}">

<!-- Open Graph -->
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${siteName}">

<!-- Twitter Card -->
<meta name="twitter:card" content="${twitterCard}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageUrl}">`;
}

console.log(generateMetaTags({
  title: 'My Page Title',
  description: 'A concise description under 160 characters.',
  url: 'https://example.com/page',
  imageUrl: 'https://example.com/images/share.jpg',
  siteName: 'Example Site',
  type: 'article',
  twitterCard: 'summary_large_image',
}));
```

### Wrapper Script

N/A

### Notes

- Escape any `"` characters in field values to `&quot;` before inserting into attributes to avoid broken HTML.
- The `og:image` URL must be absolute (include `https://`); relative paths are not valid for social crawlers.
- Twitter Card tags are also read by LinkedIn, Slack, and other platforms that fall back from Open Graph.
- Recommended image dimensions for `og:image` / `twitter:image`: 1200×630 px, under 5 MB.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
