# Text Editor Comparison for Kanban Detail Modal

**Evaluation Date:** March 2026
**Context:** Single HTML file (no build system, no npm), CDN-loaded libraries, localhost:3033
**Use Case:** Rich description editing in a kanban detail modal with save/cancel UX
**Design Bar:** Apple/Linear aesthetic, polished out-of-the-box look

---

## Executive Summary

| Editor | CDN Viable | Bundle Size | Setup Lines | Markdown | Auto-resize | Polish | Recommendation |
|--------|-----------|-------------|------------|----------|------------|--------|-----------------|
| **EasyMDE** | ✅ Excellent | ~500 KB | 8 | ✅ Full | ✅ Yes | ⭐⭐⭐⭐ | **FIRST CHOICE** |
| **Tiptap** | ✅ Good | 50–70 KB | 10 | ⚠️ Via extensions | ✅ Yes | ⭐⭐⭐⭐ | Strong alternative |
| **Toast UI Editor** | ✅ Good | 495 KB | 15 | ✅ Full | ✅ Yes | ⭐⭐⭐ | Heavier, more features |
| **Milkdown** | ✅ Fair | 40–45 KB | 20+ | ✅ Full | ✅ Yes | ⭐⭐⭐ | Good if customization needed |
| **CodeMirror 6** | ⚠️ Difficult | 124+ KB | 20+ | ⚠️ Syntax only | ⚠️ Manual | ⭐⭐⭐ | Code focus, not for markdown |
| **ProseMirror** | ❌ No | 200+ KB | 40+ | ⚠️ Manual impl | ✅ Yes | ⭐⭐⭐ | Too low-level for CDN |
| **Custom Enhanced Textarea** | ✅ Trivial | 0 KB | 30–50 | ⚠️ Display only | ⚠️ JS | ⭐⭐ | Minimal, basic UX |

---

## Detailed Analysis

### 1. EasyMDE (SimpleMDE fork) — **RECOMMENDED**

**Status:** Actively maintained (2026). SimpleMDE is obsolete; EasyMDE is the successor.

**CDN Availability:** ✅ Excellent
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css">
<script src="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.js"></script>
<!-- OR unpkg: https://unpkg.com/easymde/dist/easymde.min.* -->
```

**Bundle Size:** ~500 KB (CSS + JS combined, uncompressed)
Gzipped: ~150–200 KB (typical for modal use)

**Setup Complexity:** 8–10 lines of code
```html
<textarea id="description-editor"></textarea>
<script>
  const editor = new EasyMDE({
    element: document.getElementById('description-editor'),
    spellChecker: false,  // optional
    autoDownloadFontAwesome: false,  // load separately if needed
  });

  // Save: editor.value()
  // Set: editor.value('# Hello')
</script>
```

**Markdown Support:** ✅ Full
- Live preview (split-screen mode)
- All standard markdown syntax
- Syntax highlighting in code blocks
- Built-in toolbar (bold, italic, lists, links, etc.)
- Inline markdown preview

**Save/Cancel UX:** ✅ Straightforward
```javascript
function saveDescription() {
  const content = editor.value();
  // POST to API
}

function cancelEdit() {
  editor.value(originalContent);  // Restore
  closeModal();
}
```

**Auto-resize:** ✅ Yes
Can be configured with CSS or JavaScript to grow with content.

**Look & Feel:** ⭐⭐⭐⭐ Polished
- Modern toolbar with icon buttons
- Clean split-pane preview
- Responsive, mobile-friendly
- Can be styled to match Apple/Linear aesthetic with minimal CSS overrides
- Status bar shows character/word count

**Maintenance:** ✅ Active
GitHub: [Ionaru/easy-markdown-editor](https://github.com/Ionaru/easy-markdown-editor) — regular updates, community support.

**Considerations:**
- Requires Font Awesome for icons (can be disabled and loaded separately or use custom CSS)
- CSS needs minor tweaks to match your design system
- Slightly heavier than Tiptap but simpler setup

**Modal Integration Example:**
```html
<div id="description-modal" style="display:none;">
  <div class="modal-content">
    <h2>Edit Description</h2>
    <textarea id="description-editor"></textarea>
    <button onclick="saveDescription()">Save</button>
    <button onclick="cancelEdit()">Cancel</button>
  </div>
