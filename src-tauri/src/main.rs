#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    borrow::Cow,
    collections::{hash_map::DefaultHasher, HashSet},
    fs,
    hash::{Hash, Hasher},
    path::PathBuf,
    sync::Mutex,
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use arboard::{Clipboard, ImageData};
use serde::{Deserialize, Serialize};
use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, LogicalPosition, Manager, PhysicalPosition, State, WindowEvent, Wry,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

const MAX_TEXT_CHARS: usize = 200_000;
const POLL_MS: u64 = 350;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Item {
    id: String,
    kind: String, // "text" | "image"
    text: Option<String>,
    image_path: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    hash: u64,
    source: Option<String>,
    created_at: i64,
    last_used: i64,
    uses: u32,
    pinned: bool,
    /// When it was pinned; orders the ⌃⌥1–9 slots so they stay stable.
    #[serde(default)]
    pinned_at: Option<i64>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct Settings {
    auto_paste: bool,
    paused: bool,
    max_items: usize,
    hotkey: String,
    quick_paste: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            auto_paste: true,
            paused: false,
            max_items: 300,
            hotkey: "Super+Shift+KeyV".into(),
            quick_paste: true,
        }
    }
}

#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(default)]
struct Store {
    items: Vec<Item>,
    settings: Settings,
}

struct AppState {
    store: Mutex<Store>,
    dir: PathBuf,
    hotkey: Mutex<Option<Shortcut>>,
    pause_item: Mutex<Option<CheckMenuItem<Wry>>>,
}

impl AppState {
    fn save(&self, store: &Store) {
        if let Ok(json) = serde_json::to_vec(store) {
            let tmp = self.dir.join("history.json.tmp");
            if fs::write(&tmp, json).is_ok() {
                let _ = fs::rename(tmp, self.dir.join("history.json"));
            }
        }
    }
}

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn hash_bytes(b: &[u8]) -> u64 {
    let mut h = DefaultHasher::new();
    b.hash(&mut h);
    h.finish()
}

fn emit_changed(app: &AppHandle) {
    let state = app.state::<AppState>();
    let snapshot = state.store.lock().unwrap().clone();
    let _ = app.emit("history-changed", snapshot);
}

/// Drop the oldest unpinned items beyond the limit. Image files are
/// garbage-collected at startup so a delete can still be undone.
fn trim(store: &mut Store) {
    let max = store.settings.max_items.max(10);
    let mut unpinned = 0;
    store.items.retain(|i| {
        if i.pinned {
            return true;
        }
        unpinned += 1;
        unpinned <= max
    });
}

/// Insert a fresh capture, or bump the existing copy of it to the top.
fn insert(store: &mut Store, item: Item) {
    let dup = store.items.iter().position(|i| {
        i.kind == item.kind
            && match item.kind.as_str() {
                "text" => i.text == item.text,
                _ => i.hash == item.hash,
            }
    });
    match dup {
        Some(pos) => {
            let mut existing = store.items.remove(pos);
            existing.last_used = item.created_at;
            if item.source.is_some() {
                existing.source = item.source;
            }
            store.items.insert(0, existing);
        }
        None => store.items.insert(0, item),
    }
    trim(store);
}

fn gc_images(state: &AppState) {
    let store = state.store.lock().unwrap();
    let live: HashSet<String> = store.items.iter().filter_map(|i| i.image_path.clone()).collect();
    if let Ok(entries) = fs::read_dir(state.dir.join("images")) {
        for e in entries.flatten() {
            let p = e.path().to_string_lossy().to_string();
            if !live.contains(&p) {
                let _ = fs::remove_file(e.path());
            }
        }
    }
}

// ---------- quick paste: ⌃⌥1–9 = pinned slots, ⌃⌥V = previous copy ----------

#[derive(Clone, Copy)]
enum Quick {
    Slot(usize),
    Previous,
}

