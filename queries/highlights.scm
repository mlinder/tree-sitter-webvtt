; Settings and tag names the specification doesn't define get no capture,
; so they show as plain text: typos such as `positon:` or `<cc>` stand out.

; --- Header ---

"WEBVTT" @tag.doctype
(header title: (title) @title)

(metadata name: (metadata_name) @property)
(metadata ["=" ":"] @punctuation.delimiter)
(metadata value: (metadata_value) @string)

; --- Blocks ---

(comment) @comment
["STYLE" "REGION"] @keyword

(cue_identifier) @label

; --- Timing and settings ---

(timestamp) @number
(timestamp [":" "."] @punctuation.delimiter)
"-->" @operator

((cue_timing (setting name: (setting_name) @property))
 (#any-of? @property "vertical" "line" "position" "size" "align" "region"))

((region (setting name: (setting_name) @property))
 (#any-of? @property
   "id" "width" "lines" "regionanchor" "viewportanchor" "scroll"))

(setting ":" @punctuation.delimiter)

; Region names: region:bottom, id:bottom
((setting
   name: (setting_name) @_name
   value: (setting_value) @string)
 (#any-of? @_name "region" "id"))

; Values the spec allows for each setting, in each part (the second part
; follows a comma). Anything else stays plain, like unknown names.

; line:-1, line:50%, line:auto, then ,start / ,center / ,end
((setting
   name: (setting_name) @_name
   value: (setting_value . (setting_part) @number))
 (#eq? @_name "line")
 (#match? @number "^-?[0-9]+(\\.[0-9]+)?%?$"))

((setting
   name: (setting_name) @_name
   value: (setting_value . (setting_part) @constant @variant))
 (#any-of? @_name "line" "position")
 (#eq? @variant "auto"))

((setting
   name: (setting_name) @_name
   value: (setting_value . (setting_part) . (setting_part) @constant @variant))
 (#eq? @_name "line")
 (#any-of? @variant "start" "center" "end"))

; position:10%, position:auto, then ,line-left / ,center / ,line-right
((setting
   name: (setting_name) @_name
   value: (setting_value . (setting_part) . (setting_part) @constant @variant))
 (#eq? @_name "position")
 (#any-of? @variant "line-left" "center" "line-right"))

; Percentages: position:10%, size:50%, width:40%
((setting
   name: (setting_name) @_name
   value: (setting_value . (setting_part) @number))
 (#any-of? @_name "position" "size" "width")
 (#match? @number "^[0-9]+(\\.[0-9]+)?%$"))

; Percentage pairs: regionanchor:0%,100%, viewportanchor:10%,90%
((setting
   name: (setting_name) @_name
   value: (setting_value (setting_part) @number))
 (#any-of? @_name "regionanchor" "viewportanchor")
 (#match? @number "^[0-9]+(\\.[0-9]+)?%$"))

; lines:3
((setting
   name: (setting_name) @_name
   value: (setting_value . (setting_part) @number))
 (#eq? @_name "lines")
 (#match? @number "^[0-9]+$"))

; vertical:rl, align:center, scroll:up
((setting
   name: (setting_name) @_name
   value: (setting_value . (setting_part) @constant @variant))
 (#eq? @_name "vertical")
 (#any-of? @variant "rl" "lr"))

((setting
   name: (setting_name) @_name
   value: (setting_value . (setting_part) @constant @variant))
 (#eq? @_name "align")
 (#any-of? @variant "start" "center" "end" "left" "right"))

((setting
   name: (setting_name) @_name
   value: (setting_value . (setting_part) @constant @variant))
 (#eq? @_name "scroll")
 (#eq? @variant "up"))

(setting_value "," @punctuation.delimiter)

; --- Cue text ---

((start_tag name: (tag_name) @tag)
 (#any-of? @tag "b" "i" "u" "c" "v" "lang" "ruby" "rt"))

((end_tag name: (tag_name) @tag)
 (#any-of? @tag "b" "i" "u" "c" "v" "lang" "ruby" "rt"))

; The spec's built-in color classes, which work without a STYLE block
((start_tag class: (class_name) @constant.builtin)
 (#any-of? @constant.builtin
   "white" "lime" "cyan" "red" "yellow" "magenta" "blue" "black"
   "bg_white" "bg_lime" "bg_cyan" "bg_red" "bg_yellow" "bg_magenta"
   "bg_blue" "bg_black"))

; Author-defined classes, styled by STYLE rules
((start_tag class: (class_name) @attribute)
 (#not-any-of? @attribute
   "white" "lime" "cyan" "red" "yellow" "magenta" "blue" "black"
   "bg_white" "bg_lime" "bg_cyan" "bg_red" "bg_yellow" "bg_magenta"
   "bg_blue" "bg_black"))
(start_tag "." @punctuation.delimiter)

; Speaker (<v Anna>) and language (<lang sv>). Other tags don't take an
; annotation, so it stays plain there.
((start_tag
   name: (tag_name) @_name
   annotation: (annotation) @string)
 (#eq? @_name "v"))

((start_tag
   name: (tag_name) @_name
   annotation: (annotation) @string.special)
 (#eq? @_name "lang"))

; A new speaker's line: –Hej.
(dialogue_dash) @punctuation.list_marker

(start_tag ["<" ">"] @punctuation.bracket)
(end_tag ["</" ">"] @punctuation.bracket)
(timestamp_tag ["<" ">"] @punctuation.bracket)

(entity) @string.escape
