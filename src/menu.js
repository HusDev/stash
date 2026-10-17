// The paste menu: a compact picker that opens at the text cursor (⌘⇧V).

const mq = $("mq");
const mlist = $("mlist");

let items = [];
let settings = {};
let tab = "recent";
let sel = 0;
let view = [];

function computeView() {
  const ts = mq.value.toLowerCase().split(/\s+/).filter(Boolean);
  let list = items;
  if (tab === "pinned") {
    const slots = computeSlots(items);
    list = items.filter((i) => i.pinned).sort((a, b) => (slots.get(a.id) ?? 99) - (slots.get(b.id) ?? 99));
  }
  view = list.filter((i) => {
    if (!ts.length) return true;
    const hay = (i.kind === "image" ? `image ${i.width}x${i.height}` : i.text).toLowerCase();
    return ts.every((t) => hay.includes(t));
  }).slice(0, 60);
  sel = Math.min(sel, Math.max(0, view.length - 1));
}

function render() {
  computeView();
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.t === tab));
  if (!view.length) {
    mlist.innerHTML = mq.value
      ? `<div class="m-empty"><div><b>No matches</b>Try a different word</div></div>`
      : tab === "pinned"
        ? `<div class="m-empty"><div><b>No pinned items</b>Pin things you paste often with ⌘P in Stash</div></div>`
        : `<div class="m-empty"><div><b>Nothing copied yet</b>Copy something and it shows up here</div></div>`;
    return;
  }
  const ts = mq.value.toLowerCase().split(/\s+/).filter(Boolean);
  mlist.innerHTML = view
    .map((item, i) => {
      const kind = kindOf(item);
      let icon = ICONS[kind] || ICONS.text;
      if (kind === "color") icon = `<span class="swatch" style="background:${esc(item.text.trim())}"></span>`;
      if (kind === "image") icon = `<img class="thumb" src="${convertFileSrc(item.imagePath)}" />`;
      const tip = item.text ? esc(item.text.slice(0, 400)) : "";
      return `<li class="m-item ${i === sel ? "sel" : ""}" data-i="${i}" title="${tip}">
        <span class="num ${i < 9 ? "" : "blank"}">${i < 9 ? i + 1 : ""}</span>
        <span class="ic">${icon}</span>
        <span class="title">${highlight(titleOf(item), ts)}</span>
        <span class="when">${ago(item.lastUsed)}</span>
      </li>`;
    })
    .join("");
}

function setSel(i, scroll = true) {
  sel = Math.max(0, Math.min(view.length - 1, i));
  mlist.querySelectorAll(".m-item").forEach((el) => el.classList.toggle("sel", Number(el.dataset.i) === sel));
  if (scroll) mlist.querySelector(".m-item.sel")?.scrollIntoView({ block: "nearest" });
}

function pick(i, paste = true) {
  const item = view[i];
  if (!item) return;
  invoke("paste_item", { id: item.id, paste });
}

function switchTab() {
  tab = tab === "recent" ? "pinned" : "recent";
  sel = 0;
  render();
}

mq.addEventListener("input", () => {
  sel = 0;
  render();
});

// Digits paste directly until you start typing a search.
mq.addEventListener("beforeinput", (e) => {
  if (!mq.value && e.data && /^[1-9]$/.test(e.data)) {
    e.preventDefault();
    pick(Number(e.data) - 1);
  }
});

mlist.addEventListener("mousemove", (e) => {
  const row = e.target.closest(".m-item");
  if (row && Number(row.dataset.i) !== sel) setSel(Number(row.dataset.i), false);
});
mlist.addEventListener("click", (e) => {
  const row = e.target.closest(".m-item");
  if (row) pick(Number(row.dataset.i), !e.shiftKey);
});
$("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b && b.dataset.t !== tab) switchTab();
  mq.focus();
});
$("full").onclick = () => invoke("open_full");

document.addEventListener("keydown", (e) => {
  const cmd = e.metaKey || e.ctrlKey;
  const k = e.key;
  if (k === "ArrowDown" || (e.ctrlKey && (k === "n" || k === "j"))) { e.preventDefault(); setSel(sel + 1); }
  else if (k === "ArrowUp" || (e.ctrlKey && (k === "p" || k === "k"))) { e.preventDefault(); setSel(sel - 1); }
  else if (k === "Enter") { e.preventDefault(); pick(sel, !e.shiftKey); }
  else if (k === "Tab") { e.preventDefault(); switchTab(); }
  else if (k === "Escape") {
    e.preventDefault();
    if (mq.value) { mq.value = ""; sel = 0; render(); }
    else invoke("hide");
  }
  else if (cmd && /^[1-9]$/.test(k)) { e.preventDefault(); pick(Number(k) - 1, !e.shiftKey); }
  else if (cmd && k === "o") { e.preventDefault(); invoke("open_full"); }
  else if (cmd && k === "w") { e.preventDefault(); invoke("hide"); }
});

listen("history-changed", (e) => {
  items = e.payload.items;
  settings = e.payload.settings;
  render();
});
listen("shown", () => {
  mq.value = "";
  tab = "recent";
  sel = 0;
  render();
  mlist.scrollTop = 0;
  mq.focus();
});

invoke("get_state").then((s) => {
  items = s.items;
  settings = s.settings;
  render();
});
mq.focus();