const SLOT_KEYS: [Code; 9] = [
    Code::Digit1, Code::Digit2, Code::Digit3, Code::Digit4, Code::Digit5,
    Code::Digit6, Code::Digit7, Code::Digit8, Code::Digit9,
];

fn quick_shortcuts() -> Vec<(Shortcut, Quick)> {
    let mods = Some(Modifiers::CONTROL | Modifiers::ALT);
    let mut v: Vec<_> = SLOT_KEYS
        .iter()
        .enumerate()
        .map(|(i, k)| (Shortcut::new(mods, *k), Quick::Slot(i)))
        .collect();
    v.push((Shortcut::new(mods, Code::KeyV), Quick::Previous));
    v
}

fn set_quick_paste(app: &AppHandle, enabled: bool) {
    let gs = app.global_shortcut();
    for (sc, _) in quick_shortcuts() {
        let _ = if enabled { gs.register(sc) } else { gs.unregister(sc) };
    }
}

/// Pinned items in the order they were pinned (slot 1 = first pinned).
fn pinned_slots(store: &Store) -> Vec<&Item> {
    let mut pinned: Vec<&Item> = store.items.iter().filter(|i| i.pinned).collect();
    pinned.sort_by_key(|i| i.pinned_at.unwrap_or(i.created_at));
    pinned
}

fn quick_paste(app: &AppHandle, q: Quick) {
    let id = {
        let state = app.state::<AppState>();
        let store = state.store.lock().unwrap();
        match q {
            Quick::Slot(n) => pinned_slots(&store).get(n).map(|i| i.id.clone()),
            Quick::Previous => store.items.get(1).map(|i| i.id.clone()),
        }
    };
    let Some(id) = id else { return };
    let app = app.clone();
    thread::spawn(move || {
        // ⌃⌥ are still held right now; a synthetic ⌘V would arrive as ⌃⌥⌘V.
        mac::wait_for_modifier_release();
        let _ = do_paste(&app, &id, true, true);
    });
}

#[cfg(target_os = "macos")]
mod mac {
    use objc2_app_kit::{NSEvent, NSEventModifierFlags, NSPasteboard, NSWorkspace};

    /// Screen rect (points, top-left origin) of the text cursor in the focused
    /// app, via the Accessibility API. Falls back to the focused element's frame
    /// for apps that don't report caret bounds. None without Accessibility access.
    pub fn caret_rect() -> Option<(f64, f64, f64, f64)> {
        ax::caret_rect()
    }

    mod ax {
        use core_foundation::{
            base::{CFRelease, CFTypeRef, TCFType},
            string::{CFString, CFStringRef},
        };
        use std::{ffi::c_void, ptr::null};

        type AXUIElementRef = CFTypeRef;

        #[repr(C)]
        #[derive(Default, Clone, Copy)]
        struct CGRect { x: f64, y: f64, w: f64, h: f64 }
        #[repr(C)]
        #[derive(Default, Clone, Copy)]
        struct CGPair { a: f64, b: f64 }

        const AX_VALUE_CGPOINT: u32 = 1;
        const AX_VALUE_CGSIZE: u32 = 2;
        const AX_VALUE_CGRECT: u32 = 3;

        #[link(name = "ApplicationServices", kind = "framework")]
        extern "C" {
            fn AXIsProcessTrusted() -> bool;
            fn AXUIElementCreateSystemWide() -> AXUIElementRef;
            fn AXUIElementCopyAttributeValue(el: AXUIElementRef, attr: CFStringRef, out: *mut CFTypeRef) -> i32;
            fn AXUIElementCopyParameterizedAttributeValue(
                el: AXUIElementRef,
                attr: CFStringRef,
                param: CFTypeRef,
                out: *mut CFTypeRef,
            ) -> i32;
            fn AXValueGetValue(v: CFTypeRef, ty: u32, out: *mut c_void) -> bool;
        }

