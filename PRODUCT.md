# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS served by GitHub Pages from `/docs` on `main` (the user asked for "a public GitHub page"; no framework, no build step). The app itself is Tauri 2 (Rust + plain HTML/JS) in `src/` and `src-tauri/`.

## Users

Mac power users and developers: keyboard-heavy people who copy code, links, addresses and snippets all day and lose things because the system clipboard only holds the last copy. They are usually mid-task in another app (an editor, mail, a form, a terminal) when they need something they copied earlier.

## Product Purpose

Stash is a keyboard-first clipboard manager for macOS. It keeps everything you copy and lets you paste any of it right where you're typing, without leaving the app you're in. Success means the user never retypes or re-finds something they already copied.

## Positioning

The paste menu opens at the text cursor itself (⌘⇧V), not in a separate window, and 1–9 pastes immediately; normal ⌘V is untouched. Pinned items get stable global slots (⌃⌥1–9) that paste from anywhere without opening anything, and ⌃⌥V pastes the copy before the current one.

## Operating Context

- Lives in the macOS menu bar (no Dock icon); global shortcuts work from any app.
- Paste menu at the caret (Accessibility API), falling back to the focused field or the mouse.
- Full window (⌘O from the menu, or the menu bar icon): search, filters (All, Pinned, Text, Links, Images, Code, Colors), preview with stats and source app, edit before paste (⌘E), pin (⌘P), delete with undo (⌘⌫ / ⌘Z).
- Auto-paste and caret placement need macOS Accessibility permission; without it Enter copies and the user presses ⌘V.

## Capabilities and Constraints

- Captures text and images; records the source app for each item.
- Skips copies that password managers mark as concealed (org.nspasteboard ConcealedType/TransientType, 1Password). Capture can be paused.
- History stored locally in `~/Library/Application Support/com.hussein.stash/`; nothing leaves the Mac.
- History size 50–5,000 items; pinned items are never trimmed or cleared.
- macOS 11+. Built with Tauri 2 (~6 MB app).
- Distribution: unsigned `.dmg` attached to GitHub Release v0.1.0; first launch needs right-click → Open (Gatekeeper). Build from source also supported.
- License: MIT.

## Brand Commitments

- Name: Stash. Logo: the "stack" (three stacked rounded bars, newest and brightest in front) on a teal rounded square (`src-tauri/icons/app-icon.png`). Chosen by the user on 2026-10-17 after rejecting the earlier clipboard glyph.
- Accent: teal #0e7490. The user explicitly rejected purple/indigo; never reintroduce it.
- The demo video (warm-paper canvas, teal accents, Montserrat display, JetBrains Mono keys) was approved by the user; the page should feel like the same product.

## Evidence on Hand

- Demo video: `docs/stash-demo.mp4` (45s, narrated), poster `docs/stash-demo-poster.jpg`.
- Real app UI source to reconstruct mockups: `src/index.html`, `src/menu.html`, `src/styles.css`, `src/menu.css`.
- Repo: https://github.com/HusDev/stash.
- No users, stars, testimonials, press or download counts exist. Do not fabricate any.

## Product Principles

1. Never leave the app you're typing in.
2. Keyboard first, mouse optional.
3. Private by default: local only, secrets never stored.
4. Don't break the familiar: ⌘V keeps working exactly as before.
