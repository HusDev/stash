// Stash landing page: the live paste-menu demo, the story tracker, reveals, copy buttons.
(() => {
  document.documentElement.classList.add("js");
  const $ = (s, r = document) => r.querySelector(s);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // ---------- nav border on scroll ----------
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- hero: the paste menu, working ----------
  const ITEMS = [
    { kind: "code", text: "npm run tauri dev", when: "2m" },
    { kind: "text", text: "Carrer de Mallorca 401, Barcelona", when: "1h" },
    { kind: "link", text: "github.com/HusDev/stash", when: "3h" },
    { kind: "mail", text: "hussein@example.com", when: "5h" },
    { kind: "swatch", text: "#6366F1", when: "1d" },
  ];
  const demo = $(".hero-demo");
  const pm = $("#pm");
  const list = $("#pm-list");
  const pasted = $("#pasted");
  const hintText = $("#hint-text");
  const reset = $("#reset");
  let sel = 0;
  let open = true;
  let done = false;

  list.innerHTML = ITEMS.map(
    (it, i) => `<li class="pm-row" role="option" id="pm-${i}" data-i="${i}">
      <span class="num">${i + 1}</span><span class="ci ${it.kind}"></span>
      <span class="t">${it.text}</span><span class="when">${it.when}</span></li>`
  ).join("");
  const rows = [...list.children];

  function select(i) {
    sel = (i + rows.length) % rows.length;
    rows.forEach((r, j) => {
      r.classList.toggle("sel", j === sel);
      r.setAttribute("aria-selected", j === sel);
    });
  }
  function setOpen(v) {
    open = v;
    pm.dataset.open = String(v);
  }
  function paste(i) {
    if (!open) return;
    select(i);
    setTimeout(() => {
      setOpen(false);
      pasted.textContent = ITEMS[i].text;
      pasted.hidden = false;
      done = true;
      demo.classList.toggle("found", i === 1);
      hintText.innerHTML =
        i === 1
          ? "Pasted, right at the cursor. That's the whole idea."
          : `Pasted “${ITEMS[i].text}”. The address was <b>2</b>, but you get the idea.`;
      reset.hidden = false;
    }, reduced ? 0 : 140);
  }
  function restart() {
    pasted.hidden = true;
    pasted.textContent = "";
    demo.classList.remove("found");
    done = false;
    reset.hidden = true;
    hintText.innerHTML = isMac
      ? 'Try it: press <kbd class="k">⌘</kbd><kbd class="k">⇧</kbd><kbd class="k">V</kbd>, then a number.'
      : 'Try it: press <kbd class="k">Ctrl</kbd><kbd class="k">⇧</kbd><kbd class="k">V</kbd>, then a number. Or click a row.';
    select(0);
    setOpen(true);
  }

  rows.forEach((r) => {
    r.addEventListener("mouseenter", () => open && select(+r.dataset.i));
    r.addEventListener("click", () => paste(+r.dataset.i));
  });
  reset.addEventListener("click", restart);

  // The page only listens while the hero is on screen, so ⌘⇧V elsewhere stays the browser's.
  let heroVisible = true;
  new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting), { threshold: 0.25 }).observe(demo);

  addEventListener("keydown", (e) => {
    if (!heroVisible) return;
    const t = e.target;
    if (t && (t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName))) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.shiftKey && e.key.toLowerCase() === "v") {
      e.preventDefault();
      if (done) restart();
      else setOpen(!open);
      return;
    }
    if (!open) return;
    if (/^[1-5]$/.test(e.key)) { e.preventDefault(); paste(+e.key - 1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); select(sel + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); select(sel - 1); }
    else if (e.key === "Enter" && !(t && t.closest && t.closest("a, button"))) { e.preventDefault(); paste(sel); }
    else if (e.key === "Escape") { setOpen(false); }
  });

  // Place the menu just under the caret, like the real app does.
  const note = $("#note");
  const caret = $("#caret");
  function placeMenu() {
    const n = note.getBoundingClientRect();
    const c = caret.getBoundingClientRect();
    const w = pm.offsetWidth;
    const x = Math.max(14, Math.min(c.left - n.left - 18, n.width - w - 14));
    pm.style.setProperty("--pm-x", x + "px");
    pm.style.setProperty("--pm-y", c.bottom - n.top + 10 + "px");
  }
  addEventListener("resize", placeMenu);
  document.fonts && document.fonts.ready.then(placeMenu);

  restart();
  placeMenu();

  // ---------- story: the tracker follows the copy ----------
  const tracker = $("#tracker");
  const state = $("#tc-state");
  const steps = [...tracker.querySelectorAll(".tc-steps li")];
  const stations = [...document.querySelectorAll(".station")];
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const step = +en.target.dataset.step;
        tracker.dataset.step = step;
        state.textContent = en.target.dataset.state;
        steps.forEach((s, i) => s.classList.toggle("on", i <= step));
      });
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  stations.forEach((s) => io.observe(s));

  // ---------- reveals, once ----------
  const revealables = document.querySelectorAll(".station, .film-frame, .menubar-demo, .close h2");
  revealables.forEach((el) => el.setAttribute("data-reveal", ""));
  const rio = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); rio.unobserve(en.target); }
    }),
    { rootMargin: "0px 0px -6% 0px" }
  );
  revealables.forEach((el) => rio.observe(el));
  // Never leave content hidden: anything already scrolled past is shown.
  const sweep = () => revealables.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in"); });
  addEventListener("scroll", sweep, { passive: true });
  addEventListener("load", sweep);

  // ---------- copy buttons ----------
  document.querySelectorAll("[data-copy]").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        b.textContent = "Copied";
        b.classList.add("done");
      } catch {
        b.textContent = "Select and copy";
      }
      setTimeout(() => { b.textContent = "Copy"; b.classList.remove("done"); }, 1800);
    })
  );
})();