        unsafe fn attr(el: AXUIElementRef, name: &'static str) -> Option<CFTypeRef> {
            let mut out: CFTypeRef = null();
            let key = CFString::from_static_string(name);
            (AXUIElementCopyAttributeValue(el, key.as_concrete_TypeRef(), &mut out) == 0 && !out.is_null())
                .then_some(out)
        }

        /// Reads an AXValue into `T` and releases it.
        unsafe fn value<T: Default>(v: CFTypeRef, ty: u32) -> Option<T> {
            let mut out = T::default();
            let ok = AXValueGetValue(v, ty, &mut out as *mut T as *mut c_void);
            CFRelease(v);
            ok.then_some(out)
        }

        pub fn caret_rect() -> Option<(f64, f64, f64, f64)> {
            unsafe {
                if !AXIsProcessTrusted() {
                    return None;
                }
                let sys = AXUIElementCreateSystemWide();
                let focused = attr(sys, "AXFocusedUIElement");
                CFRelease(sys);
                let focused = focused?;

                let mut rect = None;
                if let Some(range) = attr(focused, "AXSelectedTextRange") {
                    let mut bounds: CFTypeRef = null();
                    let key = CFString::from_static_string("AXBoundsForRange");
                    if AXUIElementCopyParameterizedAttributeValue(focused, key.as_concrete_TypeRef(), range, &mut bounds) == 0
                        && !bounds.is_null()
                    {
                        rect = value::<CGRect>(bounds, AX_VALUE_CGRECT)
                            .filter(|r| r.x != 0.0 || r.y != 0.0 || r.h != 0.0);
                    }
                    CFRelease(range);
                }
                if rect.is_none() {
                    let pos = attr(focused, "AXPosition").and_then(|v| value::<CGPair>(v, AX_VALUE_CGPOINT));
                    let size = attr(focused, "AXSize").and_then(|v| value::<CGPair>(v, AX_VALUE_CGSIZE));
                    if let (Some(p), Some(sz)) = (pos, size) {
                        // Element frame: anchor to its bottom-left, like a dropdown.
                        let h = sz.b.min(28.0);
                        rect = Some(CGRect { x: p.a, y: p.b + sz.b - h, w: 0.0, h });
                    }
                }
                CFRelease(focused);
                rect.map(|r| (r.x, r.y, r.w, r.h))
            }
        }
    }

    pub fn wait_for_modifier_release() {
        let mask = NSEventModifierFlags::Control.0
            | NSEventModifierFlags::Option.0
            | NSEventModifierFlags::Command.0
            | NSEventModifierFlags::Shift.0;
        for _ in 0..100 {
            if NSEvent::modifierFlags_class().0 & mask == 0 {
                return;
            }
            std::thread::sleep(std::time::Duration::from_millis(10));
        }
    }

    pub fn change_count() -> i64 {
        NSPasteboard::generalPasteboard().changeCount() as i64
    }

    /// Password managers mark secrets with these pasteboard types
    /// (see nspasteboard.org). We never record those.
    pub fn is_concealed() -> bool {
        let Some(types) = NSPasteboard::generalPasteboard().types() else {
            return false;
        };
        types.iter().any(|t| {
            let t = t.to_string();
            t == "org.nspasteboard.ConcealedType"
                || t == "org.nspasteboard.TransientType"
                || t == "org.nspasteboard.AutoGeneratedType"
                || t.starts_with("com.agilebits.onepassword")
        })
    }

    pub fn frontmost_app() -> Option<String> {
        NSWorkspace::sharedWorkspace()
            .frontmostApplication()
            .and_then(|a| a.localizedName())
            .map(|n| n.to_string())
    }
}

#[cfg(not(target_os = "macos"))]
mod mac {
    pub fn wait_for_modifier_release() {}
    pub fn caret_rect() -> Option<(f64, f64, f64, f64)> {
        None
    }
    pub fn change_count() -> i64 {
        -1
    }
    pub fn is_concealed() -> bool {
        false
    }
    pub fn frontmost_app() -> Option<String> {
        None
    }
}

