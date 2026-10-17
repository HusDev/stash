---
workflow: general-video
flow: automation
storyboard: yes
message: "Paste anything you've copied, right where you're typing."
destination: youtube
aspect: 1920x1080
language: en
audience: Mac power users and developers browsing GitHub
length: 45s
angle: product-explainer
narration: yes
voice: kokoro:af_heart
---

## Intent

A narrated ~45s explainer for Stash, a keyboard-first macOS clipboard manager
built with Tauri 2 (repo: https://github.com/HusDev/stash). It will sit in the
GitHub README and on YouTube. Arc: the problem (you only get your last copy back)
→ ⌘⇧V opens a paste menu at the text cursor, 1–9 pastes → ⌃⌥1–9 pastes pinned
items from anywhere, ⌃⌥V pastes the previous copy → the full window (search,
filters, preview, edit, pin, undo) → privacy (skips password-manager secrets) and
menu-bar life → close on github.com/HusDev/stash.

## Assets

- ~/lab/stash/src (index.html, menu.html, styles.css, menu.css): the real app UI.
  Rebuild it faithfully as animated scenes; it's the visual source of truth.
- ~/lab/stash/src-tauri/icons/app-icon.png: the app icon (indigo→violet clipboard).

## Customizations

- Narration: Kokoro voice af_heart (warm female).
- Keystroke-click SFX on ⌘⇧V and number presses, plus a soft pop when the menu opens.
- A light music bed under the voice, carved and ducked under the narration.

## Notes

- Palette (user-chosen after sketch review): A — Light. Warm paper canvas #f3f1ec, ink #16161d, indigo #5b5ef0 accents (pressed keys, selection); the app icon keeps its indigo→violet gradient. Replaced the original dark indigo-night canvas, which the user disliked.
- No burned-in captions (not requested).
