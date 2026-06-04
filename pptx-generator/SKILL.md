---
name: pptx-generator
description: |
  Generate and edit presentation slides as PPTX files. Also create LinkedIn carousels and manage reusable slide layouts.

  TRIGGERS - Use this skill when user says:
  - "create slides for [brand]" / "generate presentation for [brand]" / "make slides for [brand]"
  - "create a carousel for [brand]" / "linkedin carousel" / "make a carousel about [topic]"
  - "edit this pptx" / "update the slides" / "modify this presentation"
  - "create a new layout" / "add a layout to the cookbook" / "make a [type] layout blueprint"
  - "edit the [name] layout" / "update the cookbook" / "improve the [name] template"
  - Any request mentioning slides, presentations, carousels, PPTX, or layouts with a brand name

  Creates .pptx files compatible with PowerPoint, Google Slides, and Keynote.
  Creates PDF carousels for LinkedIn (square 1:1 format).
---

# PPTX Slide Generator

Generate professional, on-brand presentation slides using python-pptx. This skill supports:
- **Slide Generation** - Create presentations for any brand in `brands/`
- **Carousel Generation** - Create LinkedIn carousels (square format, exports to PDF)
- **Slide Editing** - Modify existing PPTX files
- **Layout Management** - Create, edit, update cookbook layouts

**IMPORTANT:** All skill resources are in `.codex/skills/pptx-generator/`. Always use Glob patterns starting with `.codex/skills/pptx-generator/` to find files.

---

## ⚠️ CRITICAL: Batch Generation Rules

**NEVER generate more than 5 slides at once.**

| Rule | Details |
|------|---------|
| Max slides per batch | **5** (can be 1, 2, 3, 4, or 5) |
| After each batch | **STOP and validate output** |
| Validation required | Check: no duplicate titles, proper spacing, correct colors |
| Continue when | Validation passes |

This prevents token limit errors and catches quality issues early.

---

## ⚠️ PREREQUISITE: Brand Check

**Before generating slides, check if any brands exist.**

```
Glob: .codex/skills/pptx-generator/brands/*/brand.json
```

**If NO brands found (only `synapse/` exists):**

1. **STOP** - Do not proceed with slide generation
2. **Ask the user:**
   > "No brands are configured yet. Would you like me to help you create a brand first?
   > I'll need your brand colors, fonts, and style guidelines to set this up."

3. **If user wants to create a brand**, follow the **Creating a New Brand** section below.

4. **If user declines**, explain that slides require a brand configuration and offer to use the Synapse baseline brand as a fallback.

---

## Creating a New Brand

When no brands exist or user requests a new brand:

### Step 1: Read the Template

```
Read: .codex/skills/pptx-generator/brands/synapse/README.md
Read: .codex/skills/pptx-generator/brands/synapse/brand.json
Read: .codex/skills/pptx-generator/brands/synapse/config.json
```

### Step 2: Gather Brand Information

Ask the user for (or extract from provided materials):

| Required | Description |
|----------|-------------|
| **Brand name** | Folder name (lowercase, no spaces) |
| **Colors** | Background, text, accent colors (hex codes) |
| **Fonts** | Heading font, body font, code font |

| Optional | Description |
|----------|-------------|
| Output directory | Where to save generated files (default: `output/{brand}`) |
| Logo | Path to logo file (PNG/SVG) |
| Brand guidelines | Existing style guide or website to reference |
| Tone of voice | Writing style, vocabulary preferences |

### Step 3: Create Brand Files

1. **Create the brand folder:**
   ```bash
   mkdir -p .codex/skills/pptx-generator/brands/{brand-name}
   ```

