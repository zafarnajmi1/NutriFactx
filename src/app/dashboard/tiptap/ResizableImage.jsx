"use client";

import Image from "@tiptap/extension-image";
import { Fragment } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

function widthToPct(width, parentWidth) {
  if (width == null || width === "") return 70;
  const raw = String(width).trim();
  if (raw.endsWith("%")) return Math.min(100, Math.max(1, parseFloat(raw) || 70));
  const px = parseFloat(raw);
  if (!Number.isFinite(px) || !parentWidth) return 70;
  return Math.min(100, Math.max(1, (px / parentWidth) * 100));
}

function moveNode(editor, direction) {
  if (!editor) return;
  const { state, view } = editor;
  const { selection, doc } = state;
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== "image") {
    return;
  }

  const pos = selection.from;
  const node = selection.node;
  const $from = doc.resolve(pos);
  const index = $from.index($from.depth);
  const parent = $from.parent;
  const tr = state.tr;

  if (direction === "up" && index > 0) {
    const targetPos = $from.posAtIndex(index - 1, $from.depth);
    tr.delete(pos, pos + node.nodeSize);
    const mapped = tr.mapping.map(targetPos);
    tr.insert(mapped, node);
    tr.setSelection(NodeSelection.create(tr.doc, mapped));
    view.dispatch(tr.scrollIntoView());
    return;
  }

  if (direction === "down" && index < parent.childCount - 1) {
    const next = parent.child(index + 1);
    const from = pos;
    const to = pos + node.nodeSize + next.nodeSize;
    tr.replaceWith(from, to, Fragment.from([next, node]));
    tr.setSelection(NodeSelection.create(tr.doc, from + next.nodeSize));
    view.dispatch(tr.scrollIntoView());
  }
}

