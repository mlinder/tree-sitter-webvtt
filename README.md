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
      start: (timestamp) end: (timestamp)   ; ":" and "." are child nodes
      (setting name: (setting_name)
        value: (setting_value (setting_part)+))*)  ; line:0,start
    (cue_text                     ; one per line
      dash: (dialogue_dash)       ; – at the start, or after opening tags
      (text) (entity) (timestamp_tag (timestamp))
      (start_tag name: (tag_name) class: (class_name)* annotation: (annotation))
      (end_tag name: (tag_name)))))
```

Tags are flat siblings rather than nested, so a tag closed on a later line
(`<c.a>…` / `…</c>`) doesn't affect how the rest is parsed. The `stylesheet`
node is meant for CSS injection.

Line endings may be LF or CRLF. A lone CR, which the specification also
allows, isn't supported.

Used by the [WebVTT extension for Zed](https://github.com/mlinder/zed-webvtt).
`queries/` has its highlight and CSS injection queries, with Zed's capture
names, for other tree-sitter hosts.

## Use

```sh
npm install tree-sitter-webvtt
```

In Node, with [`tree-sitter`](https://www.npmjs.com/package/tree-sitter)
0.25 or later:

```js
const Parser = require('tree-sitter')
const WebVTT = require('tree-sitter-webvtt')

const parser = new Parser()
parser.setLanguage(WebVTT)
const tree = parser.parse('WEBVTT\n\n00:01.000 --> 00:04.000\nHej!\n')
```

The package ships prebuilt binaries for Linux, macOS and Windows (x64 and
arm64), so installing it compiles nothing.

In browsers, with
[`web-tree-sitter`](https://www.npmjs.com/package/web-tree-sitter) 0.25 or
later, load `tree-sitter-webvtt.wasm`, also in the package. With Vite:

```js
import { Language, Parser, Query } from 'web-tree-sitter'
import wasmUrl from 'tree-sitter-webvtt/tree-sitter-webvtt.wasm?url'
import highlights from 'tree-sitter-webvtt/queries/highlights.scm?raw'

await Parser.init()
const language = await Language.load(wasmUrl)
const query = new Query(language, highlights)
```

`queries/injections.scm` marks `STYLE` blocks as CSS.

## Development

```sh
pnpm install        # also builds the Node binding
pnpm run generate   # regenerate src/ from grammar.js
pnpm test           # corpus tests, examples/, Node binding
pnpm run build:wasm # tree-sitter-webvtt.wasm
```

A `v*` tag builds the binaries and the Wasm file and publishes to npm
(`.github/workflows/release.yml`).

## License

[MIT](LICENSE)
