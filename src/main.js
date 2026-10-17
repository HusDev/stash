const q = $("q");
const listEl = $("list");
const previewEl = $("preview");

let items = [];
let settings = {};
let query = "";
let filter = "all";
let selectedId = null;
let view = [];
let editing = false;
let recordingHotkey = false;
let toastTimer = null;
let lastDeleted = null;

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "pinned", label: "Pinned", test: (i) => i.pinned },
  { id: "text", label: "Text", test: (i) => ["text", "email"].includes(kindOf(i)) },
  { id: "link", label: "Links", test: (i) => kindOf(i) === "link" },
  { id: "image", label: "Images", test: (i) => kindOf(i) === "image" },
  { id: "code", label: "Code", test: (i) => kindOf(i) === "code" },
  { id: "color", label: "Colors", test: (i) => kindOf(i) === "color" },
];

// ---------- helpers ----------

function terms() {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

let slots = new Map();

const selectedIndex = () => Math.max(0, view.findIndex((i) => i.id === selectedId));
const selectedItem = () => view.find((i) => i.id === selectedId) || null;

// ---------- render ----------

function computeView() {
  const f = FILTERS.find((x) => x.id === filter);
  const ts = terms();
  slots = computeSlots(items);
  view = items.filter(f.test).filter((i) => {
    if (!ts.length) return true;
    const hay = (i.kind === "image" ? `image ${i.width}x${i.height}` : i.text).toLowerCase() + " " + (i.source || "").toLowerCase();
    return ts.every((t) => hay.includes(t));
  });
  if (filter === "pinned") view.sort((a, b) => (slots.get(a.id) ?? 99) - (slots.get(b.id) ?? 99));
  if (!view.some((i) => i.id === selectedId)) selectedId = view[0]?.id ?? null;
}

function renderFilters() {
  $("filters").innerHTML = FILTERS.map((f) => {
    const n = f.id === "all" ? items.length : items.filter(f.test).length;
    if (n === 0 && f.id !== "all" && f.id !== filter) return "";
    return `<button class="chip ${f.id === filter ? "on" : ""}" data-f="${f.id}">${f.label}<span class="n">${n}</span></button>`;
  }).join("");
}

function rowHTML(item, idx, ts) {
  const kind = kindOf(item);
  let icon = ICONS[kind] || ICONS.text;
  if (kind === "color") icon = `<span class="swatch" style="background:${esc(item.text.trim())}"></span>`;
  if (kind === "image") icon = `<img class="thumb" src="${convertFileSrc(item.imagePath)}" loading="lazy" />`;
  const slot = settings.quickPaste && slots.get(item.id);
  const quick = slot ? `<kbd class="slot" title="Paste from anywhere">⌃⌥${slot}</kbd>` : idx < 9 ? `<kbd>⌘${idx + 1}</kbd>` : "";
  return `<li class="item ${item.id === selectedId ? "sel" : ""}" data-id="${item.id}" role="option">
    <span class="ic">${icon}</span>
    <span class="title">${highlight(titleOf(item), ts)}</span>
    <span class="meta">${item.pinned ? ICONS.pin : ""}${ago(item.lastUsed)}${quick}</span>
  </li>`;
}

function renderList() {
  const ts = terms();
  if (!items.length) {
    listEl.innerHTML = `<div class="empty"><div>${ICONS.clip}<div class="big">Nothing here yet</div>
      Copy anything and it shows up here.<br/>Pick from it while typing with <kbd>${prettyHotkey(settings.hotkey)}</kbd></div></div>`;
    return;
  }
  if (!view.length) {
    const msg = query ? `No matches for “${esc(query)}”` : "Nothing in this filter";
    const sub = filter === "pinned" && !query ? "Press <kbd>⌘P</kbd> on any item to keep it forever<br/>and paste it anywhere with <kbd>⌃⌥1–9</kbd>." : "Try another word or press <kbd>⇥</kbd> to change filter.";
    listEl.innerHTML = `<div class="empty"><div>${ICONS.search}<div class="big">${msg}</div>${sub}</div></div>`;
    return;
  }
  listEl.innerHTML = view.slice(0, 400).map((it, i) => rowHTML(it, i, ts)).join("");
}

function renderPreview() {
  const item = selectedItem();
  if (!item) {
    previewEl.innerHTML = "";
    return;
  }
  const kind = kindOf(item);
  const ts = terms();
  let main = "";
  const stats = [];

  if (kind === "image") {
    main = `<div class="pv-img"><img src="${convertFileSrc(item.imagePath)}" /></div>`;
    stats.push(`<b>${item.width}×${item.height}</b> px`);
  } else if (editing) {
    main = `<textarea id="editor" class="pv-text" spellcheck="false">${esc(item.text)}</textarea>`;
  } else if (kind === "link") {
    const t = item.text.trim();
    let host = t;
    try { host = new URL(t.startsWith("www.") ? `https://${t}` : t).hostname; } catch {}
    main = `<div class="pv-link"><div class="pv-domain">${esc(host)}</div><div class="pv-url">${highlight(t, ts)}</div></div>`;
  } else if (kind === "color") {
    const c = item.text.trim();
    main = `<div class="pv-color"><div class="big" style="background:${esc(c)}"></div><div class="val">${esc(c)}</div></div>`;
  } else {
    const shown = item.text.length > 30000 ? item.text.slice(0, 30000) + "\n…" : item.text;
    main = `<pre class="pv-text ${kind === "code" ? "" : "prose"}">${highlight(shown, ts)}</pre>`;
  }

  if (item.text != null) {
    const t = item.text;
    const words = (t.trim().match(/\S+/g) || []).length;
    const lines = t.split("\n").length;
    stats.push(`<b>${t.length.toLocaleString()}</b> chars`, `<b>${words.toLocaleString()}</b> words`);
    if (lines > 1) stats.push(`<b>${lines.toLocaleString()}</b> lines`);
  }
  if (item.source) stats.push(`from <b>${esc(item.source)}</b>`);
  stats.push(`copied <b>${fullDate(item.createdAt)}</b>`);
  if (item.uses) stats.push(`used <b>${item.uses}×</b>`);
  if (settings.quickPaste && slots.get(item.id)) stats.push(`paste anywhere with <b>⌃⌥${slots.get(item.id)}</b>`);

  const pasteLabel = settings.autoPaste ? "Paste" : "Copy";
  const actions = editing
    ? `<button class="btn primary" data-act="save">Save <kbd>⌘S</kbd></button>
       <button class="btn" data-act="cancel">Cancel <kbd>esc</kbd></button>`
    : `<button class="btn primary" data-act="paste">${ICONS.paste}${pasteLabel} <kbd>↵</kbd></button>
       ${settings.autoPaste ? `<button class="btn" data-act="copy">${ICONS.copy}Copy <kbd>⇧↵</kbd></button>` : ""}
       <button class="btn" data-act="pin">${ICONS.pin}${item.pinned ? "Unpin" : "Pin"}</button>
       ${item.text != null ? `<button class="btn" data-act="edit">${ICONS.edit}Edit</button>` : ""}
       ${kind === "link" ? `<button class="btn" data-act="open">${ICONS.open}Open</button>` : ""}
       <span class="grow"></span>
       <button class="btn icon" data-act="delete" title="Delete (⌘⌫)">${ICONS.trash}</button>`;

  previewEl.innerHTML = `<div class="pv-main">${main}</div>
    <div class="pv-foot"><div class="stats">${stats.map((s) => `<span>${s}</span>`).join("")}</div>
    <div class="actions">${actions}</div></div>`;

  if (editing) {
    const ed = $("editor");
    ed.focus();
    ed.setSelectionRange(ed.value.length, ed.value.length);
  }
}

function render() {
  computeView();
  renderFilters();
  renderList();
  renderPreview();
  $("paused-badge").hidden = !settings.paused;
  $("count").textContent = view.length === items.length ? `${items.length} items` : `${view.length} of ${items.length}`;
}

function select(id, scroll = true) {
  if (editing) return;
  selectedId = id;
  listEl.querySelectorAll(".item").forEach((el) => el.classList.toggle("sel", el.dataset.id === id));
  renderPreview();
  if (scroll) listEl.querySelector(".item.sel")?.scrollIntoView({ block: "nearest" });
}

function move(delta) {
  if (!view.length) return;
  const i = Math.min(view.length - 1, Math.max(0, selectedIndex() + delta));
  select(view[i].id);
}

// ---------- actions ----------

async function paste(item, doPaste = true) {
  if (!item) return;
  try {
    await invoke("paste_item", { id: item.id, paste: doPaste });
  } catch (e) {
    toast(String(e));
  }
}

async function togglePin(item) {
  if (!item) return;
  const wasPinned = item.pinned;
  await invoke("toggle_pin", { id: item.id });
  const slot = slots.get(item.id);
  if (wasPinned) toast("Unpinned");
  else if (settings.quickPaste && slot) toast(`Pinned — paste it anywhere with ⌃⌥${slot}`);
  else toast("Pinned — it won't be cleared");
}

async function remove(item) {
  if (!item) return;
  const idx = items.findIndex((i) => i.id === item.id);
  const next = view[selectedIndex() + 1] || view[selectedIndex() - 1];
  selectedId = next?.id ?? null;
  lastDeleted = { item, index: idx };
  await invoke("delete_item", { id: item.id });
  toast("Deleted", { label: "Undo ⌘Z", run: undo });
}

async function undo() {
  if (!lastDeleted) return;
  const { item, index } = lastDeleted;
  lastDeleted = null;
  selectedId = item.id;
  await invoke("restore_item", { item, index });
  hideToast();
}

function startEdit() {
  const item = selectedItem();
  if (!item || item.text == null) return;
  editing = true;
  renderPreview();
}

async function saveEdit() {
  const item = selectedItem();
  const ed = $("editor");
  editing = false;
  if (item && ed && ed.value !== item.text && ed.value.trim()) {
    await invoke("update_text", { id: item.id, text: ed.value });
    toast("Saved");
  } else renderPreview();
  q.focus();
}

function cancelEdit() {
  editing = false;
  renderPreview();
  q.focus();
}

function cycleFilter(dir) {
  const visible = [...$("filters").querySelectorAll(".chip")].map((c) => c.dataset.f);
  const i = visible.indexOf(filter);
  filter = visible[(i + dir + visible.length) % visible.length];
  selectedId = null;
  render();
}

function toast(msg, action) {
  const el = $("toast");
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action.label)}</button>` : ""}`;
  if (action) el.querySelector("button").onclick = action.run;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 5000 : 1800);
}
function hideToast() {
  $("toast").hidden = true;
}

