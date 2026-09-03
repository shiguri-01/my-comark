# comark-wikilink

Wikilink syntax plugin for [Comark](https://comark.dev).

This plugin adds support for `[[target]]` and `[[target|label]]` wikilink syntax to Markdown.

It supports two rendering modes:

- `a` mode — renders wikilinks as regular `<a>` elements
- `component` mode — renders wikilinks as `wikilink` components, allowing applications to resolve and render links dynamically

It is in `a` mode by default.

## `a` mode

Use `mode: "a"` to render wikilinks directly as regular links.

```ts
import { parseMarkdown } from "comark";
import wikilink from "comark-wikilink";

const tree = await parseMarkdown("[[docs/getting-started]]", {
  plugins: [wikilink({ mode: "a" })],
});
```

`[[docs/getting-started]]` is rendered as a regular link:

```html
<a href="docs/getting-started">docs/getting-started</a>
```

An explicit label can be provided with `|`:

```md
[[docs/getting-started|Getting started]]
```

which renders as:

```html
<a href="docs/getting-started">Getting started</a>
```

### Configuration

```ts
{
  mode: "a",
  resolveHref?: (target: string) => string | null;
  resolveLabel?: (target: string) => string | null;
}
```

| Option         | Default | Description                                                                                                                            |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `resolveHref`  | `null`  | A function that transforms a wikilink target into the `href` used by the generated `<a>` element. If `null`, the target is used as-is. |
| `resolveLabel` | `null`  | A function that resolves the label displayed for wikilinks that do not specify an explicit label. If `null`, the target is used as-is. |

## `component` mode

Use `mode: "component"` when wikilinks need to be resolved by your application.

```ts
import { parseMarkdown } from "comark";
import wikilink from "comark-wikilink";

const tree = await parseMarkdown("[[getting-started]]", {
  plugins: [wikilink({ mode: "component" })],
});
```

Instead of creating an `<a>` element directly, the plugin produces a `wikilink` node with the wikilink data:

```ts
["wikilink", { target: "getting-started" }];
```

With an explicit label:

```md
[[getting-started|Getting started]]
```

the node contains:

```ts
["wikilink", { target: "getting-started", label: "Getting started" }];
```

This allows the renderer to resolve the target and decide how the wikilink should be displayed.

For example, with React:

```tsx
import { Markdown } from "@comark/react";
import wikilink from "comark-wikilink";

interface WikiLinkProps {
  target: string;
  label?: string;
}

function WikiLink({ target, label }: WikiLinkProps) {
  const page = getPage(target);

  if (!page) {
    return <span>{label ?? target}</span>;
  }

  return <a href={`/wiki/${page.slug}`}>{label ?? page.title}</a>;
}

export default function App() {
  return (
    <Markdown plugins={[wikilink({ mode: "component" })]} components={{ wikilink: WikiLink }}>
      {content}
    </Markdown>
  );
}
```

### Configuration

```ts
{
  mode: "component";
}
```
