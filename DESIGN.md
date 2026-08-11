---
name: Rent Tool
description: A clear, city-aware rent-planning tool for people evaluating a salary offer and move.
colors:
  accent: "#b25027"
  accent-ink: "#ffffff"
  accent-soft: "#f6e7df"
  accent-deep: "#8f3e1c"
  green: "#147b3b"
  green-soft: "#e4f2e8"
  red: "#b7352d"
  red-soft: "#f7e4e1"
  amber: "#ad7d22"
  canvas: "#fafafa"
  card: "#ffffff"
  card-2: "#f8f6f4"
  ink: "#1f1e1c"
  muted: "#716a64"
  faint: "#99928c"
  line: "#ebe6e2"
  line-strong: "#ded7d1"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "tight"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    letterSpacing: "tight"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
spacing:
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  6: "1.5rem"
  8: "2rem"
  12: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.75rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.lg}"
  input-search:
    backgroundColor: "{colors.card-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0.75rem 0.75rem"
  card-control:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
---

# Design System: Rent Tool

## Overview

**Creative North Star: "The Clear Ledger"**

Rent Tool makes a consequential financial choice feel legible rather than clinical. The interface uses a quiet paper-like canvas, warm burnt-orange emphasis, and deliberate information bands to turn city and salary inputs into an understandable plan. It is calm and precise: enough softness to reduce anxiety around moving, never so much that the numbers lose authority.

The system is tactile and composed. Large rounded containers gather related work; subtle borders and diffuse, low-contrast shadows establish hierarchy without a dashboard of competing boxes. Dark mode preserves the same warm, low-glare hierarchy by remapping the shared semantic tokens rather than changing the visual language.

**Key Characteristics:**

- Warm paper neutrals with a sparse burnt-orange action signal.
- Semibold, tightly tracked sans-serif hierarchy with tabular figures for money and data.
- One prominent control surface beside a document-like results column.
- Ambient elevation and gentle motion that clarify state, not decorate it.
- Plain, source-aware language that keeps estimates readable and bounded.

## Colors

The palette treats warmth as trust and status color as information: orange directs action, green and red communicate affordability, and quiet neutral layers hold the reading surface.

### Primary

- **Burnt Orange:** the primary action and interactive emphasis; reserve it for buttons, active outlines, links, search matches, and key budget values.
- **Soft Terracotta:** a pale selection and hover wash that supports orange without competing with content.
- **Deep Hearth:** the primary hover state, used to strengthen intent without adding a new hue.

**The Rare Signal Rule.** Orange should remain a directional cue, not become a broad page background or a substitute for hierarchy.

### Secondary

- **Clear Green:** positive affordability and fit status; pair with the pale green support surface when a status needs a chip or background.
- **Measured Red:** over-budget and error status; pair with the pale red support surface for compact status treatments.
- **Quiet Amber:** an intermediate tax or caution accent, used in data visualizations rather than primary controls.

### Neutral

- **Paper Canvas:** the page field, keeping the product light and breathable.
- **White Card:** the highest resting surface for the control panel and discrete cards.
- **Warm Mist:** the soft secondary surface for inputs, grouped content, and lightweight callouts.
- **Near-Black Ink:** principal text and the strong closing call to action.
- **Warm Gray:** supporting copy, labels, secondary figures, and explanatory source text.
- **Hairline / Strong Hairline:** quiet separators and input/card outlines that structure without turning into chrome.

In dark mode, semantic colors remap to warm charcoal surfaces, light ink, a brighter orange, and softened status tones. Keep roles constant; do not introduce a cold blue-dark theme.

## Typography

**Display Font:** Geist (with ui-sans-serif and system-ui fallbacks)

**Body Font:** Geist (with ui-sans-serif and system-ui fallbacks)

**Character:** A single modern sans-serif keeps calculations direct and human. Semibold, tight headlines give city names and decisions a decisive voice, while regular explanatory copy stays calm and easy to scan.

### Hierarchy

- **Display** (600, 3rem to 3.75rem, tight tracking): city headings and the primary landing statement.
- **Headline** (600, 1.875rem to 2.25rem, tight tracking): section-level decisions and major views.
- **Title** (600, 1.125rem to 1.5rem, tight tracking): card and component headings.
- **Body** (400, 1rem, relaxed reading): explanation, guidance, and most interactive copy; keep long text to a narrow readable measure.
- **Label** (500–600, 0.75rem to 0.875rem): field labels, sources, and compact metadata. Use tabular figures for monetary and quantitative values.