fn start_monitor(app: AppHandle) {
    thread::spawn(move || {
        let mut cb = loop {
            match Clipboard::new() {
                Ok(c) => break c,
                Err(_) => thread::sleep(Duration::from_secs(1)),
            }
        };
        let mut last_count = i64::MIN;
        let mut last_hash = 0u64;
        loop {
            thread::sleep(Duration::from_millis(POLL_MS));
            let count = mac::change_count();
            if count != -1 && count == last_count {
                continue;
            }
            last_count = count;

            let state = app.state::<AppState>();
            if state.store.lock().unwrap().settings.paused || mac::is_concealed() {
                continue;
            }

            let ts = now();
            let item = if let Ok(text) = cb.get_text() {
                if text.trim().is_empty() {
                    continue;
                }
                let text: String = if text.chars().count() > MAX_TEXT_CHARS {
                    text.chars().take(MAX_TEXT_CHARS).collect()
                } else {
                    text
                };
                let h = hash_bytes(text.as_bytes());
                if h == last_hash {
                    continue;
                }
                last_hash = h;
                Item {
                    id: format!("{ts}-{h:x}"),
                    kind: "text".into(),
                    text: Some(text),
                    image_path: None,
                    width: None,
                    height: None,
                    hash: h,
                    source: mac::frontmost_app(),
                    created_at: ts,
                    last_used: ts,
                    uses: 0,
                    pinned: false,
                    pinned_at: None,
                }
            } else if let Ok(img) = cb.get_image() {
                let h = hash_bytes(&img.bytes);
                if h == last_hash {
                    continue;
                }
                last_hash = h;
                let path = state.dir.join("images").join(format!("{h:016x}.png"));
                if !path.exists()
                    && image::save_buffer(
                        &path,
                        &img.bytes,
                        img.width as u32,
                        img.height as u32,
                        image::ExtendedColorType::Rgba8,
                    )
                    .is_err()
                {
                    continue;
                }
                Item {
                    id: format!("{ts}-{h:x}"),
                    kind: "image".into(),
                    text: None,
                    image_path: Some(path.to_string_lossy().to_string()),
                    width: Some(img.width as u32),
                    height: Some(img.height as u32),
                    hash: h,
                    source: mac::frontmost_app(),
                    created_at: ts,
                    last_used: ts,
                    uses: 0,
                    pinned: false,
                    pinned_at: None,
                }
            } else {
                continue;
            };

            {
                let mut store = state.store.lock().unwrap();
                insert(&mut store, item);
                state.save(&store);
            }
            emit_changed(&app);
        }
    });
}

fn show_window(app: &AppHandle) {
    let Some(w) = app.get_webview_window("main") else { return };
    #[cfg(target_os = "macos")]
    let _ = app.show();
    // Open on whichever screen the mouse is on, a little above center.
    if let (Ok(p), Ok(size)) = (app.cursor_position(), w.outer_size()) {
        if let Ok(Some(m)) = w.monitor_from_point(p.x, p.y) {
            let (mp, ms) = (m.position(), m.size());
            let x = mp.x + (ms.width as i32 - size.width as i32) / 2;
            let y = mp.y + (ms.height as i32 - size.height as i32) / 3;
            let _ = w.set_position(PhysicalPosition::new(x, y));
        }
    }
    let _ = w.show();
    let _ = w.set_focus();
    let _ = app.emit_to("main", "shown", ());
}

