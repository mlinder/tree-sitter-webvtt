const assert = require("node:assert");
const { test } = require("node:test");

const Parser = require("tree-sitter");

test("can load grammar", () => {
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(require(".")));
});

test("parses a cue", () => {
  const parser = new Parser();
  parser.setLanguage(require("."));
  const tree = parser.parse("WEBVTT\n\n00:00:01.000 --> 00:00:04.000\n–Hej.\n");
  assert.equal(tree.rootNode.hasError, false);
  assert.equal(tree.rootNode.descendantsOfType("dialogue_dash").length, 1);
});
