# comark-cjk

A [Comark](https://github.com/Comarkdown/comark) plugin that makes CommonMark's emphasis parsing work correctly with CJK text.

## Usage

```ts
import { parseMarkdown } from "comark";
import cjkPlugin from "comark-cjk";

const document = await parseMarkdown(markdown, {
  plugins: [cjkPlugin()],
});
```

## Why?

CommonMark's delimiter rules for emphasis and strong emphasis do not always work well with Chinese, Japanese, and Korean text.

For example, this Markdown:

```md
ここを**「強調」**したい
```

may not be parsed as strong emphasis because the closing `**` is preceded by CJK punctuation (`」`) and followed by a CJK character.

In CJK writing, punctuation is normally written without surrounding spaces, so this pattern is common.

This plugin applies the CJK-friendly emphasis rules from [`markdown-it-cjk-friendly`](https://github.com/tats-u/markdown-cjk-friendly) to Comark.

## Acknowledgements

This package uses [`markdown-it-cjk-friendly`](https://github.com/tats-u/markdown-cjk-friendly) by tats-u.