/// The paste menu: a small popup at the text cursor (or the mouse, if the
/// focused app doesn't expose its caret).
fn show_menu(app: &AppHandle) {
    let Some(w) = app.get_webview_window("menu") else { return };
    // Read the caret before we take focus away from the user's app.
    let caret = mac::caret_rect();
    #[cfg(target_os = "macos")]
    let _ = app.show();

    let (mw, mh) = w
        .outer_size()
        .ok()
        .zip(w.scale_factor().ok())
        .map(|(s, f)| (s.width as f64 / f, s.height as f64 / f))
        .unwrap_or((360.0, 400.0));
    let (cx, cy, ch) = match caret {
        Some((x, y, _, h)) => (x, y, h.max(16.0)),
        None => match (app.cursor_position(), w.scale_factor()) {
            (Ok(p), Ok(f)) => (p.x / f, p.y / f, 18.0),
            _ => (200.0, 200.0, 18.0),
        },
    };
    // Keep it on the screen that holds the caret: below the line if it fits, else above.
    let screen = w.available_monitors().ok().and_then(|ms| {
        ms.into_iter().map(|m| {
            let f = m.scale_factor();
            let p = m.position().to_logical::<f64>(f);
            let s = m.size().to_logical::<f64>(f);
            (p.x, p.y, s.width, s.height)
        })
        .find(|(x, y, w, h)| cx >= *x && cx < x + w && cy >= *y && cy < y + h)
    });
    let mut x = cx - 12.0;
    let mut y = cy + ch + 6.0;
    if let Some((sx, sy, sw, sh)) = screen {
        if y + mh > sy + sh - 8.0 {
            y = (cy - mh - 6.0).max(sy + 8.0);
        }
        x = x.clamp(sx + 8.0, sx + sw - mw - 8.0);
    }
    let _ = w.set_position(LogicalPosition::new(x, y));
    let _ = w.show();
    let _ = w.set_focus();
    let _ = app.emit_to("menu", "shown", ());
}

fn toggle_menu(app: &AppHandle) {
    if any_visible(app) {
        hide_window(app)
    } else {
        show_menu(app)
    }
}

fn any_visible(app: &AppHandle) -> bool {
    ["main", "menu"].iter().any(|l| {
        app.get_webview_window(l)
            .and_then(|w| w.is_visible().ok())
            .unwrap_or(false)
    })
}

fn hide_window(app: &AppHandle) {
    for label in ["main", "menu"] {
        if let Some(w) = app.get_webview_window(label) {
            let _ = w.hide();
        }
    }
    // Hands focus back to the app the user was in, so paste lands there.
    #[cfg(target_os = "macos")]
    let _ = app.hide();
}

fn simulate_paste(app: AppHandle) {
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(160));
        #[cfg(target_os = "macos")]
        {
            let ok = std::process::Command::new("osascript")
                .args(["-e", "tell application \"System Events\" to keystroke \"v\" using command down"])
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false);
            if !ok {
                let _ = app.emit("paste-failed", ());
            }
        }
        #[cfg(not(target_os = "macos"))]
        let _ = app;
    });
}

fn set_paused(app: &AppHandle, paused: bool) {
    let state = app.state::<AppState>();
    {
        let mut store = state.store.lock().unwrap();
        store.settings.paused = paused;
        state.save(&store);
    }
    if let Some(item) = state.pause_item.lock().unwrap().as_ref() {
        let _ = item.set_checked(paused);
    }
    emit_changed(app);
}

fn clear_unpinned(app: &AppHandle) {
    let state = app.state::<AppState>();
    {
        let mut store = state.store.lock().unwrap();
        store.items.retain(|i| i.pinned);
        state.save(&store);
    }
    emit_changed(app);
}

// ---------- commands ----------

#[tauri::command]
fn get_state(state: State<AppState>) -> Store {
    state.store.lock().unwrap().clone()
}

#[tauri::command]
fn paste_item(app: AppHandle, id: String, paste: bool) -> Result<(), String> {
    do_paste(&app, &id, paste, false)
}