// ---------- settings ----------

const settingsEl = $("settings");

function openSettings() {
  $("auto-paste").checked = settings.autoPaste;
  $("quick-paste").checked = settings.quickPaste;
  $("paused").checked = settings.paused;
  $("max-items").value = String(settings.maxItems);
  $("hotkey").textContent = prettyHotkey(settings.hotkey);
  $("clear").classList.remove("confirm");
  $("clear").textContent = "Clear…";
  settingsEl.hidden = false;
}
function closeSettings() {
  settingsEl.hidden = true;
  stopRecording();
  q.focus();
}

async function saveSettings(patch) {
  try {
    await invoke("update_settings", { settings: { ...settings, ...patch } });
    return true;
  } catch (e) {
    toast(String(e));
    openSettings();
    return false;
  }
}

function stopRecording() {
  recordingHotkey = false;
  $("hotkey").classList.remove("rec");
  $("hotkey").textContent = prettyHotkey(settings.hotkey);
}

$("auto-paste").onchange = (e) => saveSettings({ autoPaste: e.target.checked });
$("quick-paste").onchange = (e) => saveSettings({ quickPaste: e.target.checked });
$("paused").onchange = (e) => saveSettings({ paused: e.target.checked });
$("max-items").onchange = (e) => saveSettings({ maxItems: Number(e.target.value) });
$("settings-btn").onclick = openSettings;
$("settings-close").onclick = closeSettings;
settingsEl.onclick = (e) => { if (e.target === settingsEl) closeSettings(); };
$("open-ax").onclick = (e) => {
  e.preventDefault();
  invoke("open_external", { target: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility" });
};
$("clear").onclick = async (e) => {
  const b = e.currentTarget;
  if (!b.classList.contains("confirm")) {
    b.classList.add("confirm");
    b.textContent = "Click to confirm";
    return;
  }
  await invoke("clear_history");
  closeSettings();
  toast("History cleared");
};
$("hotkey").onclick = (e) => {
  e.preventDefault();
  recordingHotkey = true;
  $("hotkey").classList.add("rec");
  $("hotkey").textContent = "Press keys…";
};

function hotkeyFromEvent(e) {
  if (["Meta", "Shift", "Alt", "Control"].includes(e.key)) return null;
  const mods = [];
  if (e.metaKey) mods.push("Super");
  if (e.ctrlKey) mods.push("Control");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");
  if (!mods.length) return null;
  return [...mods, e.code].join("+");
}

// ---------- input ----------

q.addEventListener("input", () => {
  query = q.value;
  selectedId = null;
  render();
});

$("filters").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  filter = chip.dataset.f;
  selectedId = null;
  render();
  q.focus();
});