2. **Create brand.json** with the gathered values:
   ```json
   {
     "name": "Brand Name",
     "description": "One-line description",
     "colors": {
       "background": "hex-without-hash",
       "background_alt": "hex-without-hash",
       "text": "hex-without-hash",
       "text_secondary": "hex-without-hash",
       "accent": "hex-without-hash",
       "accent_secondary": "hex-without-hash",
       "accent_tertiary": "hex-without-hash",
       "code_bg": "hex-without-hash",
       "card_bg": "hex-without-hash",
       "card_bg_alt": "hex-without-hash"
     },
     "fonts": {
       "heading": "Font Name",
       "body": "Font Name",
       "code": "Monospace Font"
     },
     "assets": {
       "logo": "assets/logo.png",
       "logo_dark": null,
       "icon": null
     }
   }
   ```

3. **Create config.json** with output settings:
   ```json
   {
     "output": {
       "directory": "output/{brand}",
       "naming": "{name}-{date}",
       "keep_parts": false
     },
     "generation": {
       "slides_per_batch": 5,
       "auto_combine": true,
       "open_after_generate": false
     },
     "defaults": {
       "slide_width_inches": 13.333,
       "slide_height_inches": 7.5
     }
   }
   ```

4. **Create brand-system.md** - Copy from the synapse baseline and fill in brand guidelines

5. **Create tone-of-voice.md** - Copy from the synapse baseline and fill in voice guidelines

6. **Add assets** - Copy logo/images to `brands/{brand-name}/assets/`

### Step 4: Verify

After creating the brand, verify with:
```
Glob: .codex/skills/pptx-generator/brands/{brand-name}/*
```

Then proceed to slide generation.

---

## Skill Modes

This skill operates in three modes:

### Mode 1: Generate Presentation Slides
User wants presentation slides (16:9) created using a brand's styling.
→ Follow: Brand Discovery → Layout Selection → Content Adaptation → Execute
→ Layouts in: `cookbook/*.py`

### Mode 2: Generate LinkedIn Carousels
User wants a LinkedIn carousel (square 1:1 format) for social media.
→ Follow: Brand Discovery → Carousel Planning → Generate → Export PDF
→ Layouts in: `cookbook/carousels/*.py`

### Mode 3: Manage Cookbook Layouts
User wants to create, edit, or improve layout blueprints.
→ Follow: Layout CRUD Operations section

---

## Mode 1: Generate Presentation Slides

### Step 1: Brand Discovery

1. **List available brands:**
   ```
   Glob: .codex/skills/pptx-generator/brands/*/brand.json
   ```
   Extract unique brand names from paths (e.g., `brands/rasmus/...` → "rasmus")

2. **Read the brand configuration files:**
   ```
   Read: .codex/skills/pptx-generator/brands/{brand-name}/brand.json
   Read: .codex/skills/pptx-generator/brands/{brand-name}/config.json
   ```
   - `brand.json` - Colors, fonts, assets
   - `config.json` - Output directory, generation settings

3. **Read supporting markdown files for context:**
   ```
   Glob: .codex/skills/pptx-generator/brands/{brand-name}/*.md
   ```
   These provide voice, tone, and design philosophy.

