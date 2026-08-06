"use client";

import dynamic from "next/dynamic";

const TipTapEditor = dynamic(() => import("./TipTapEditor"), {
  ssr: false,
  loading: () => (
    <div className="db-rte db-rte-loading">Loading TipTap editor…</div>
  ),
});

export default function RichTextEditor(props) {
  return <TipTapEditor {...props} />;
}