listEl.addEventListener("click", (e) => {
  const row = e.target.closest(".item");
  if (row) select(row.dataset.id, false);
});
listEl.addEventListener("dblclick", (e) => {
  const row = e.target.closest(".item");
  if (row) paste(view.find((i) => i.id === row.dataset.id));
});

previewEl.addEventListener("click", (e) => {
  const act = e.target.closest("[data-act]")?.dataset.act;
  const item = selectedItem();
  ({
    paste: () => paste(item, true),
    copy: () => paste(item, false),
    pin: () => togglePin(item),
    delete: () => remove(item),
    edit: startEdit,
    save: saveEdit,
    cancel: cancelEdit,
    open: () => {
      const t = item.text.trim();
      invoke("open_external", { target: t.startsWith("www.") ? `https://${t}` : t }).then(() => invoke("hide"));
    },
  })[act]?.();
});

document.addEventListener("keydown", async (e) => {
  const cmd = e.metaKey || e.ctrlKey;

  if (recordingHotkey) {
    e.preventDefault();
    if (e.key === "Escape") return stopRecording();
    const combo = hotkeyFromEvent(e);
    if (combo && (await saveSettings({ hotkey: combo }))) {
      settings.hotkey = combo;
      stopRecording();
      toast(`Shortcut set to ${prettyHotkey(combo)}`);
    }
    return;
  }

  if (!settingsEl.hidden) {
    if (e.key === "Escape" || (cmd && e.key === ",")) { e.preventDefault(); closeSettings(); }
    return;
  }

  if (editing) {
    if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
    else if (cmd && (e.key === "s" || e.key === "Enter")) { e.preventDefault(); saveEdit(); }
    return;
  }

  const item = selectedItem();
  const k = e.key;

  if (k === "ArrowDown" || (e.ctrlKey && (k === "n" || k === "j"))) { e.preventDefault(); cmd && k === "ArrowDown" ? move(1e9) : move(1); }
  else if (k === "ArrowUp" || (e.ctrlKey && (k === "p" || k === "k"))) { e.preventDefault(); cmd && k === "ArrowUp" ? move(-1e9) : move(-1); }
  else if (k === "PageDown") { e.preventDefault(); move(8); }
  else if (k === "PageUp") { e.preventDefault(); move(-8); }
  else if (k === "Enter") { e.preventDefault(); paste(item, !e.shiftKey); }
  else if (k === "Tab") { e.preventDefault(); cycleFilter(e.shiftKey ? -1 : 1); }
  else if (k === "Escape") {
    e.preventDefault();
    if (query) { q.value = query = ""; selectedId = null; render(); }
    else if (filter !== "all") { filter = "all"; render(); }
    else invoke("hide");
  }
  else if (cmd && /^[1-9]$/.test(k)) { e.preventDefault(); paste(view[Number(k) - 1], !e.shiftKey); }
  else if (cmd && k === "p") { e.preventDefault(); togglePin(item); }
  else if (cmd && k === "e") { e.preventDefault(); startEdit(); }
  else if (cmd && k === "Backspace") { e.preventDefault(); remove(item); }
  else if (cmd && k === "z" && lastDeleted && !q.value) { e.preventDefault(); undo(); }
  else if (cmd && k === ",") { e.preventDefault(); openSettings(); }
  else if (cmd && k === "f") { e.preventDefault(); q.focus(); q.select(); }
  else if (cmd && k === "w") { e.preventDefault(); invoke("hide"); }
  else if (document.activeElement !== q && k.length === 1 && !cmd) q.focus();
});

// ---------- boot ----------

function apply(s) {
  items = s.items;
  settings = s.settings;
  render();
}

listen("history-changed", (e) => apply(e.payload));
listen("shown", () => {
  q.value = query = "";
  filter = "all";
  editing = false;
  selectedId = null;
  closeSettings();
  hideToast();
  render();
  listEl.scrollTop = 0;
  q.focus();
  if (pasteFailed) showPasteHint();
});
// The window is already hidden when a paste fails, so show the hint next time.
let pasteFailed = false;
function showPasteHint() {
  pasteFailed = false;
  toast("Copied — allow Accessibility in Settings to auto-paste", {
    label: "Open",
    run: () => invoke("open_external", { target: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility" }),
  });
}
listen("paste-failed", () => { pasteFailed = true; });

// Keep the relative times fresh while open.
setInterval(() => { if (!document.hidden && !editing) renderList(); }, 30000);

invoke("get_state").then(apply);
q.focus();