4. **Extract from brand files:**
   - **From brand.json:** Colors (hex without #), fonts, asset paths
   - **From config.json:** Output directory, slides per batch, naming convention
   - **From markdown:** Voice, tone, vocabulary, visual principles

If brand not found, list available brands and ask user to choose.

### Step 2: Layout Discovery (READ ALL FRONTMATTERS)

**⚠️ MANDATORY: Read ALL layout frontmatters before selecting any layout.**

This step is critical for making informed layout decisions. You must understand what ALL layouts offer before choosing.

**Step 2a: Discover all layouts:**
```
Glob: .codex/skills/pptx-generator/cookbook/*.py
```

**Step 2b: Read EVERY layout file** (not just one or two):

For each `.py` file found, read the first 40 lines to extract the `# /// layout` frontmatter block. Build a mental map of:
- What each layout is for (`purpose`, `best_for`)
- What each layout should NOT be used for (`avoid_when`)
- Limits and constraints (`max_*`, `min_*`, `*_max_chars`)

**The frontmatter block** looks like this:

```python
# /// layout
# name = "floating-cards-slide"
# purpose = "Feature highlights, process steps, multiple equal items with depth"
# best_for = [
#     "Exactly 3 related features or concepts",
#     "Process with 3 steps",
# ]
# avoid_when = [
#     "More than 3 items - use multi-card-slide instead",
#     "Long card titles (over 15 characters)",
# ]
# max_cards = 3
# card_title_max_chars = 15
# instructions = [
#     "EXACTLY 3 cards required - no more, no less",
#     "Card titles must be SHORT: 1-2 words, max 15 characters",
# ]
# ///
```

**Key frontmatter fields:**
| Field | Description |
|-------|-------------|
| `name` | Layout identifier |
| `purpose` | What this layout is for |
| `best_for` | Ideal use cases (array) |
| `avoid_when` | When NOT to use this layout (array) |
| `max_*` / `min_*` | Item limits (cards, bullets, stats) |
| `instructions` | Specific tips for using this layout |

**Step 2c: Select layouts** (only AFTER reading all frontmatters):

Now that you know all available layouts and their constraints:

1. User specifies layout → Use that layout (but verify it fits the content)
2. User describes content → Match to best-fitting `best_for` criteria
3. **Check `avoid_when`** → Don't use a layout in situations it warns against
4. **Respect limits** → If content exceeds `max_*`, use a different layout
5. Multiple slides needed → Select appropriate layout for each
6. No good fit → Create a custom layout (see Mode 2)

**Example selection process:**
- User wants "5 pillars of AI infrastructure"
- You've read all frontmatters and know:
  - `floating-cards-slide`: `max_cards = 3` → Won't work
  - `multi-card-slide`: `max_cards = 5` → Perfect fit
- Select `multi-card-slide`

**Why read ALL frontmatters?**
- Layouts reference each other in `avoid_when` (e.g., "use multi-card-slide instead")
- You can't make the right choice without knowing all options
- Prevents backtracking when a layout doesn't fit

### Step 3: Slide Planning (ALWAYS DO THIS)

**Before generating ANY slides, create a written plan.**

This applies to single slides, batches, and full presentations. Planning prevents:
- Duplicate content across slides
- Wrong layout choices
- Missing key information
- Poor flow and structure

**Create a slide plan table:**

```markdown
| # | Layout | Title | Key Content | Notes |
|---|--------|-------|-------------|-------|
| 1 | title-slide | [Title] | [Subtitle, author] | Opening slide |
| 2 | content-slide | [Title] | [3-4 bullet points] | Main concepts |
| 3 | stats-slide | [Title] | [2-3 metrics] | Impact data |
| ... | ... | ... | ... | ... |
```

**For each slide, specify:**
- **Slide number** - Position in presentation
- **Layout** - Which cookbook layout to use
- **Title** - Exact title text (check for duplicates!)
- **Key content** - Bullet points, stats, quotes, etc.
- **Notes** - Any special considerations

**Planning checklist:**
- [ ] No duplicate titles across slides
- [ ] Logical flow from slide to slide
- [ ] Appropriate layout for each content type
- [ ] Content fits the chosen layout
- [ ] Batches are logically grouped (5 slides max each)

**After planning, briefly present the plan before generating.**

### Step 4: Content Adaptation

**For each slide in your plan:**

#### Presentation Text Formatting Rules

**IMPORTANT: Follow these rules for ALL slide text.**

| Element | Rule | Example |
|---------|------|---------|
| Titles | No trailing periods or commas | "Why AI Matters" not "Why AI Matters." |
| Subtitles | No trailing punctuation | "The future of coding" not "The future of coding." |
| Bullet points | No trailing periods (unless full sentences) | "Faster development" not "Faster development." |
| Headlines | Minimal punctuation, no ellipsis | "What's Next" not "What's Next..." |
| Stats/Numbers | Clean format, no trailing punctuation | "50%" not "50%." |
| CTAs | No trailing punctuation | "Get Started" not "Get Started." |
| Labels | Short, no punctuation | "Step 1" not "Step 1:" |

**Avoid:**
- Trailing periods on titles, bullets, labels
- Ellipsis (...) in headlines
- Excessive commas in short phrases
- Colons at end of labels/headers
- Semicolons in bullet points

**Exception:** Full sentence descriptions or quotes may use appropriate punctuation.

#### Brand Value Mapping

1. **Map brand.json values to layout placeholders:**

   | Layout Placeholder | brand.json Path |
   |--------------------|-----------------|
   | `BRAND_BG` | `colors.background` |
   | `BRAND_BG_ALT` | `colors.background_alt` |
   | `BRAND_TEXT` | `colors.text` |
   | `BRAND_TEXT_SECONDARY` | `colors.text_secondary` |
   | `BRAND_ACCENT` | `colors.accent` |
   | `BRAND_ACCENT_SECONDARY` | `colors.accent_secondary` |
   | `BRAND_ACCENT_TERTIARY` | `colors.accent_tertiary` |
   | `BRAND_CODE_BG` | `colors.code_bg` |
   | `BRAND_CARD_BG` | `colors.card_bg` |
   | `BRAND_CARD_BG_ALT` | `colors.card_bg_alt` |
   | `BRAND_HEADING_FONT` | `fonts.heading` |
   | `BRAND_BODY_FONT` | `fonts.body` |
   | `BRAND_CODE_FONT` | `fonts.code` |

   **Note:** All color values in brand.json are hex WITHOUT the `#` prefix.

2. **Write content in brand's voice** (from tone-of-voice.md)
3. **Preserve layout structure** (decorative elements, spacing, hierarchy)

### Step 5: Batch Generation (CRITICAL)

**MAXIMUM 5 SLIDES PER BATCH. This is a hard limit.**

When generating multiple slides:
1. Generate 1-5 slides in a single PPTX file
2. **STOP and review the output** before generating more
3. Only after validation passes, continue with the next batch
4. Repeat until all slides are generated

**Why batching matters:**
- Prevents token limit errors
- Allows quality checks between batches
- Catches issues early before they propagate

**Execution (do not save Python script files):**

```bash
uv run --with python-pptx==1.0.2 python << 'SCRIPT'
# [Adapted code with brand values and content]
SCRIPT
```

### Step 6: Quality Validation (MANDATORY)

**After EVERY batch, validate before continuing:**

1. **Open the generated PPTX** and visually inspect it
2. **Check for these common issues:**

| Issue | What to Look For | Fix |
|-------|------------------|-----|
| Duplicate titles | Same title text appearing twice on a slide | Remove duplicate text boxes |
| Spacing problems | Title too close to subtitle/content | Increase Y position of lower elements |
| Text overflow | Content extending beyond slide bounds | Reduce font size or split content |
| Missing elements | Decorative elements not rendering | Check shape positions and colors |
| Wrong colors | Colors not matching brand | Verify hex values (no # prefix in code) |
| Bad punctuation | Trailing periods/commas on titles/bullets | Remove unnecessary punctuation |

3. **If issues found:**
   - Fix the current batch before continuing
   - Note the issue to avoid repeating in future batches

4. **If validation passes:**
   - Continue to next batch of slides

### Step 7: Output

**Use the output settings from config.json:**

| Config Setting | Default | Description |
|----------------|---------|-------------|
| `output.directory` | `output/{brand}` | Where to save files |
| `output.naming` | `{name}-{date}` | File naming pattern |
| `output.keep_parts` | `false` | Keep part files after combining |

**Resolve placeholders:**
- `{brand}` → Brand folder name
- `{name}` → Presentation name from user request
- `{date}` → Current date (YYYY-MM-DD)

```bash
# Create output directory from config
mkdir -p {resolved-output-directory}
```

**Batched generation workflow:**
1. Generate each batch as `{name}-part1.pptx`, `{name}-part2.pptx`, etc.
2. Validate each batch before continuing
3. After ALL batches complete, **combine into final file** (if `auto_combine` is true)
4. Delete part files (if `keep_parts` is false)

### Step 8: Combine Batches (for multi-batch presentations)

After all batches are validated, combine them into a single PPTX:

```bash
uv run --with python-pptx==1.0.2 python << 'SCRIPT'
from pptx import Presentation
from pathlib import Path
import shutil

# List all part files in order
output_dir = Path("output/{brand-name}")
part_files = sorted(output_dir.glob("{name}-part*.pptx"))

if len(part_files) > 1:
    # Start with first part as base
    combined = Presentation(part_files[0])

    # Add slides from remaining parts
    for part_file in part_files[1:]:
        part_prs = Presentation(part_file)
        for slide in part_prs.slides:
            # Copy slide layout and add to combined
            blank_layout = combined.slide_layouts[6]
            new_slide = combined.slides.add_slide(blank_layout)

            # Copy all shapes from source slide
            for shape in slide.shapes:
                # Clone shape to new slide
                el = shape.element
                new_slide.shapes._spTree.insert_element_before(
                    el, 'p:extLst'
                )

    # Save combined file
    combined.save(output_dir / "{name}-final.pptx")
    print(f"Combined {len(part_files)} parts into {name}-final.pptx")

    # Optionally clean up part files
    # for part_file in part_files:
    #     part_file.unlink()
else:
    # Single part, just rename
    shutil.move(part_files[0], output_dir / "{name}-final.pptx")
SCRIPT
```

**Final output:** `output/{brand-name}/{name}-final.pptx`

---

## Mode 2: Generate LinkedIn Carousels

LinkedIn carousels are multi-page PDFs in square (1:1) format. Each page is a swipeable slide.

### Carousel vs Presentation

| Aspect | Presentation | Carousel |
|--------|--------------|----------|
| Dimensions | 16:9 (13.333" × 7.5") | 1:1 (7.5" × 7.5") |
| Layouts | `cookbook/*.py` | `cookbook/carousels/*.py` |
| Output | PPTX | PDF (via PPTX conversion) |
| Slides | 10-50+ typical | 5-10 optimal |
| Text size | Standard | Larger (mobile readable) |
| Content | Detailed | One idea per slide |

### Step 1: Brand Discovery

Same as Mode 1 - read brand.json, config.json, and tone-of-voice.md.

### Step 2: Carousel Layout Discovery

**Discover carousel-specific layouts:**
```
Glob: .codex/skills/pptx-generator/cookbook/carousels/*.py
```

**Available carousel layouts:**

| Layout | Purpose | Best For |
|--------|---------|----------|
| `hook-slide` | Opening attention-grabber | First slide only |
| `single-point-slide` | One key point with explanation | Body content |
| `numbered-point-slide` | Numbered list item with big number | Listicles, steps |
| `quote-slide` | Quote with attribution | Social proof, insights |
| `cta-slide` | Call to action | Last slide only |

Read frontmatters to understand limits and constraints for each.

### Step 3: Carousel Planning

**Typical carousel structure (5-10 slides):**

```markdown
| # | Layout | Content |
|---|--------|---------|
| 1 | hook-slide | Attention-grabbing hook |
| 2-8 | single-point or numbered-point | Body content |
| 9/10 | cta-slide | Call to action |
```

**Carousel content rules:**
- **One idea per slide** - Don't cram multiple points
- **Large text** - Must be readable on mobile
- **Short copy** - Max 50 chars for headlines, 150 for body
- **Clear flow** - Each slide should make sense if viewed alone
- **Strong hook** - First slide stops the scroll
- **Clear CTA** - Last slide tells them what to do

### Step 4: Generate Carousel

**Carousel dimensions (square 1:1):**
```python
prs.slide_width = Inches(7.5)
prs.slide_height = Inches(7.5)
```

Generate all slides as a single PPTX file (carousels are typically 5-10 slides, so batching rarely needed).

**Execution:**
```bash
uv run --with python-pptx==1.0.2 python << 'SCRIPT'
# Carousel generation code with 7.5" x 7.5" dimensions
SCRIPT
```

### Step 5: Export to PDF

LinkedIn requires PDF for carousel posts. Convert the PPTX to PDF:

**Option A: Using LibreOffice (recommended)**
```bash
libreoffice --headless --convert-to pdf --outdir output/rasmus output/rasmus/carousel.pptx
```

**Option B: Using soffice**
```bash
soffice --headless --convert-to pdf output/rasmus/carousel.pptx
```

**Note:** LibreOffice must be installed. On macOS: `brew install --cask libreoffice`

### Step 6: Output

Save both files:
- `output/{brand}/{name}-carousel.pptx` - Editable source
- `output/{brand}/{name}-carousel.pdf` - LinkedIn-ready

### Carousel Checklist

- [ ] Read brand configuration
- [ ] Read carousel layout frontmatters from `cookbook/carousels/`
- [ ] Plan carousel structure (hook → body → CTA)
- [ ] Keep text SHORT (check character limits in frontmatter)
- [ ] Use 7.5" × 7.5" dimensions
- [ ] Generate PPTX
- [ ] Validate output
- [ ] Export to PDF
- [ ] Test PDF in LinkedIn preview

---

## Mode 3: Layout CRUD Operations

### Creating New Layouts

When user requests a new layout type:

1. **Study existing layouts for patterns:**
   ```
   Glob: .codex/skills/pptx-generator/cookbook/*.py
   ```
   Read 2-3 layouts to understand:
   - Code structure and imports
   - How brand variables are used
   - Decorative element patterns
   - Positioning conventions

2. **Design with these quality standards:**

   **MUST be production-ready:**
   - Professional, polished appearance
   - Visually engaging (not plain or generic)
   - Distinctive decorative elements
   - Strong visual hierarchy
   - Proper use of whitespace

   **Use appropriate elements:**
   - **Charts** - Pie, doughnut, bar, column for data visualization
   - **Images** - Placeholder shapes for screenshots, photos
   - **Shapes** - Circles, rectangles, parallelograms for visual interest
   - **Cards** - Floating cards with shadows for depth
   - **Geometric patterns** - Bold shapes anchored to corners/edges

   **Avoid:**
   - Plain text-only layouts
   - Generic bullet points without styling
   - Tiny decorative elements that don't make impact
   - Centered-everything boring compositions

3. **Write the layout file with detailed frontmatter:**

   **⚠️ CRITICAL: The frontmatter is documentation for future AI agents.**

   Every layout MUST include comprehensive frontmatter that teaches future AI agents:
   - WHEN to use this layout (and when NOT to)
   - HOW to use it correctly
   - WHAT limits and constraints exist
   - WHY certain choices matter

   ```python
   #!/usr/bin/env -S uv run
   # /// script
   # requires-python = ">=3.11"
   # dependencies = [
   #     "python-pptx==1.0.2",
   # ]
   # ///
   # /// layout
   # name = "layout-name"
   # purpose = "When to use this layout - be specific"
   # best_for = [
   #     "Ideal use case 1",
   #     "Ideal use case 2",
   # ]
   # avoid_when = [
   #     "Situation to avoid 1 - and what to use instead",
   #     "Situation to avoid 2 - and what to use instead",
   # ]
   # max_items = 5  # or other relevant limits
   # instructions = [
   #     "Specific tip 1",
   #     "Specific tip 2",
   # ]
   # ///
   """
   LAYOUT: [Name]
   PURPOSE: [When to use this layout - be specific]

   CUSTOMIZE:
   - [List customizable elements]
   """

   # ... implementation
   ```

   **Required frontmatter fields (be DETAILED and SPECIFIC):**

   | Field | Description | Example |
   |-------|-------------|---------|
   | `name` | Layout identifier (matches filename) | `"multi-card-slide"` |
   | `purpose` | Clear one-line description | `"Multiple items as cards in a row, 3-5 cards"` |
   | `best_for` | **Detailed** array of ideal scenarios | `["Exactly 3 related features", "Process with 3 steps"]` |
   | `avoid_when` | **Specific** situations with alternatives | `["More than 3 items - use multi-card-slide instead"]` |
   | `instructions` | **Actionable** tips for correct usage | `["Card titles must be SHORT: 1-2 words, max 15 chars"]` |

   **Optional but recommended fields:**
   | Field | Description | Example |
   |-------|-------------|---------|
   | `max_*` / `min_*` | Hard limits on items | `max_cards = 3`, `min_surrounding_items = 4` |
   | `*_max_chars` | Character limits for text | `card_title_max_chars = 15` |

   **Writing good frontmatter:**

   ✅ **DO:** Be specific and actionable
   ```python
   # avoid_when = [
   #     "More than 3 items - use multi-card-slide instead",
   #     "Long card titles (over 15 characters) - abbreviate or use content-slide",
   # ]
   # instructions = [
   #     "EXACTLY 3 cards required - no more, no less",
   #     "Card titles must be SHORT: 1-2 words, max 15 characters",
   #     "If titles are too long, abbreviate or use different layout",
   # ]
   ```

   ❌ **DON'T:** Be vague or unhelpful
   ```python
   # avoid_when = ["Too many items", "Wrong content"]
   # instructions = ["Use correctly", "Follow the pattern"]
   ```

   **Think of frontmatter as teaching a colleague** - what would they need to know to use this layout correctly without asking you questions?

4. **Save to cookbook:**
   ```
   .codex/skills/pptx-generator/cookbook/{layout-name}-slide.py
   ```

5. **Test by generating** a sample with the new layout

### Editing Existing Layouts

1. **Find the layout:**
   ```
   Glob: .codex/skills/pptx-generator/cookbook/*{name}*.py
   ```

2. **Read and understand current structure** including the frontmatter

3. **Make modifications** while preserving:
   - The script header format
   - Brand variable naming conventions
   - Docstring format (LAYOUT, PURPOSE, CUSTOMIZE)

4. **Update the frontmatter** if your changes affect:
   - What the layout is best for (`best_for`)
   - When to avoid it (`avoid_when`)
   - Item limits (`max_*`, `min_*`)
   - Usage instructions (`instructions`)

5. **Save back to the same file**

6. **Test the modified layout**

### Updating/Improving Layouts

When asked to improve layout quality:

1. **Analyze current weaknesses:**
   - Is it visually engaging?
   - Does it have enough decorative elements?
   - Is there good visual hierarchy?
   - Does it use space well?

2. **Apply improvements:**
   - Add bold geometric shapes
   - Improve color usage
   - Add depth (shadows, overlapping)
   - Better typography sizing
   - More distinctive decorative elements

3. **Preserve functionality** - Don't break what works

4. **Review and enhance frontmatter:**
   - Are `best_for` and `avoid_when` still accurate?
   - Do `instructions` reflect any new constraints?
   - Add any lessons learned from the improvements
   - Update limits if element sizes/counts changed

### Deleting Layouts

Simply remove the file:
```bash
rm .codex/skills/pptx-generator/cookbook/{layout-name}.py
```

---

## Editing Existing PPTX Files

When user provides an existing PPTX:

1. **Read the file:**
   ```python
   from pptx import Presentation
   prs = Presentation("path/to/existing.pptx")
   ```

2. **Analyze:** Number of slides, styling, content structure

3. **Apply changes:** Add/remove slides, update content, modify styling

4. **Save to output directory** (don't overwrite original unless requested)

---

## Technical Reference

**Slide dimensions (16:9):**
- Width: 13.333 inches
- Height: 7.5 inches
- Safe margins: 0.5 inches

**Always use:**
- Blank layout: `prs.slide_layouts[6]`
- python-pptx version: 1.0.2

**Common imports:**
```python
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt
```

**Chart types available:**
- `XL_CHART_TYPE.PIE` - Pie chart
- `XL_CHART_TYPE.DOUGHNUT` - Doughnut chart
- `XL_CHART_TYPE.BAR_CLUSTERED` - Horizontal bars
- `XL_CHART_TYPE.COLUMN_CLUSTERED` - Vertical columns
- `XL_CHART_TYPE.LINE` - Line chart

**Adding charts:**
```python
chart_data = CategoryChartData()
chart_data.categories = ["A", "B", "C"]
chart_data.add_series("Values", [10, 20, 30])

slide.shapes.add_chart(
    XL_CHART_TYPE.DOUGHNUT,
    Inches(x), Inches(y),
    Inches(width), Inches(height),
    chart_data
)
```

**Adding images:**
```python
slide.shapes.add_picture(
    "path/to/image.png",
    Inches(x), Inches(y),
    width=Inches(w)  # Height auto-calculated
)
```

---

## Preview All Layouts

To see all available layouts:
```bash
uv run .codex/skills/pptx-generator/generate-cookbook-preview.py
```

This generates `cookbook-preview.pptx` with every layout.

---

## Checklist

**For Slide Generation:**
- [ ] Read brand.json for colors/fonts
- [ ] Read config.json for output directory and settings
- [ ] Read markdown files for voice/tone
- [ ] **Read ALL cookbook layout frontmatters** (first 40 lines of each .py):
  - [ ] Glob all `.codex/skills/pptx-generator/cookbook/*.py`
  - [ ] Read every file to extract `# /// layout` blocks
  - [ ] Build understanding of all `best_for`, `avoid_when`, limits
- [ ] **Then select layouts** based on complete knowledge:
  - [ ] Match content to `best_for` criteria
  - [ ] Respect `avoid_when` warnings
  - [ ] Check `max_*` / `min_*` limits
  - [ ] Follow `instructions` for chosen layouts
- [ ] **Create slide plan table BEFORE generating:**
  - [ ] List all slides with layout, title, content
  - [ ] Check for duplicate titles
  - [ ] Verify logical flow
  - [ ] Group into batches (max 5 per batch)
- [ ] Present plan briefly before proceeding
- [ ] Apply brand colors and fonts
- [ ] Write content in brand's voice
- [ ] **Generate MAX 5 slides per batch** (or `slides_per_batch` from config)
- [ ] Execute via UV REPL
- [ ] **Validate output before continuing:**
  - [ ] No duplicate titles
  - [ ] Proper spacing between elements
  - [ ] Content fits within bounds
  - [ ] Colors match brand
  - [ ] No trailing punctuation on titles/bullets
- [ ] Save batch to output directory from config
- [ ] Repeat for next batch if needed
- [ ] **Combine all batches into final PPTX** (if `auto_combine` is true)
- [ ] Clean up part files (if `keep_parts` is false)

**For Creating Layouts:**
- [ ] Study existing layouts for patterns
- [ ] Design with production-ready quality
- [ ] Include distinctive decorative elements
- [ ] Use charts/images/shapes appropriately
- [ ] **Add TOML-style frontmatter** with:
  - [ ] `name`, `purpose`
  - [ ] `best_for`, `avoid_when` arrays
  - [ ] `instructions` array with usage tips
  - [ ] `max_*` / `min_*` limits as needed
- [ ] Write proper docstring (LAYOUT, PURPOSE, CUSTOMIZE)
- [ ] Test the new layout