</div>

<script>
  let editor;
  function openEditModal(content) {
    document.getElementById('description-modal').style.display = 'block';
    if (!editor) {
      editor = new EasyMDE({
        element: document.getElementById('description-editor'),
        autoDownloadFontAwesome: false,
      });
    }
    editor.value(content);
  }
</script>
```

---

### 2. Tiptap — Strong Alternative

**Status:** Actively maintained (2026). Modern, headless rich text editor.

**CDN Availability:** ✅ Good
```html
<script type="module">
  import { Editor } from 'https://esm.sh/@tiptap/core'
  import StarterKit from 'https://esm.sh/@tiptap/starter-kit'
</script>
```
Uses ES modules via esm.sh CDN. Works in modern browsers.

**Bundle Size:** 50–70 KB gzipped (modular, only load what you need)

**Setup Complexity:** 12–15 lines
```javascript
import { Editor } from 'https://esm.sh/@tiptap/core'
import StarterKit from 'https://esm.sh/@tiptap/starter-kit'

const editor = new Editor({
  element: document.querySelector('.editor'),
  extensions: [StarterKit],
  content: '<p>Hello World</p>',
  autofocus: true,
})

// Save: editor.getHTML()
// Set: editor.commands.setContent(html)
```

**Markdown Support:** ⚠️ Partial
- Stores content as HTML, not markdown
- Can import markdown and convert to HTML, but requires additional setup
- Built-in markdown parsing with `@tiptap/extension-markdown` (adds complexity)
- No live preview mode (would need to build separately)

**Save/Cancel UX:** ✅ Good
```javascript
function saveDescription() {
  const html = editor.getHTML();
  // POST to API
}

function cancelEdit() {
  editor.commands.setContent(originalHTML);
  closeModal();
}
```

**Auto-resize:** ✅ Yes
Can be configured with CSS to grow with content.

**Look & Feel:** ⭐⭐⭐⭐ Very polished
- Headless (no default styling, you control it)
- Modern, extensible architecture
- Popular with design-conscious projects
- Easy to theme to Apple/Linear aesthetic

**Maintenance:** ✅ Very active
GitHub: [ueberdosis/tiptap](https://github.com/ueberdosis/tiptap) — frequent updates, large community.

**Considerations:**
- Headless design means you build your own UI (toolbar, buttons, etc.) — more work than EasyMDE
- HTML storage instead of markdown may complicate API integration if you expect markdown
- ES modules via esm.sh may have occasional CDN latency
- Markdown support requires additional extensions

**Verdict:** Excellent choice if you want fine-grained control and want to build a custom toolbar. Steeper learning curve than EasyMDE.

---

### 3. Toast UI Editor

**Status:** Maintained (2026). Mature, feature-rich.

**CDN Availability:** ✅ Good
```html
<link rel="stylesheet" href="https://uicdn.toast.com/editor/latest/toastui-editor.min.css" />
<script src="https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js"></script>
```

**Bundle Size:** 495 KB (minified), ~150 KB gzipped

**Setup Complexity:** 12–15 lines
```html
<div id="editor"></div>
<script>
  const editor = new toastui.Editor({
    el: document.querySelector('#editor'),
    height: '500px',
    initialEditType: 'markdown',
    previewStyle: 'split',
    initialValue: '# Hello World',
  });

  // Save: editor.getMarkdown()
</script>
```

**Markdown Support:** ✅ Full
- Native markdown editing
- Live preview (split-screen or tab-based)
- Markdown + WYSIWYG modes
- Support for tables, code blocks, diagrams (with plugins)

**Save/Cancel UX:** ✅ Good
```javascript
function saveDescription() {
  const markdown = editor.getMarkdown();
  // POST to API
}

