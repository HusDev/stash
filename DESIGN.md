---
name: Stash
description: Everything you copy, right where you're typing. A keyboard-first clipboard manager for macOS.
colors:
  teal: "#0e7490"
  teal-hover: "#0c6782"
  teal-deep: "#0b5d73"
  teal-base: "#08495b"
  teal-wash: "rgba(14, 116, 144, 0.12)"
  paper: "#f3f1ec"
  paper-2: "#ebe8e0"
  ink: "#16161d"
  ink-2: "#3d3d47"
  muted: "#55555f"
  hairline: "rgba(22, 22, 40, 0.1)"
  window: "#f7f7fb"
  titlebar: "#efeff4"
  panel: "#ffffff"
  keycap-base: "#cfcfdb"
  band-text: "#b9b9cc"
  danger: "#b0283e"
  search-mark: "rgba(255, 196, 0, 0.45)"
typography:
  display:
    fontFamily: "Montserrat, Avenir Next, system-ui, sans-serif"
    fontSize: "clamp(42px, 4.7vw, 78px)"
    fontWeight: 900
    lineHeight: 0.97
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Montserrat, Avenir Next, system-ui, sans-serif"
    fontSize: "clamp(36px, 4.6vw, 72px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Montserrat, Avenir Next, system-ui, sans-serif"
    fontSize: "clamp(34px, 3.6vw, 56px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.04em"
  subtitle:
    fontFamily: "Montserrat, Avenir Next, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  lede:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(18px, 1.4vw, 21px)"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  keycap:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.82em"
    fontWeight: 700
    lineHeight: 1
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 500
rounded:
  inline: "6px"
  row: "10px"
  control: "14px"
  popover: "16px"
  window: "18px"
  frame: "22px"
  pill: "99px"
  keycap: "0.42em"
spacing:
  gutter: "clamp(20px, 4vw, 64px)"
  container: "1320px"
  stack-sm: "12px"
  stack-md: "22px"
  section: "clamp(90px, 14vh, 170px)"
  station: "clamp(96px, 18vh, 200px)"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.panel}"
    rounded: "{rounded.control}"
    padding: "0 26px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.teal-hover}"
    textColor: "{colors.panel}"
  button-ghost:
    backgroundColor: "rgba(255, 255, 255, 0.4)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 26px"
    height: "56px"
  button-ghost-hover:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  keycap:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.keycap}"
    rounded: "{rounded.keycap}"
    padding: "0 0.5em"
    height: "2em"
  keycap-down:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.panel}"
  window:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
    rounded: "{rounded.window}"
  window-titlebar:
    backgroundColor: "{colors.titlebar}"
    textColor: "{colors.muted}"
    height: "46px"
    padding: "0 16px"
  menu-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "9px"
    height: "42px"
    padding: "0 12px 0 8px"
  menu-row-selected:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.panel}"
  filter-chip:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "5px 11px"
  filter-chip-active:
    backgroundColor: "{colors.teal-wash}"
    textColor: "{colors.teal-deep}"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.window}"
    padding: "22px"
  privacy-band:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.band-text}"
  shell:
    backgroundColor: "{colors.ink}"
    textColor: "#e8e8f6"
    rounded: "{rounded.popover}"
    padding: "22px 24px"
---

# Design System: Stash

## Overview

**Creative North Star: "The Desk Under the Window"**

Stash's world is a warm sheet of paper with the Mac sitting on it. The canvas is paper with a faint ink dot grid; on it rest rebuilt macOS objects (windows with traffic lights, the paste menu, a menu bar drop-down, a terminal) and physical keycaps that press. The product is never photographed; it is rebuilt in HTML so it can be used, and that rebuilt chrome is the page's main material. A single teal does every job that means "this one, now": the caret, the selected row, the pressed key, the primary action.

Density is generous on paper and tight inside the windows. Display type is loud and compact (Montserrat 900 with -0.04em tracking), while everything inside a window speaks quietly in Inter at native UI sizes. One passage drops into ink, the privacy section, and nothing else does. The world was rebranded from an earlier indigo/violet with a clipboard-glyph icon to teal with the "stack" mark (three stacked rounded bars, the newest and brightest in front); the user rejected the purple and the clipboard glyph.

The same world skins the companion explainer film (`videos/stash-explainer/assets/stash.css`, `palette.css`) and the app's own UI (`src/styles.css`, `src/menu.css`). The landing page at `docs/` is the reference artifact; where they disagree, the site wins.