/// Put an item on the clipboard and, if asked, paste it into the frontmost app.
/// `force` pastes even when auto-paste is off (used by the explicit quick-paste keys).
fn do_paste(app: &AppHandle, id: &str, paste: bool, force: bool) -> Result<(), String> {
    let state = app.state::<AppState>();
    let (item, auto) = {
        let mut store = state.store.lock().unwrap();
        let pos = store.items.iter().position(|i| i.id == id).ok_or("Item not found")?;
        let mut item = store.items.remove(pos);
        item.last_used = now();
        item.uses += 1;
        store.items.insert(0, item.clone());
        state.save(&store);
        (item, store.settings.auto_paste)
    };

    let mut cb = Clipboard::new().map_err(|e| e.to_string())?;
    match (item.text.as_ref(), item.image_path.as_ref()) {
        (Some(text), _) => cb.set_text(text.clone()).map_err(|e| e.to_string())?,
        (None, Some(path)) => {
            let img = image::open(path).map_err(|e| e.to_string())?.to_rgba8();
            let (w, h) = img.dimensions();
            cb.set_image(ImageData {
                width: w as usize,
                height: h as usize,
                bytes: Cow::Owned(img.into_raw()),
            })
            .map_err(|e| e.to_string())?;
        }
        _ => return Err("Empty item".into()),
    }

    emit_changed(app);
    if any_visible(app) {
        hide_window(app);
    }
    if paste && (auto || force) {
        simulate_paste(app.clone());
    }
    Ok(())
}

#[tauri::command]
fn toggle_pin(app: AppHandle, state: State<AppState>, id: String) {
    {
        let mut store = state.store.lock().unwrap();
        if let Some(i) = store.items.iter_mut().find(|i| i.id == id) {
            i.pinned = !i.pinned;
            i.pinned_at = i.pinned.then(now);
        }
        state.save(&store);
    }
    emit_changed(&app);
}

#[tauri::command]
fn delete_item(app: AppHandle, state: State<AppState>, id: String) {
    {
        let mut store = state.store.lock().unwrap();
        store.items.retain(|i| i.id != id);
        state.save(&store);
    }
    emit_changed(&app);
}

#[tauri::command]
fn restore_item(app: AppHandle, state: State<AppState>, item: Item, index: usize) {
    {
        let mut store = state.store.lock().unwrap();
        if !store.items.iter().any(|i| i.id == item.id) {
            let idx = index.min(store.items.len());
            store.items.insert(idx, item);
            state.save(&store);
        }
    }
    emit_changed(&app);
}

#[tauri::command]
fn update_text(app: AppHandle, state: State<AppState>, id: String, text: String) {
    {
        let mut store = state.store.lock().unwrap();
        if let Some(i) = store.items.iter_mut().find(|i| i.id == id) {
            i.hash = hash_bytes(text.as_bytes());
            i.text = Some(text);
        }
        state.save(&store);
    }
    emit_changed(&app);
}

#[tauri::command]
fn clear_history(app: AppHandle) {
    clear_unpinned(&app);
}

#[tauri::command]
fn update_settings(app: AppHandle, state: State<AppState>, settings: Settings) -> Result<(), String> {
    let new_sc: Shortcut = settings
        .hotkey
        .parse()
        .map_err(|_| format!("\"{}\" isn't a valid shortcut", settings.hotkey))?;
    {
        let mut cur = state.hotkey.lock().unwrap();
        if cur.as_ref() != Some(&new_sc) {
            let gs = app.global_shortcut();
            gs.register(new_sc)
                .map_err(|_| "That shortcut is taken by another app".to_string())?;
            if let Some(old) = cur.take() {
                let _ = gs.unregister(old);
            }
            *cur = Some(new_sc);
        }
    }
    let paused = settings.paused;
    let quick = settings.quick_paste;
    let quick_changed = state.store.lock().unwrap().settings.quick_paste != quick;
    if quick_changed {
        set_quick_paste(&app, quick);
    }
    {
        let mut store = state.store.lock().unwrap();
        store.settings = settings;
        trim(&mut store);
        state.save(&store);
    }
    if let Some(item) = state.pause_item.lock().unwrap().as_ref() {
        let _ = item.set_checked(paused);
    }
    emit_changed(&app);
    Ok(())
}

