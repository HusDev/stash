// Helpers shared by the full window (main.js) and the paste menu (menu.js).

const { invoke, convertFileSrc } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const $ = (id) => document.getElementById(id);

// ---------- classification ----------

const RE = {
  url: /^(https?:\/\/|www\.)[^\s]+$/i,
  email: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i,
  color: /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\([^)]+\)|hsla?\([^)]+\))$/i,
  code: /[{};]\s*$|^\s*(import|export|const|let|var|function|def|class|return|if|for|SELECT|<\w+)[\s(]|=>|::|\$\(/m,
};

const kindCache = new Map();
function kindOf(item) {
  if (item.kind === "image") return "image";
  const cached = kindCache.get(item.id);
  if (cached && cached.text === item.text) return cached.kind;
  const t = item.text.trim();
  let kind = "text";
  if (RE.url.test(t)) kind = "link";
  else if (RE.color.test(t)) kind = "color";
  else if (RE.email.test(t)) kind = "email";
  else if (t.includes("\n") && RE.code.test(t)) kind = "code";
  kindCache.set(item.id, { text: item.text, kind });
  return kind;
}

const ICONS = {
  text: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  email: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  code: '<svg viewBox="0 0 24 24"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>',
  image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
  pin: '<svg viewBox="0 0 24 24" class="pin"><path d="M12 17v5M9 3h6l-1 7 4 3v2H6v-2l4-3z"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
  paste: '<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  open: '<svg viewBox="0 0 24 24"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  clip: '<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
};

// ---------- helpers ----------

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function highlight(text, ts) {
  if (!ts.length) return esc(text);
  const re = new RegExp(`(${ts.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(re).map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join("");
}

function ago(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 10) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fullDate(ms) {
  return new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function titleOf(item) {
  if (item.kind === "image") return `Image · ${item.width}×${item.height}`;
  const line = item.text.trim().split("\n").find((l) => l.trim()) || "";
  return line.trim().replace(/\s+/g, " ").slice(0, 300);
}

function prettyHotkey(s) {
  const map = { Super: "⌘", Command: "⌘", Cmd: "⌘", CmdOrCtrl: "⌘", CommandOrControl: "⌘", Shift: "⇧", Alt: "⌥", Option: "⌥", Control: "⌃", Ctrl: "⌃" };
  return (s || "")
    .split("+")
    .map((p) => map[p] || p.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Arrow/, "").replace("Space", "Space"))
    .join("");
}

// Pinned items keep a stable ⌃⌥1–9 slot in the order they were pinned (mirrors pinned_slots in Rust).
function computeSlots(items) {
  return new Map(
    items
      .filter((i) => i.pinned)
      .sort((a, b) => (a.pinnedAt ?? a.createdAt) - (b.pinnedAt ?? b.createdAt))
      .slice(0, 9)
      .map((i, n) => [i.id, n + 1])
  );
}
