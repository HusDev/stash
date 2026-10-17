---
format: 1920x1080
duration: 45s
message: "Paste anything you've copied, right where you're typing."
arc: Hook (pain) → Product intro (value claim) → Paste menu → Quick paste → Full window → Privacy → CTA
audience: Mac power users and developers browsing GitHub
mode: collaborative
music: calm modern electronic, soft synth pads, light pulse, uplifting tech
---

## Frame 1: Gone (0-5.6s)

- act: Act 1: The pain
- type: hook
- duration: 5.6s
- poster: 4.6s
- transition_in: cut
- status: animated
- blueprint: typewriter-reveal
- voiceover: "You copied it an hour ago. Then you copied something else. And now it's gone."
- src: compositions/frames/01-gone.html
- scene: A note types "My address is " → ⌘V pastes a stray URL instead; the line shakes, a ghost of the lost address fades away.

A note-editor window on the indigo canvas. A caret types a relatable line; a ⌘V keycap
presses and the WRONG thing lands (the last copy, a URL). The address you wanted
dissolves in ghost type behind it. Pain stated in outcome language, no feature names.

## Frame 2: Meet Stash (5.6-9.8s)

- act: Act 2: The answer
- type: product_intro
- duration: 4.2s
- poster: 2.8s
- transition_in: crossfade
- status: animated
- blueprint: logo-assemble-lockup
- voiceover: "Meet Stash. Everything you copy, right where you're typing."
- src: compositions/frames/02-meet.html
- scene: The real Stash icon spring-blooms; the wordmark and the line "Everything you copy, right where you're typing." resolve beside it.

The value claim lands by beat two. Real app icon (src-tauri/icons/app-icon.png).

## Frame 3: The paste menu (9.8-18.4s)

- act: Act 3: How it works
- type: feature_showcase
- duration: 8.6s
- poster: 6.5s
- transition_in: crossfade
- status: animated
- blueprint: cursor-ui-demo
- voiceover: "Press Command Shift V, and a menu opens at your cursor with your recent copies. Hit a number, and it's pasted."
- src: compositions/frames/03-menu.html
- scene: Back in the note, ⌘⇧V keycaps press; the real paste menu pops open at the caret (numbered rows); a "2" keycap presses; the address types into the line.

Locked stage, keyboard-driven (no mouse cursor). Menu rebuilt from src/menu.html:
search field, Recent|Pinned toggle, numbered rows with type icons and times.
Resolves Frame 1's pain on the same line of text.

## Frame 4: Quick paste (18.4-26.4s)

- type: feature_showcase
- duration: 8.0s
- poster: 5s
- transition_in: crossfade
- status: animated
- blueprint: fixed-anchor-cycle
- voiceover: "Pin the things you type all the time. Control Option one pastes your first pin anywhere, without opening a thing."
- src: compositions/frames/04-quick.html
- scene: Left: a pinned list with ⌃⌥1/2/3 slot badges (email, address, code snippet). Right: a fixed ⌃⌥ keycap pair while the number swaps 1→2→3 and each snippet flies into a different app field (Mail, browser form, terminal).

The keycap anchor stays pinned; the target field cycles, proving "from anywhere".

## Frame 5: The full window (26.4-34.2s)

- type: feature_showcase
- duration: 7.8s
- poster: 4.5s
- transition_in: crossfade
- status: animated
- blueprint: device-surface-showcase
- voiceover: "Need something older? Search everything. Filter links, images, code or colors, and edit before you paste."
- src: compositions/frames/05-window.html
- scene: The full Stash window floats in with a slow push; "greet" types into search with highlights; filter chips step Links → Images → Code → Colors as the preview pane swaps.

Rebuilt from src/index.html: search bar, filter chips with counts, list with ⌘1–9
badges, preview pane with stats + Paste/Copy/Pin/Edit actions.

## Frame 6: Private & out of the way (34.2-40.6s)

- act: Act 4: Trust
- type: benefit_highlight
- duration: 6.4s
- poster: 3.2s
- transition_in: crossfade
- status: animated
- blueprint: titlecard-reveal
- voiceover: "Passwords from your password manager are never saved. And it lives quietly in your menu bar."
- src: compositions/frames/06-private.html
- scene: A password-manager copy (•••••••) bounces off a shield; then a macOS menu bar slides in with the Stash clipboard icon and its dropdown (Open Stash, Pause Capture, Clear History).

## Frame 7: Get it (40.6-45.2s)

- act: Act 5: The ask
- type: cta
- duration: 4.6s
- poster: 2.5s
- transition_in: crossfade
- status: animated
- blueprint: logo-assemble-lockup
- voiceover: "Stash. Free and open source on GitHub."
- src: compositions/frames/07-cta.html
- scene: Icon + wordmark lockup, the ⌘⇧V keycap beneath, and "github.com/HusDev/stash" with a "Free · Open source · macOS" rail.