#[tauri::command]
fn hide(app: AppHandle) {
    hide_window(&app);
}

/// From the paste menu (⌘O): switch to the full Stash window.
#[tauri::command]
fn open_full(app: AppHandle) {
    if let Some(w) = app.get_webview_window("menu") {
        let _ = w.hide();
    }
    show_window(&app);
}

#[tauri::command]
fn open_external(target: String) -> Result<(), String> {
    let allowed = target.starts_with("http://")
        || target.starts_with("https://")
        || target.starts_with("mailto:")
        || target.starts_with("x-apple.systempreferences:");
    if !allowed {
        return Err("Refusing to open that URL".into());
    }
    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(&target).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, sc, ev| {
                    if ev.state() != ShortcutState::Pressed {
                        return;
                    }
                    let is_main = *app.state::<AppState>().hotkey.lock().unwrap() == Some(*sc);
                    let quick = quick_shortcuts().into_iter().find(|(q, _)| q == sc);
                    match quick {
                        Some((_, q)) if !is_main => quick_paste(app, q),
                        _ => toggle_menu(app),
                    }
                })
                .build(),
        )
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let dir = app.path().app_data_dir()?;
            fs::create_dir_all(dir.join("images"))?;
            let store: Store = fs::read(dir.join("history.json"))
                .ok()
                .and_then(|b| serde_json::from_slice(&b).ok())
                .unwrap_or_default();
            let hotkey_str = store.settings.hotkey.clone();
            let paused = store.settings.paused;
            let quick = store.settings.quick_paste;
            app.manage(AppState {
                store: Mutex::new(store),
                dir,
                hotkey: Mutex::new(None),
                pause_item: Mutex::new(None),
            });
            gc_images(&app.state::<AppState>());

            // Global hotkey (falls back to the default if the saved one fails).
            let handle = app.handle();
            let sc: Shortcut = hotkey_str
                .parse()
                .unwrap_or_else(|_| Settings::default().hotkey.parse().unwrap());
            if handle.global_shortcut().register(sc).is_ok() {
                *app.state::<AppState>().hotkey.lock().unwrap() = Some(sc);
            }
            if quick {
                set_quick_paste(handle, true);
            }

            // Menu bar icon
            let show = MenuItem::with_id(app, "show", "Open Stash", true, None::<&str>)?;
            let pause = CheckMenuItem::with_id(app, "pause", "Pause Capture", true, paused, None::<&str>)?;
            let clear = MenuItem::with_id(app, "clear", "Clear History (keeps pinned)", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Stash", true, Some("CmdOrCtrl+Q"))?;
            let sep = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(app, &[&show, &pause, &sep, &clear, &quit])?;
            *app.state::<AppState>().pause_item.lock().unwrap() = Some(pause);

            TrayIconBuilder::with_id("tray")
                .icon(Image::from_bytes(include_bytes!("../icons/tray.png"))?)
                .icon_as_template(true)
                .tooltip("Stash")
                .menu(&menu)
                .on_menu_event(|app, ev| match ev.id().as_ref() {
                    "show" => show_window(app),
                    "pause" => {
                        let paused = app.state::<AppState>().store.lock().unwrap().settings.paused;
                        set_paused(app, !paused);
                    }
                    "clear" => clear_unpinned(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            // Click outside = dismiss, like Spotlight.
            for label in ["main", "menu"] {
                if let Some(w) = app.get_webview_window(label) {
                    let w2 = w.clone();
                    w.on_window_event(move |ev| {
                        if let WindowEvent::Focused(false) = ev {
                            let _ = w2.hide();
                        }
                    });
                }
            }

            start_monitor(handle.clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_state,
            paste_item,
            toggle_pin,
            delete_item,
            restore_item,
            update_text,
            clear_history,
            update_settings,
            hide,
            open_full,
            open_external
        ])
        .run(tauri::generate_context!())
        .expect("error while running Stash");
}
