"use client";

import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";
import { FontSize } from "./tiptap/FontSize";
import { ResizableImage } from "./tiptap/ResizableImage";
import { SeoLink, buildLinkAttrs, detectLinkType } from "./tiptap/SeoLink";

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px"];

const WpImage = ResizableImage.configure({
  allowBase64: true,
  inline: false,
});

function IconBtn({ title, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`wp-btn${active ? " is-active" : ""}`}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick?.();
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="wp-sep" />;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function insertImagesFromFiles(editor, files, { align = "center", width = "70%" } = {}) {
  const list = [...(files || [])].filter((f) => f.type.startsWith("image/"));
  if (!editor || !list.length) return Promise.resolve(0);

  return Promise.all(list.map((file) => readFileAsDataUrl(file))).then((srcs) => {
    srcs.forEach((src, i) => {
      const file = list[i];
      editor
        .chain()
        .focus()
        .setImage({
          src,
          alt: file.name.replace(/\.[^.]+$/, ""),
          align,
          width,
        })
        .run();
    });
    return srcs.length;
  });
}

/**
 * Article content editor (TipTap).
 */
export default function TipTapEditor({
  value = "",
  onChange,
  placeholder = "Start writing your article…",
}) {
  const fileRef = useRef(null);
  const canvasDropRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState("visual");
  const [htmlDraft, setHtmlDraft] = useState("");
  const [kitchenSink, setKitchenSink] = useState(true);
  const [, bump] = useState(0);
  const [draggingOver, setDraggingOver] = useState(false);

  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");
  const [mediaAlign, setMediaAlign] = useState("center");
  const [mediaSize, setMediaSize] = useState("large");

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkType, setLinkType] = useState("offpage");
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [linkNofollow, setLinkNofollow] = useState(false);
  const [linkSponsored, setLinkSponsored] = useState(false);
  const [linkUgc, setLinkUgc] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const linkRangeRef = useRef(null);

  useEffect(() => setMounted(true), []);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4, 5, 6] },
          link: false,
        }),
        SeoLink,
        TextAlign.configure({
          types: ["heading", "paragraph"],
          alignments: ["left", "center", "right", "justify"],
        }),
        Placeholder.configure({ placeholder }),
        FontSize,
        WpImage,
      ],
      content: value || "",
      onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
      onSelectionUpdate: () => bump((n) => n + 1),
      editorProps: {
        attributes: {
          class: "wp-editor-body",
          "data-editor": "article",
        },
        handlePaste(view, event) {
          const items = [...(event.clipboardData?.items || [])];
          const img = items.find((i) => i.type.startsWith("image/"));
          if (!img) return false;
          event.preventDefault();
          const file = img.getAsFile();
          if (!file) return true;
          readFileAsDataUrl(file).then((src) => {
            const node = view.state.schema.nodes.image.create({
              src,
              alt: "",
              align: "center",
              width: "70%",
            });
            view.dispatch(view.state.tr.replaceSelectionWith(node));
          });
          return true;
        },
        handleDrop(view, event, _slice, moved) {
          if (moved) return false;
          const files = [...(event.dataTransfer?.files || [])].filter((f) =>
            f.type.startsWith("image/"),
          );
          if (!files.length) return false;
          event.preventDefault();
          const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
          Promise.all(files.map((f) => readFileAsDataUrl(f))).then((srcs) => {
            let tr = view.state.tr;
            let insertPos = coords?.pos ?? tr.selection.from;
            srcs.forEach((src, i) => {
              const node = view.state.schema.nodes.image.create({
                src,
                alt: files[i].name.replace(/\.[^.]+$/, ""),
                align: "center",
                width: "70%",
              });
              tr = tr.insert(insertPos, node);
              insertPos += node.nodeSize;
            });
            view.dispatch(tr.scrollIntoView());
          });
          return true;
        },
      },
    },
    [mounted],
  );

  useEffect(() => {
    if (!editor || editor.isDestroyed || !value) return;
    if (mode === "visual" && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value, mode]);

  function switchMode(next) {
    if (!editor) return;
    if (next === "text") {
      setHtmlDraft(editor.getHTML());
      setMode("text");
      return;
    }
    editor.commands.setContent(htmlDraft || "", { emitUpdate: true });
    onChange?.(editor.getHTML());
    setMode("visual");
  }

  function sizeToWidth(size) {
    if (size === "thumbnail") return "25%";
    if (size === "medium") return "45%";
    if (size === "large") return "70%";
    return "100%";
  }

  function insertMedia() {
    if (!editor || !mediaUrl.trim()) return;
    editor
      .chain()
      .focus()
      .setImage({
        src: mediaUrl.trim(),
        alt: mediaAlt.trim(),
        align: mediaAlign,
        width: sizeToWidth(mediaSize),
      })
      .run();
    setMediaUrl("");
    setMediaAlt("");
    setMediaAlign("center");
    setMediaSize("large");
    setMediaOpen(false);
  }

  async function uploadFiles(files) {
    await insertImagesFromFiles(editor, files, {
      align: mediaAlign,
      width: sizeToWidth(mediaSize),
    });
    setMediaOpen(false);
  }

  const openLinkModal = useCallback(() => {
    if (!editor) return;
    const attrs = editor.getAttributes("link");
    const { from, to, empty } = editor.state.selection;
    const selected = empty ? "" : editor.state.doc.textBetween(from, to, "\n");
    const href = attrs.href || "";
    const type = attrs.linkType || detectLinkType(href) || "onpage";
    const rel = String(attrs.rel || "");

    // Keep the exact range so Apply still wraps the selected text after modal focus moves.
    linkRangeRef.current = empty ? null : { from, to };

    setLinkUrl(href);
    setLinkText(selected);
    setLinkType(href ? type : "onpage");
    setLinkNewTab(attrs.target === "_blank" || (!!href && type === "offpage"));
    setLinkNofollow(rel.includes("nofollow"));
    setLinkSponsored(rel.includes("sponsored"));
    setLinkUgc(rel.includes("ugc"));
    setLinkTitle(attrs.title || "");
    setLinkOpen(true);
  }, [editor]);

  function applyLink() {
    if (!editor || !linkUrl.trim()) return;

    const attrs = buildLinkAttrs({
      href: linkUrl,
      linkType,
      openNewTab: linkNewTab,
      nofollow: linkNofollow,
      sponsored: linkSponsored,
      ugc: linkUgc,
      title: linkTitle,
    });

    const saved = linkRangeRef.current;
    const anchorText = linkText.trim();
    const { state } = editor;
    const docSize = state.doc.content.size;

    // Prefer the selection captured when the modal opened (modal input steals focus).
    if (saved && saved.from < saved.to && saved.to <= docSize) {
      const original = state.doc.textBetween(saved.from, saved.to, "\n");
      const text = anchorText || original;

      editor
        .chain()
        .focus()
        .setTextSelection({ from: saved.from, to: saved.to })
        .deleteSelection()
        .insertContent({
          type: "text",
          text,
          marks: [{ type: "link", attrs }],
        })
        .run();
    } else if (anchorText) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: anchorText,
          marks: [{ type: "link", attrs }],
        })
        .run();
    } else if (!state.selection.empty) {
      editor.chain().focus().setLink(attrs).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink(attrs).run();
    }

    linkRangeRef.current = null;
    setLinkOpen(false);
  }

  function onCanvasDragOver(e) {
    if (![...(e.dataTransfer?.types || [])].includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDraggingOver(true);
  }

  function onCanvasDragLeave(e) {
    if (!canvasDropRef.current?.contains(e.relatedTarget)) {
      setDraggingOver(false);
    }
  }

  async function onCanvasDrop(e) {
    setDraggingOver(false);
    if (e.defaultPrevented) return;
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    e.preventDefault();
    e.stopPropagation();
    await insertImagesFromFiles(editor, files, { align: "center", width: "70%" });
  }

  if (!mounted || !editor) {
    return <div className="wp-editor wp-editor-loading">Loading editor…</div>;
  }

  const blockValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : editor.isActive("heading", { level: 4 })
          ? "h4"
          : editor.isActive("blockquote")
            ? "blockquote"
            : "p";

  return (
    <div className="wp-editor" data-editor="article">
      <div className="wp-editor-tabs">
        <button
          type="button"
          className={`wp-tab${mode === "visual" ? " is-active" : ""}`}
          onClick={() => switchMode("visual")}
        >
          Visual
        </button>
        <button
          type="button"
          className={`wp-tab${mode === "text" ? " is-active" : ""}`}
          onClick={() => switchMode("text")}
        >
          Text
        </button>
      </div>

      {mode === "visual" ? (
        <>
          <div className="wp-toolbar">
            <div className="wp-toolbar-row">
              <IconBtn title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
                <b>B</b>
              </IconBtn>
              <IconBtn title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <i>I</i>
              </IconBtn>
              <IconBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
                <s>abc</s>
              </IconBtn>
              <Sep />
              <IconBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                •≡
              </IconBtn>
              <IconBtn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                1≡
              </IconBtn>
              <IconBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                ”
              </IconBtn>
              <Sep />
              <IconBtn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                ☰
              </IconBtn>
              <IconBtn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                ≡
              </IconBtn>
              <IconBtn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                ☰
              </IconBtn>
              <Sep />
              <IconBtn title="Insert/edit SEO link" active={editor.isActive("link")} onClick={openLinkModal}>
                🔗
              </IconBtn>
              <IconBtn
                title="Remove link"
                disabled={!editor.isActive("link")}
                onClick={() => editor.chain().focus().unsetLink().run()}
              >
                ⛓̸
              </IconBtn>
              <IconBtn title="Add Media" onClick={() => setMediaOpen(true)}>
                🖼
              </IconBtn>
              <Sep />
              <IconBtn title="Toolbar Toggle" active={kitchenSink} onClick={() => setKitchenSink((v) => !v)}>
                ☰☰
              </IconBtn>
            </div>

            {kitchenSink ? (
              <div className="wp-toolbar-row">
                <select
                  className="wp-format"
                  value={blockValue}
                  title="Paragraph / Heading"
                  onChange={(e) => {
                    const v = e.target.value;
                    const chain = editor.chain().focus();
                    if (v === "p") chain.setParagraph().run();
                    else if (v === "blockquote") chain.toggleBlockquote().run();
                    else chain.toggleHeading({ level: Number(v.replace("h", "")) }).run();
                  }}
                >
                  <option value="p">Paragraph</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="h4">Heading 4</option>
                  <option value="blockquote">Blockquote</option>
                </select>
                <select
                  className="wp-format wp-font-size"
                  title="Font size"
                  value={editor.getAttributes("fontSize").size || ""}
                  onChange={(e) => {
                    const size = e.target.value;
                    const chain = editor.chain().focus();
                    if (!size) chain.unsetFontSize().run();
                    else chain.setFontSize(size).run();
                  }}
                >
                  <option value="">Font size</option>
                  {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <Sep />
                <IconBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                  <u>U</u>
                </IconBtn>
                <IconBtn title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
                  ≣
                </IconBtn>
                <Sep />
                <IconBtn title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
                  Tx
                </IconBtn>
                <IconBtn title="Horizontal line" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                  ―
                </IconBtn>
                <Sep />
                <IconBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
                  ↶
                </IconBtn>
                <IconBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
                  ↷
                </IconBtn>
              </div>
            ) : null}
          </div>

          <div
            ref={canvasDropRef}
            className={`wp-canvas${draggingOver ? " is-drop-target" : ""}`}
            onDragOver={onCanvasDragOver}
            onDragLeave={onCanvasDragLeave}
            onDrop={onCanvasDrop}
          >
            {draggingOver ? (
              <div className="wp-drop-overlay">Drop image to insert</div>
            ) : null}
            <EditorContent editor={editor} />
            <p className="wp-resize-hint">
              Drop images into the editor · click an image for resize handles · use ↑↓←→ icons to move · ⋮⋮ to drag
            </p>
          </div>
        </>
      ) : (
        <textarea
          className="wp-text-mode"
          value={htmlDraft}
          onChange={(e) => {
            setHtmlDraft(e.target.value);
            onChange?.(e.target.value);
          }}
          spellCheck={false}
        />
      )}

      <div className="wp-editor-footer">
        <span />
        <span>
          {editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0} words
        </span>
      </div>

      {mediaOpen ? (
        <div className="wp-modal">
          <div className="wp-modal-card">
            <div className="wp-modal-head">
              <h3>Add Media</h3>
              <button type="button" className="wp-modal-close" onClick={() => setMediaOpen(false)}>
                ×
              </button>
            </div>

            <div className="wp-media-tabs">
              <span className="is-active">Upload files</span>
              <span>Insert from URL</span>
            </div>

            <div
              className="wp-upload-box"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("is-drag");
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove("is-drag")}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("is-drag");
                uploadFiles(e.dataTransfer.files);
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <p>Drop files to upload or</p>
              <button type="button" className="wp-primary" onClick={() => fileRef.current?.click()}>
                Select Files
              </button>
            </div>

            <div className="wp-field-grid">
              <label>
                Image URL
                <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." />
              </label>
              <label>
                Alt text
                <input value={mediaAlt} onChange={(e) => setMediaAlt(e.target.value)} placeholder="Describe the image" />
              </label>
              <label>
                Alignment
                <select value={mediaAlign} onChange={(e) => setMediaAlign(e.target.value)}>
                  <option value="none">None</option>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label>
                Size
                <select value={mediaSize} onChange={(e) => setMediaSize(e.target.value)}>
                  <option value="thumbnail">Thumbnail</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="full">Full size</option>
                </select>
              </label>
            </div>

            <div className="wp-modal-actions">
              <button type="button" className="wp-secondary" onClick={() => setMediaOpen(false)}>
                Cancel
              </button>
              <button type="button" className="wp-primary" disabled={!mediaUrl.trim()} onClick={insertMedia}>
                Insert into post
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {linkOpen ? (
        <div className="wp-modal">
          <div className="wp-modal-card wp-link-card">
            <div className="wp-modal-head">
              <h3>Insert / edit SEO link</h3>
              <button
                type="button"
                className="wp-modal-close"
                onClick={() => {
                  linkRangeRef.current = null;
                  setLinkOpen(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="wp-link-type-tabs">
              <button
                type="button"
                className={linkType === "onpage" ? "is-active" : ""}
                onClick={() => {
                  setLinkType("onpage");
                  setLinkNewTab(false);
                  setLinkNofollow(false);
                }}
              >
                On-page link
              </button>
              <button
                type="button"
                className={linkType === "offpage" ? "is-active" : ""}
                onClick={() => {
                  setLinkType("offpage");
                  setLinkNewTab(true);
                }}
              >
                Off-page / external
              </button>
            </div>

            <div className="wp-field-grid wp-link-fields">
              <label className="wp-span-2">
                URL
                <input
                  value={linkUrl}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLinkUrl(v);
                    setLinkType(detectLinkType(v));
                  }}
                  placeholder={linkType === "onpage" ? "/blogs/your-article or #section" : "https://example.com"}
                />
              </label>
              <label className="wp-span-2">
                Link text (optional if text is selected)
                <input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Anchor text"
                />
              </label>
              <label className="wp-span-2">
                Title attribute
                <input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Optional tooltip / title"
                />
              </label>
            </div>

            <div className="wp-link-options">
              <label>
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                />
                Open in new tab
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={linkNofollow}
                  onChange={(e) => setLinkNofollow(e.target.checked)}
                />
                rel=&quot;nofollow&quot;
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={linkSponsored}
                  onChange={(e) => setLinkSponsored(e.target.checked)}
                />
                rel=&quot;sponsored&quot;
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={linkUgc}
                  onChange={(e) => setLinkUgc(e.target.checked)}
                />
                rel=&quot;ugc&quot;
              </label>
            </div>

            <p className="wp-link-help">
              {linkType === "onpage"
                ? "On-page: internal paths, anchors, or same-site URLs. Good for site structure and crawl paths."
                : "Off-page: external URLs. Adds noopener/noreferrer by default; use nofollow/sponsored when needed."}
            </p>

            <div className="wp-modal-actions">
              <button
                type="button"
                className="wp-secondary"
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  linkRangeRef.current = null;
                  setLinkOpen(false);
                }}
              >
                Remove link
              </button>
              <button
                type="button"
                className="wp-secondary"
                onClick={() => {
                  linkRangeRef.current = null;
                  setLinkOpen(false);
                }}
              >
                Cancel
              </button>
              <button type="button" className="wp-primary" disabled={!linkUrl.trim()} onClick={applyLink}>
                Apply link
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