**Key Characteristics:**
- Warm paper canvas with an ink dot grid; white cards and cool-white macOS windows float on it.
- One teal accent, with a deep variant for text and a translucent wash for soft states.
- Rebuilt macOS window chrome as the primary material, never screenshots.
- Keycaps with a hard base that dip and fill teal when pressed.
- Lost things are struck through inside a dashed outline.
- A single full-bleed ink band, reserved for privacy.

## Colors

Warm paper and cool ink neutrals carry the page; one teal does all the signalling.

### Primary
- **Stash Teal** (teal): the only accent hue. The caret, selected menu rows, the pressed keycap, the primary download button, the active tracker step, focus outlines, the menu-bar tray item. Also the ground of the stack logo.
- **Teal Hover** (teal-hover): primary button hover only, a half-step darker.
- **Deep Teal** (teal-deep): teal as text. Links on paper, labels sitting on the teal wash, shortcut labels in fact lists. Use it whenever teal must be read as type at small sizes (6.6:1 on paper, where base teal is 4.75:1).
- **Teal Base** (teal-base): the hard base under a pressed keycap. Nowhere else.
- **Teal Wash** (teal-wash): translucent teal behind active filter chips, pinned-slot badges, pasted text, and the "found" tracker pill.

### Neutral
- **Warm Paper** (paper): the page canvas, the nav's frosted backdrop, the theme color.
- **Paper Shade** (paper-2): the video's loading ground; the second paper tone.
- **Ink** (ink): all primary text, the privacy band, the shell, the film frame, the 2px rule under shortcut table captions.
- **Ink Soft** (ink-2): ledes, station body copy, table cells, nav links.
- **Muted Slate** (muted): fine print, timestamps, secondary labels, window titles.
- **Hairline** (hairline): every 1px divider, titlebar bottom edge, row separators, footer rule.
- **Window White** (window): the body of every rebuilt macOS window and target field. Deliberately cooler than paper so windows read as the Mac, not the page.
- **Titlebar Grey** (titlebar): the 46px titlebar strip and the bottom stop of the keycap gradient.
- **Panel White** (panel): cards on paper (tracker, pin list, stack chips), preview panes, text on teal.
- **Keycap Base** (keycap-base): the hard base under a resting keycap and the install step numerals.
- **Band Text** (band-text): body copy inside the ink privacy band (9.3:1 on ink).

