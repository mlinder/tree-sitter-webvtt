#include "tree_sitter/parser.h"

#include <stdbool.h>

enum TokenType {
  TIMESTAMP_START,
};

void *tree_sitter_webvtt_external_scanner_create(void) { return NULL; }

void tree_sitter_webvtt_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_webvtt_external_scanner_serialize(void *payload, char *buffer) {
  return 0;
}

void tree_sitter_webvtt_external_scanner_deserialize(void *payload, const char *buffer,
                                                     unsigned length) {}

static unsigned skip_digits(TSLexer *lexer) {
  unsigned count = 0;
  while (lexer->lookahead >= '0' && lexer->lookahead <= '9') {
    lexer->advance(lexer, false);
    count++;
  }
  return count;
}

// Zero-width token before a timestamp of the form [h+:]mm:ss.ttt; the grammar
// lexes the parts.
bool tree_sitter_webvtt_external_scanner_scan(void *payload, TSLexer *lexer,
                                              const bool *valid_symbols) {
  if (!valid_symbols[TIMESTAMP_START]) return false;
  lexer->mark_end(lexer);

  unsigned first = skip_digits(lexer);
  if (first == 0 || lexer->lookahead != ':') return false;
  lexer->advance(lexer, false);
  if (skip_digits(lexer) != 2) return false;

  if (lexer->lookahead == ':') {
    lexer->advance(lexer, false);
    if (skip_digits(lexer) != 2) return false;
  } else if (first != 2) {
    return false;
  }

  if (lexer->lookahead != '.') return false;
  lexer->advance(lexer, false);
  if (skip_digits(lexer) < 3) return false;

  lexer->result_symbol = TIMESTAMP_START;
  return true;
}