function cancelEdit() {
  editor.setMarkdown(originalMarkdown);
  closeModal();
}
```

**Auto-resize:** ✅ Yes

**Look & Feel:** ⭐⭐⭐ Clean but dated
- Professional look, corporate styling
- Less polished aesthetic than Linear/Apple
- CMS-like interface (suitable for documentation, less suitable for modal in design tools)

**Maintenance:** ✅ Active
GitHub: [nhn/tui.editor](https://github.com/nhn/tui.editor)

**Considerations:**
- Heavier than EasyMDE or Tiptap
- More enterprise-oriented, less design-tool focused
- Good for rich features (tables, diagrams), overkill for simple descriptions

**Verdict:** Solid choice if you need advanced markdown features (tables, plugins). Overkill if descriptions are simple text + basic formatting.

---

### 4. Milkdown — For Fine-Grained Customization

**Status:** Maintained (2026). Plugin-driven, headless markdown editor.

**CDN Availability:** ✅ Fair
```html
<script src="https://cdn.jsdelivr.net/npm/@milkdown/core@latest"></script>
<!-- Requires additional plugin scripts for functionality -->
```
More modular than others; requires bundling multiple packages.

**Bundle Size:** 40–45 KB gzipped (core only; plugins add more)

**Setup Complexity:** 20+ lines
```javascript
import { Editor } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'

const editor = new Editor({
  root: document.querySelector('#editor'),
}).use(commonmark).create()

// More setup needed for UI, toolbar, etc.
```

**Markdown Support:** ✅ Full
- Native markdown, inspired by Typora
- Plugin-driven architecture
- Highly customizable

**Save/Cancel UX:** ✅ Good
```javascript
const markdown = editor.getValue();
```

**Auto-resize:** ✅ Yes

**Look & Feel:** ⭐⭐⭐ Minimal, modern
- Headless (you style it)
- Inspired by Typora (clean, distraction-free)
- Requires significant CSS work to match Linear aesthetic

**Maintenance:** ✅ Active

**Considerations:**
- Plugin architecture means you need to compose the editor yourself
- More setup code than EasyMDE or Toast UI
- CDN setup is messier (multiple scripts)
- Best suited if you have specific customization needs

**Verdict:** Choose if you want maximum flexibility and don't mind extra setup code.

---

### 5. CodeMirror 6 — Not Recommended

**Status:** Actively maintained. Popular for code editing, not ideal for prose/markdown.

**CDN Availability:** ⚠️ Difficult
```html
<!-- Not straightforward; designed for bundling -->
<!-- esm.sh works but with caveats -->
<script type="module">
  import { EditorView } from 'https://esm.sh/@codemirror/view'
  import { EditorState } from 'https://esm.sh/@codemirror/state'
</script>
```

**Bundle Size:** 124+ KB (gzipped, minimal setup)

**Setup Complexity:** 20+ lines, modular imports required

**Markdown Support:** ⚠️ Syntax highlighting only
- Markdown language support via `@codemirror/lang-markdown`
- No preview pane
- Not designed for rich text or WYSIWYG editing
- Best for code blocks, not prose

**Auto-resize:** ⚠️ Manual, requires configuration

**Look & Feel:** ⭐⭐⭐ Clean but code-focused
- Designed for programming, not prose
- Would need heavy customization to fit kanban design

**Verdict:** Skip for this use case. CodeMirror 6 is excellent for code editing, poor for description/markdown editing in a design tool.

---

### 6. ProseMirror — Too Low-Level

**Status:** Maintained, battle-tested (used by Notion, Linear internally).

**CDN Availability:** ❌ Poor
- Not designed for CDN delivery
- Requires bundling (webpack, rollup, esbuild)
- Complex dependency graph

**Bundle Size:** 200+ KB (requires bundler setup)

**Setup Complexity:** 40+ lines, requires build step

**Markdown Support:** ⚠️ Manual implementation required
- Core provides rich text editing primitives
- Markdown parsing/serialization is custom work
- No built-in UI or toolbar

**Verdict:** Skip. While Linear uses ProseMirror internally, it requires a build system and significant engineering effort. Not suitable for a single HTML file loaded from CDN.

---

### 7. Custom Enhanced Textarea — Minimal Approach

**Rationale:** If descriptions are simple (basic formatting only), a custom textarea with markdown preview might suffice.

**CDN Availability:** ✅ Trivial (pure HTML/CSS/JS)

**Bundle Size:** 0 (no external dependencies)

**Setup Complexity:** 30–50 lines (basic toolbar + preview)
```html
<textarea id="description"></textarea>
<button onclick="togglePreview()">Preview</button>
<div id="preview" style="display:none;"></div>

<script>
  function togglePreview() {
    // Simple markdown to HTML conversion (marked.js library or basic regex)
  }
