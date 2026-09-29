/// <reference types="tree-sitter-cli/dsl" />

/**
 * @file Tree-sitter grammar for WebVTT (Web Video Text Tracks)
 * @author Marcus Linder <mlinder@gmail.com>
 * @license MIT
 * @see https://www.w3.org/TR/webvtt1/
 */

module.exports = grammar({
  name: 'webvtt',

  // Line-based with significant whitespace, so every space and line break
  // is matched explicitly.
  extras: _ => [],

  rules: {
    // Blocks are separated by blank lines, lexed as one _blank token, so a
    // single line break always continues the current block. Each block
    // consumes its own line breaks, including a final one at end of file.
    webvtt: $ => seq(
      // Not allowed by the spec, but a stray blank line at the top shouldn't
      // turn the header into an error while editing.
      optional(/(\r?\n)+/),
      optional('\uFEFF'),
      $.header,
      repeat(seq($._blank, optional($._block))),
    ),

    _newline: _ => /\r?\n/,
    _blank: _ => /\r?\n(\r?\n)+/,
    _ws: _ => /[ \t]+/,

    // WEBVTT[ <title>], then metadata lines such as `Kind: captions` or
    // HLS's `X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000`
    header: $ => seq(
      'WEBVTT',
      optional(seq($._ws, optional(field('title', $.title)))),
      repeat(seq($._newline, optional($.metadata))),
    ),

    title: _ => /[^\r\n]+/,

    metadata: $ => seq(
      field('name', $.metadata_name),
      optional(seq(
        choice(':', '='),
        optional($._ws),
        optional(field('value', $.metadata_value)),
      )),
    ),

    metadata_name: _ => /[^\r\n:=]+/,
    metadata_value: _ => token(prec(-1, /[^\r\n]+/)),

    // Block keywords outrank the cue identifier, which matches any line.
    // Lines that merely start with a keyword (NOTES, STYLE sheet) are
    // matched by _keyword_identifier at the keywords' precedence instead,
    // where the longer match wins.
    _block: $ => choice(
      seq($.comment, optional($._newline)),
      $.style,
      $.region,
      $.cue,
    ),

    // NOTE and its text up to the next blank line
    comment: _ => token(/NOTE([ \t][^\r\n]*)?(\r?\n[^\r\n]+)*/),

    style: $ => seq(
      alias(token(/STYLE[ \t]*/), 'STYLE'),
      optional(seq(
        $._newline,
        optional(seq($.stylesheet, optional($._newline))),
      )),
    ),

    // CSS up to the next blank line
    stylesheet: _ => /[^\r\n]+(\r?\n[^\r\n]+)*/,

    region: $ => seq(
      alias(token(/REGION[ \t]*/), 'REGION'),
      repeat(seq($._newline, optional($._settings))),
    ),

    cue: $ => seq(
      optional(seq(
        field('identifier', choice(
          $.cue_identifier,
          alias($._keyword_identifier, $.cue_identifier),
        )),
        $._newline,
      )),
      field('timing', $.cue_timing),
      repeat(seq($._newline, optional($.cue_text))),
    ),

    cue_identifier: _ => token(prec(-1, /[^\r\n]+/)),

    _keyword_identifier: _ => token(choice(
      /(NOTE|STYLE|REGION)[^ \t\r\n][^\r\n]*/,
      /(STYLE|REGION)[ \t]+[^ \t\r\n][^\r\n]*/,
    )),

    // 00:00:01.000 --> 00:00:04.000 align:start position:10%
    cue_timing: $ => seq(
      field('start', $.timestamp),
      optional($._ws),
      '-->',
      optional($._ws),
      field('end', $.timestamp),
      optional(seq($._ws, optional($._settings))),
    ),

    // The spec requires two or more hour digits when hours are present;
    // one is accepted here so that highlighting survives the typo.
    timestamp: _ => /([0-9]+:)?[0-9][0-9]:[0-9][0-9]\.[0-9][0-9][0-9]/,

    // Space-separated name:value pairs, for both cues and regions
    _settings: $ => seq(
      $.setting,
      repeat(seq($._ws, $.setting)),
      optional($._ws),
    ),

    setting: $ => seq(
      field('name', $.setting_name),
      optional(seq(':', optional(field('value', $.setting_value)))),
    ),

    setting_name: _ => /[^\s:]+/,

    // Comma-separated parts: line:0,start, position:10%,line-left,
    // regionanchor:0%,100%
    setting_value: $ => seq(
      $.setting_part,
      repeat(seq(',', optional($.setting_part))),
    ),

    setting_part: _ => /[^\s,]+/,

    // One line of cue text. Tags are kept flat rather than nested, since
    // unbalanced tags are common and shouldn't break the rest of the line.
    cue_text: $ => repeat1(choice(
      $.text,
      $._ws,
      $.entity,
      // Stray & and < aren't allowed unescaped but are common: a < that
      // can't start a tag (`3 < 4`) is text too.
      alias('&', $.text),
      alias(/<[^a-zA-Z0-9\/\r\n]/, $.text),
      $.start_tag,
      $.end_tag,
      $.timestamp_tag,
    )),

    // Trimmed, so that text around tags joins with single spaces (outline)
    text: _ => /[^<&\s]([^<&\r\n]*[^<&\s])?/,

    entity: _ => /&([a-zA-Z][a-zA-Z0-9]*|#[0-9]+|#[xX][0-9a-fA-F]+);/,

    // <b>, <c.yellow.bg_blue>, <v Speaker>, <lang en-US>
    start_tag: $ => seq(
      '<',
      field('name', $.tag_name),
      repeat(seq('.', field('class', $.class_name))),
      optional(seq($._ws, optional(field('annotation', $.annotation)))),
      '>',
    ),

    end_tag: $ => seq('</', field('name', $.tag_name), '>'),

    // Karaoke-style timestamp inside cue text: <00:00:02.500>
    timestamp_tag: $ => seq('<', $.timestamp, '>'),

    tag_name: _ => /[a-zA-Z][a-zA-Z0-9-]*/,
    class_name: _ => /[^\s.<>&]+/,
    annotation: _ => /[^>\r\n]+/,
  },
});
