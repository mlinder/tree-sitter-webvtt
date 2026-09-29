# tree-sitter-webvtt

[Tree-sitter](https://tree-sitter.github.io/) grammar for
[WebVTT](https://www.w3.org/TR/webvtt1/) (Web Video Text Tracks), the
subtitle and caption format of HTML video and HLS.

It covers the whole file format: the header with metadata lines (such as
HLS's `X-TIMESTAMP-MAP`), `NOTE`, `STYLE` and `REGION` blocks, and cues with
identifiers, settings and cue text markup. It is lenient where real files
are: unbalanced tags, stray `&` and `<`, one-digit hours and extra blank
lines don't cause errors.

## Syntax tree

```
(webvtt
  (header title: (title)          ; WEBVTT Example
    (metadata name: (metadata_name) value: (metadata_value)))
  (comment)                       ; NOTE …
  (style (stylesheet))            ; STYLE and its CSS
  (region (setting …)*)           ; REGION id:… width:…
  (cue
    identifier: (cue_identifier)
    timing: (cue_timing
      start: (timestamp) end: (timestamp)
      (setting name: (setting_name) value: (setting_value))*)
    (cue_text                     ; one per line
      (text) (entity) (timestamp_tag (timestamp))
      (start_tag name: (tag_name) class: (class_name)* annotation: (annotation))
      (end_tag name: (tag_name)))))
```

Tags are flat siblings rather than nested, so a tag closed on a later line
(`<c.a>…` / `…</c>`) doesn't affect how the rest is parsed. The `stylesheet`
node is meant for CSS injection.

Used by the [WebVTT extension for Zed](https://github.com/mlinder/zed-webvtt).

## Development

```sh
pnpm install
pnpm run generate   # regenerate src/ from grammar.js
pnpm test           # corpus tests + error-free parse of examples/
```

## License

[MIT](LICENSE)