</script>
```

**Markdown Support:** ⚠️ Display only
- You'd render markdown as HTML in a preview pane
- Requires external library (marked.js) for parsing
- No live inline editing

**Auto-resize:** ⚠️ Manual CSS/JS needed

**Look & Feel:** ⭐⭐ Basic
- Functional but minimal
- Poor user experience compared to full editors

**Verdict:** Only consider if descriptions are truly minimal (no complex formatting). Otherwise, pick a real editor.

---

## How Linear Handles Description Editing

**Finding:** Linear uses **ProseMirror** internally for its rich text editor. They've built a custom, highly polished UI on top of it with:
- Markdown syntax support
- Slash commands for formatting
- Inline commands and mentions
- Real-time collaboration (in their product)

**Key insight:** Linear invested significant engineering effort to build their editor UX. For your use case, you don't need (or want) to replicate that complexity via CDN-loaded libraries. EasyMDE or Tiptap are better pragmatic choices.

**Linear's approach:** Custom, purpose-built editor. Your approach: Pick a well-maintained library that matches your design bar with minimal customization.

---

## Recommendation

### **Use EasyMDE for immediate implementation** (Tier 1 — First Choice)

**Why:**
1. **CDN-perfect:** Works out-of-the-box with two script tags
2. **Markdown-native:** Stores content as markdown (simple API integration)
3. **Polished UX:** Modern toolbar, live preview, auto-resize
4. **Low setup:** 8–10 lines of initialization code
5. **Maintenance:** Actively maintained, large community
6. **Design flexibility:** Minimal CSS tweaks to match Apple/Linear aesthetic

**Implementation checklist:**
- [ ] Load CSS + JS from jsDelivr CDN
- [ ] Wrap EasyMDE initialization in modal open/close handlers
- [ ] Capture markdown content on save
- [ ] Restore content on edit cancel
- [ ] Add custom CSS to theme toolbar and editor
- [ ] Disable Font Awesome icons or load separately
- [ ] Test in modal with various description lengths

**Estimated setup time:** 1–2 hours

---

### **Use Tiptap if you want maximum design control** (Tier 2 — Alternative)

**Why:**
1. Headless architecture (build your own UI)
2. Smaller bundle size (50–70 KB)
3. Modern, extensible codebase
4. Good if you need custom toolbar or advanced formatting

**Trade-off:** Requires building more UI yourself (toolbar, buttons, preview mode).

**Estimated setup time:** 3–4 hours

---

### **Use Toast UI Editor if you need advanced features** (Tier 3)

**Why:**
1. Rich features (tables, diagrams, plugins)
2. Markdown + WYSIWYG modes
3. CDN delivery is straightforward

**Trade-off:** Heavier, slightly dated aesthetic.

**Estimated setup time:** 2–3 hours

---

## Summary Decision Matrix

**For a kanban detail modal with CDN-loaded libraries:**

```
Goal: Simple, polished description editor
├─ EasyMDE ← YES (fast, polished, pragmatic)
├─ Tiptap ← MAYBE (more control, more work)
├─ Toast UI ← OKAY (feature-rich, heavier)
├─ Milkdown ← NO (overkill complexity)
├─ CodeMirror 6 ← NO (code-focused)
├─ ProseMirror ← NO (requires build system)
└─ Custom textarea ← NO (poor UX)
```

---

## Next Steps

1. **Immediate:** Implement EasyMDE in dispatch-page.html
   - Load from jsDelivr CDN
   - Wrap in modal open/close
   - Test save/cancel flow
   - Customize CSS to match design system

2. **If needed:** Add markdown preview pane or custom toolbar in Tiptap for more control

3. **Later:** Consider server-side markdown validation/sanitization for security

---

## Sources & References

- [EasyMDE GitHub](https://github.com/Ionaru/easy-markdown-editor)
- [Tiptap CDN Docs](https://tiptap.dev/docs/editor/getting-started/install/cdn)
- [Toast UI Editor Docs](https://ui.toast.com/tui-editor/)
- [Milkdown Docs](https://milkdown.dev/)
- [CodeMirror 6 Docs](https://codemirror.net/)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)
- [Linear Documentation](https://linear.app/docs/editor)
- [Which Rich Text Editor Framework Should You Choose in 2025? - Liveblocks](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025)