**The Numbers-Stand-True Rule.** Currency, rents, salaries, and comparison values use tabular numerals and weight—not ornamental display treatment—to earn attention.

## Layout

The main application uses a centered wide container with 1rem mobile gutters that become 1.5rem at medium screens. On large screens, the layout becomes a 22rem sticky planning column and a flexible results document separated by a generous 3rem gap. Below the large breakpoint, the planning controls return to normal flow above the results.

The results column reads as one document: sections are separated with a strong hairline and a consistent top rhythm rather than a sequence of nested panels. Paired charts form a two-column band at medium sizes and stack with their own divider on smaller screens. Marketing content uses broad vertical intervals and asymmetrical two-column cards, while legal content narrows to a reading measure.

Use the established 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, and 3rem rhythm. Keep dense controls grouped inside a single container; let explanatory sections breathe outside it.

## Elevation & Depth

Depth is ambient support, not a spatial metaphor. Resting structure comes first from tonal layering and hairline borders; the two diffuse shadow levels are reserved for the main control panel, overlays such as autocomplete, and hoverable cards. Hover may lift a control by a pixel or two, but it should never make the app feel animated for its own sake.

### Shadow Vocabulary

- **Card:** a low, warm two-part shadow for the main planning panel and quiet interactive lift.
- **Pop:** a broader warm shadow for the autocomplete panel and primary-call-to-action hover state.

**The Grounded Lift Rule.** If a surface does not contain a decision, an input, or a temporary layer, it does not need a shadow.

## Shapes

The form language is gently rounded and practical. Small utility controls use the compact rounded scale; buttons and list options use the medium-to-large scale; search fields, tags, and major containers use a 0.75rem to 1rem radius. Borders are thin and warm-gray, becoming orange only as an intentional interactive cue. Data bars and status pills may use fully rounded ends where the shape communicates a measured quantity or compact state.

## Components

### Buttons

Tactile, compact actions with semibold text and a clear resting edge.

- **Shape:** gently rounded (0.5rem to 0.75rem).
- **Primary:** burnt-orange fill with light text and compact 0.5rem by 0.75rem padding.
- **Secondary / toggle:** warm-mist background or a transparent surface with an orange border; selected compare state fills orange.
- **Hover / Focus:** hover slightly lifts or deepens the fill; keyboard focus is a visible 2px orange outline with offset. Active state settles downward.

### Cards / Containers

- **Corner Style:** broad, soft corners (1rem) for major control surfaces; 0.75rem for compact result cards.
- **Background:** white card for the planning panel; warm mist for low-emphasis content.
- **Shadow Strategy:** card shadow only on grouped controls or interaction, as defined in Elevation & Depth.
- **Border:** a single warm hairline.
- **Internal Padding:** 1.5rem in control cards; 1.5rem to 2rem on landing sections.

### Inputs / Fields

- **Style:** search fields are warm-mist surfaces with a strong hairline, semibold text, and broad rounded corners. Salary is deliberately more editorial: a large tabular input sits over a 2px underline.
- **Focus:** the city field replaces its border with a 2px orange focus outline; the salary underline becomes orange.
- **Error:** red underline and concise red helper text; avoid a separate alert container.

### Navigation

Small semibold text links sit beside the wordmark and theme control. Links are orange at rest, gain a pale orange surface or deeper orange text on hover, and remain compact enough to keep the planning interface primary.

### Data Status

Affordability is expressed with green/red text and compact soft-background pills, rather than relying on color alone. Charts retain direct labels, tabular values, and restrained color fills so a user can understand the result without treating the visualization as decoration.

## Do's and Don'ts

### Do:

- **Do** use the warm neutral surface hierarchy and one sparse burnt-orange action signal.
- **Do** make monetary figures tabular, legible, and visibly subordinate or dominant according to the decision they support.
- **Do** separate result sections with hairlines and rhythm before reaching for another card.
- **Do** retain visible keyboard focus and the project-wide reduced-motion behavior.
- **Do** use soft elevation only to clarify grouped controls, overlays, or interaction.

### Don't:

- **Don't** turn every data group into a raised card or dashboard tile.
- **Don't** introduce cold corporate blues, high-gloss gradients, or a detached finance-app aesthetic.
- **Don't** use orange as a full-surface fill or stack several competing accent treatments in one view.
- **Don't** hide financial nuance behind color alone; pair status color with words, values, or supporting context.
- **Don't** replace the deliberate document rhythm with dense, low-contrast data clutter.