### Status and search
- **Lost Red** (danger): only for the "buried" state of the copy (the tracker's first pill). Not a general error color on the site.
- **Search Mark** (search-mark): translucent yellow on matched search terms in the rebuilt full window, mirroring the app.

### Named Rules
**The One Teal Rule.** Teal is the only accent hue. It marks selection, the caret, pressed keys and the primary action. The only other chromatic values allowed are the macOS traffic lights (part of the chrome), the search-mark yellow (search hits only), and lost red (the lost state only).

**The Cool Window, Warm Paper Rule.** Paper is warm (#f3f1ec family); the Mac's windows are cool white. Never tint a window warm or the page cool; the temperature split is how the eye tells product from page.

## Typography

**Display Font:** Montserrat 900, with 700 for small display titles (fallback Avenir Next, system-ui)
**Body Font:** Inter 400/500/600/700 (fallback system-ui, -apple-system)
**Label/Mono Font:** JetBrains Mono 500/700 (fallback ui-monospace, SF Mono, Menlo)

All three are self-hosted WOFF2 in `docs/fonts/` with `font-display: swap`; Montserrat 900 and Inter 400 are preloaded.

**Character:** A heavy, tightly tracked geometric display shouts the outcome; Inter keeps the rebuilt Mac honest; mono is the machine's own voice, appearing only where the keyboard or the file system speaks.

### Hierarchy
- **Display** (Montserrat 900, line-height 0.97): the hero headline only. The closing headline and the story title push the same style larger (up to clamp(44px, 7vw, 112px) at 0.95).
- **Headline** (Montserrat 900, line-height 1): section headings: film, privacy, shortcuts, install.
- **Title** (Montserrat 900): story station headings.
- **Subtitle** (Montserrat 700, 19 to 21px, -0.02em): privacy rule terms and shortcut table captions.
- **Lede** (Inter 400): the hero paragraph, max 34em.
- **Body** (Inter 400, 18px/1.6; 17px under 720px): all running copy, max 32 to 36em.
- **Label** (Inter 600, 13 to 15px): window titles, tabs, chips, pills, button labels at 17px.
- **Keycap** (JetBrains Mono 700, 0.82em of context; 0.72em for inline `sm` caps): keycaps and install step numerals.
- **Mono** (JetBrains Mono 500, 13px timestamps; 15px/1.9 in the shell; 0.88em inline code): code, paths, timestamps, shortcut strings.

### Named Rules
**The Mono Is Machine Rule.** JetBrains Mono appears only for keycaps, code, file paths, timestamps and shortcut strings. Prose, labels and buttons are Inter; headings are Montserrat.

**The Tight Display Rule.** Every Montserrat 900 heading carries -0.04em tracking and line-height of 1 or less, with balanced wrapping. Body copy uses pretty wrapping.

## Layout

A single 1320px container with a fluid gutter (clamp(20px, 4vw, 64px)) holds every section except the privacy band, which bleeds full width and re-derives the gutter inside its padding. Sections breathe with tall, viewport-relative padding (clamp(90px, 14vh, 170px) top or bottom); story stations sit even further apart (clamp(96px, 18vh, 200px)) so each reads as its own stop.

Grids are asymmetric two-column splits rather than card rows: hero 13fr/11fr (demo left, copy right), story 4fr/8fr (a sticky tracker card beside the stations), privacy and install 6fr/6fr, shortcuts three equal columns. Inside components the rhythm is 10, 12, 18, 22, 26px gaps.

At 1080px every split collapses to one column; the hero copy moves above the demo, the tracker becomes a slim sticky bar under the nav, shortcuts drop to two columns. At 720px the nav keeps only the GitHub link, shortcuts go to one column, the full-window preview pane hides, and buttons shrink to 52px.

## Elevation & Depth

Depth is soft, long and ink-tinted: objects sit on paper under wide, low-opacity shadows built from a 1px ink ring, a short contact shadow, and a long ambient fall. Larger and more "Mac-like" objects get longer falls. Teal-tinted shadows appear only under teal objects (the primary button, the app icon, the pressed key). The one exception to softness is the keycap: a hard, zero-blur base under each key, because that is what a keycap physically is.

### Shadow Vocabulary
- **Window** (`box-shadow: 0 0 0 1px rgba(22,22,40,0.07), 0 2px 4px rgba(22,22,40,0.04), 0 30px 70px rgba(22,22,40,0.14)`): rebuilt macOS windows.
- **Popover** (`box-shadow: 0 0 0 1px rgba(22,22,40,0.1), 0 4px 10px rgba(22,22,40,0.06), 0 26px 60px rgba(22,22,40,0.2)`): the paste menu, which sits above a window.
- **Card** (`box-shadow: 0 0 0 1px rgba(22,22,40,0.07), 0 18px 44px rgba(22,22,40,0.1)`): white cards on paper.
- **Chip** (`box-shadow: 0 0 0 1px rgba(22,22,40,0.06), 0 8px 20px rgba(22,22,40,0.06)`): small stacked items.
- **Primary lift** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 2px rgba(22,22,40,0.2), 0 12px 28px rgba(14,116,144,0.32)`): the primary button, deepening on hover.
- **Keycap rest** (`box-shadow: 0 0.16em 0 #cfcfdb, 0 0.4em 0.9em rgba(22,22,40,0.08)`): resting keys.
- **Keycap down** (`box-shadow: 0 0.04em 0 #08495b, 0 0.2em 0.5em rgba(14,116,144,0.3)`): pressed keys.

### Named Rules
**The Pressed Key Rule.** Keycaps, and the install step numerals drawn as keycaps, are the only objects with a hard zero-blur base. Pressing a key dips it 0.12em, collapses the base, and fills it teal. Every other surface uses the soft shadow vocabulary.

**The One Dark Band Rule.** The privacy section is the only full-width ink passage. Dark islands elsewhere (the shell, the terminal target, the film frame) are dark because the real objects are, not as section treatments.

## Shapes

Corners are generous and Apple-soft, scaled by object size: 6px for inline highlights and code, 9 to 10px for list rows and small controls, 14px for buttons and chips, 16px for popovers and the shell, 18px for windows and cards, 22px for the film frame, 26px on the large app icon, and full pills for tabs, filter chips and status pills. Keycaps round at 0.42em so they scale with their type.

Borders are rare: 1px hairlines divide, a 1.5px ink-alpha outline draws ghost buttons and keycaps, and a 2px ink rule anchors shortcut table captions. The recurring silhouette is the macOS window: a 46px titlebar with three 12px traffic lights (#ff5f57, #febc2e, #28c840) and a centered title.

**The Lost Is Dashed Rule.** A dashed 1.5px outline plus a 2px strike-through means "lost" or "not saved": the buried address, the lost stack chip, the password that Stash refuses to keep. Do not use dashed outlines for anything else.

## Components

### Buttons
Confident, tactile, and few.
- **Shape:** gently rounded (14px; 16px on the 64px closing button).
- **Primary:** teal fill, white Inter 600 17px label, 56px tall, 26px side padding, a 20px stroked download arrow, the teal primary-lift shadow.
- **Hover / Focus:** hover rises 2px, darkens to teal-hover and deepens the shadow; active returns to rest. Focus is a global 3px teal outline at 3px offset.
- **Ghost:** ink label on a 40% white fill with a 1.5px ink-alpha outline; hover goes solid white with a darker outline.
- **Pill action:** small Inter 600 14px pills on the teal wash ("Again"), deep-teal text.

### Keycaps (signature)
- **Style:** white-to-titlebar-grey vertical gradient, 1.5px ink-alpha border, JetBrains Mono 700, 2em square minimum, keycap-base hard base.
- **Pressed:** dips 0.12em, fills teal, white glyph, base collapses to teal-base (120ms ease-out).
- **Sizes:** inline `sm` caps in prose, table caps at 0.8em, and big caps at clamp(30px, 3.4vw, 46px) for the "⌘ ⇧ V then 2" moment.

### macOS Window (signature)
- **Corner Style:** 18px.
- **Background:** window white body, titlebar grey strip with a hairline below.
- **Shadow Strategy:** Window shadow.
- **Contents:** Inter at native sizes; selection is a solid teal row with white text.

### Paste Menu (signature)
- **Style:** near-white popover (16px) with the Popover shadow, a search line with a segmented Recent/Pinned tab, 42px rows with a numbered square, title and timestamp, and a footer of shortcut hints.
- **State:** the selected row fills teal with white text; the menu pops from its top-left corner (scale 0.92 and -6px up to rest, 220ms ease-out).

### Chips
- **Filter chip:** Inter 600 13px pill, muted text on transparent; active is teal wash with deep teal text.
- **Stack chip:** white 14px card with type icon, text and a mono timestamp; older copies recede by scale (0.985, 0.97, 0.955).
- **Status pill:** pill on lost-red wash for "buried", switching to teal wash and deep teal once found.

### Cards / Containers
- **Corner Style:** 16 to 18px.
- **Background:** panel white on paper; window white for target fields.
- **Shadow Strategy:** Card or Chip shadow.
- **Internal Padding:** 22px for cards, 13 to 18px for chips and fields.
- **Active target:** a 2.5px teal ring replaces the ink ring.

### Shell
Ink block (16px radius), JetBrains Mono 500 15px/1.9 in near-white, a light-teal `$` prompt, and a translucent Copy button that turns teal when copied.

### Navigation
Sticky, transparent at the top; on scroll a frosted paper backdrop (82% paper, 14px blur) gains a hairline. Brand is the 36px stack icon plus "Stash" in Montserrat 900 24px. Links are Inter 500 16px in ink-soft, deep teal on hover; GitHub sits in a 1.5px outlined 10px-radius control. Under 720px only GitHub remains.

### Motion
One easing for everything: `cubic-bezier(0.16, 1, 0.3, 1)`. Keys 120ms, buttons 200ms, menu pop 220ms, tracker state 400ms, the lost card fades up and blurs out over 600ms, pasted text lands from a stronger teal wash over 900ms, the caret blinks in hard steps. Under `prefers-reduced-motion` smooth scroll, the caret blink and the transitions stop.

## Do's and Don'ts

### Do:
- **Do** keep teal the only accent; put it on whatever is selected, pressed, typed into, or the one primary action.
- **Do** use deep teal, not base teal, when teal is text at small sizes.
- **Do** rebuild the product as live HTML macOS chrome (46px titlebar, traffic lights, 18px radius, window white) instead of placing screenshots.
- **Do** draw every shortcut as a keycap, and press it (dip, teal fill) when it is being demonstrated.
- **Do** keep the paper warm and the windows cool.
- **Do** use the stack mark (three stacked rounded bars on a teal square, newest and brightest in front) as the only brand image.

### Don't:
- **Don't** use purple, indigo or violet anywhere; the user rejected them in the rebrand.
- **Don't** use the clipboard glyph as the Stash logo or brand mark; it was replaced by the stack mark.
- **Don't** add a second full-width dark section; the ink band belongs to privacy.
- **Don't** give hard zero-blur shadows to anything except keycaps and keycap-style numerals.
- **Don't** set prose, labels or buttons in JetBrains Mono.
- **Don't** use dashed outlines or strike-through for anything except lost or refused copies.
