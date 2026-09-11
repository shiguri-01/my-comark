# my-comark

> **Archived:** This repository is no longer maintained. The project has been archived and no further development or support is planned.
>
> The `comark-solid` and `comark-wikilink` packages have moved to their own repositories:
> - [`comark-solid`](https://github.com/shiguri-01/comark-solid)
> - [`comark-wikilink`](https://github.com/shiguri-01/comark-wikilink)

A collection of plugins and renderers for [Comark](https://github.com/Comarkdown/comark).

| Package                                         | Description                          |
| :---------------------------------------------- | :----------------------------------- |
| [`comark-solid`](./packages/comark-solid)       | Solid.js renderer for Comark         |
| [`comark-cjk`](./packages/comark-cjk)           | CJK-friendly emphasis parsing plugin |
| [`comark-wikilink`](./packages/comark-wikilink) | Wikilink (`[[...]]`) syntax plugin   |

## Development

This repository is managed with [Vite+](https://viteplus.dev).

### Setup

```bash
vp install
vp config
```

### Common Commands

```bash
vp check
vp run -r test
vp run -r build
```