function ResizableImageView({ node, updateAttributes, selected, deleteNode, editor, getPos }) {
  const wrapRef = useRef(null);
  const resizing = useRef(null);
  const livePctRef = useRef(null);
  const [livePct, setLivePct] = useState(null);
  const [parentW, setParentW] = useState(680);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const align = node.attrs.align || "center";
  const widthPct = livePct ?? widthToPct(node.attrs.width, parentW);

  const measure = useCallback(() => {
    const editorEl = wrapRef.current?.closest(".ProseMirror");
    const pw = editorEl?.clientWidth || 680;
    setParentW(pw);
    const img = wrapRef.current?.querySelector("img");
    if (!img) return;
    setDims({
      w: Math.round(img.getBoundingClientRect().width),
      h: Math.round(img.getBoundingClientRect().height),
    });
  }, []);

  useEffect(() => {
    measure();
  }, [widthPct, measure, node.attrs.src, selected]);

  useEffect(() => {
    function onMove(event) {
      const state = resizing.current;
      if (!state) return;
      const { dir, startX, startY, startWidth, parentWidth, aspect } = state;
      let delta = 0;
      if (dir === "e" || dir === "ne" || dir === "se") delta = event.clientX - startX;
      else if (dir === "w" || dir === "nw" || dir === "sw") delta = startX - event.clientX;
      else if (dir === "n") delta = (startY - event.clientY) * aspect;
      else if (dir === "s") delta = (event.clientY - startY) * aspect;

      const nextPx = Math.max(40, startWidth + delta);
      let nextPct = (nextPx / parentWidth) * 100;
      nextPct = Math.min(100, Math.max(5, Math.round(nextPct * 10) / 10));
      livePctRef.current = nextPct;
      setLivePct(nextPct);
    }

    function onUp() {
      if (!resizing.current) return;
      const pct = livePctRef.current;
      resizing.current = null;
      if (pct != null) updateAttributes({ width: `${pct}%` });
      livePctRef.current = null;
      setLivePct(null);
      document.querySelector(".dashboard-isolate .wp-editor")?.classList.remove("is-resizing");
      requestAnimationFrame(measure);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [measure, updateAttributes]);

  function startResize(event, dir) {
    event.preventDefault();
    event.stopPropagation();
    const editorEl = wrapRef.current?.closest(".ProseMirror");
    const parentWidth = editorEl?.clientWidth || 680;
    const img = wrapRef.current?.querySelector("img");
    const rect = img?.getBoundingClientRect();
    const aspect = rect && rect.height > 0 ? rect.width / rect.height : 1.5;
    resizing.current = {
      dir,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect?.width || 0,
      parentWidth,
      aspect,
    };
    document.querySelector(".dashboard-isolate .wp-editor")?.classList.add("is-resizing");
  }

  function selectSelf() {
    const pos = typeof getPos === "function" ? getPos() : null;
    if (pos == null || !editor) return;
    editor.commands.setNodeSelection(pos);
  }

  function move(direction) {
    selectSelf();
    moveNode(editor, direction);
  }

  return (
    <NodeViewWrapper
      className={`wp-resizer align-${align}${selected ? " is-selected" : ""}`}
      style={{ width: `${widthPct}%` }}
    >
      <div className="wp-resizer-inner" ref={wrapRef} onClick={selectSelf}>
        <span className="wp-drag-grip" data-drag-handle title="Drag to move image" contentEditable={false}>
          ⋮⋮
        </span>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={node.attrs.src} alt={node.attrs.alt || ""} draggable={false} />

        {selected ? (
          <>
            <span className="wp-resizer-frame" aria-hidden="true" />
            {HANDLES.map((dir) => (
              <span
                key={dir}
                className={`wp-handle wp-handle-${dir}`}
                title="Drag to resize"
                onMouseDown={(event) => startResize(event, dir)}
              />
            ))}
            <span className="wp-resizer-dim">
              {dims.w} × {dims.h}px · {Math.round(widthPct)}%
            </span>
          </>
        ) : null}
      </div>

      {selected ? (
        <div
          className="wp-resizer-bar"
          contentEditable={false}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="wp-resizer-group" title="Move">
            <button type="button" title="Move up" onClick={() => move("up")}>↑</button>
            <button type="button" title="Move down" onClick={() => move("down")}>↓</button>
            <button
              type="button"
              title="Float left"
              className={align === "left" ? "is-active" : ""}
              onClick={() => updateAttributes({ align: "left" })}
            >
              ←
            </button>
            <button
              type="button"
              title="Center"
              className={align === "center" ? "is-active" : ""}
              onClick={() => updateAttributes({ align: "center" })}
            >
              ↔
            </button>
            <button
              type="button"
              title="Float right"
              className={align === "right" ? "is-active" : ""}
              onClick={() => updateAttributes({ align: "right" })}
            >
              →
            </button>
          </div>
          <div className="wp-resizer-group" title="Size">
            <button type="button" onClick={() => updateAttributes({ width: "25%" })}>S</button>
            <button type="button" onClick={() => updateAttributes({ width: "45%" })}>M</button>
            <button type="button" onClick={() => updateAttributes({ width: "70%" })}>L</button>
            <button type="button" onClick={() => updateAttributes({ width: "100%" })}>Full</button>
            <input
              type="range"
              min="5"
              max="100"
              step="0.5"
              value={widthPct}
              onChange={(e) => updateAttributes({ width: `${e.target.value}%` })}
            />
          </div>
          <button type="button" className="danger" onClick={deleteNode}>
            Remove
          </button>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  name: "image",
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: "70%",
        parseHTML: (element) =>
          element.getAttribute("data-width") ||
          element.style.width ||
          element.getAttribute("width") ||
          "70%",
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          const w = String(attributes.width);
          return {
            "data-width": w,
            style: `width:${w.includes("%") || w.endsWith("px") ? w : `${w}px`};height:auto;max-width:100%;`,
          };
        },
      },
      align: {
        default: "center",
        parseHTML: (element) => {
          const cls = element.getAttribute("class") || "";
          if (cls.includes("alignleft") || cls.includes("align-left")) return "left";
          if (cls.includes("alignright") || cls.includes("align-right")) return "right";
          if (cls.includes("aligncenter") || cls.includes("align-center")) return "center";
          return element.getAttribute("data-align") || "center";
        },
        renderHTML: (attributes) => ({
          "data-align": attributes.align || "center",
          class: `wp-image align${attributes.align || "center"}`,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
