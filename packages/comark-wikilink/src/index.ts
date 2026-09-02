import { defineComarkPlugin, type MarkdownItPlugin } from "comark";
import { type StateInline } from "markdown-exit";

const OPEN = 0x5b; // [
const CLOSE = 0x5d; // ]
const PIPE = 0x7c; // |
const NEWLINE = 0x0a; // \n

/**
 * Configuration for the `a` mode.
 */
type AConfig = {
  mode: "a";

  /**
   * Resolves the `href` attribute from the wikilink target.
   *
   * If omitted, the target is used as-is.
   *
   * @default undefined
   */
  resolveHref?: ((target: string) => string) | undefined;

  /**
   * Resolves the label displayed for the wikilink.
   *
   * This is only used when the wikilink does not specify an explicit label.
   * If omitted, the target is used as the label.
   *
   * @default undefined
   */
  resolveLabel?: ((target: string) => string) | undefined;
};

/**
 * Configuration for the `component` mode.
 */
type ComponentConfig = {
  mode: "component";
};

/**
 * Options for the wikilink plugin.
 *
 * Use `mode: "a"` to render wikilinks as regular `<a>` elements.
 *
 * Use `mode: "component"` to convert wikilinks into a `wikilink` node that can be rendered with a custom component.
 */
export type WikilinkConfig = AConfig | ComponentConfig;

const createWikilinkRule =
  (config: WikilinkConfig) =>
  (state: StateInline, silent: boolean): boolean => {
    const start = state.pos;
    const max = state.posMax;

    // 最低でも [[x]] が必要
    if (start + 4 >= max) return false;

    // [[から始まるか
    if (state.src.charCodeAt(start) !== OPEN) return false;
    if (state.src.charCodeAt(start + 1) !== OPEN) return false;

    let pos = start + 2;
    let pipePos = -1;

    while (pos < max) {
      const code = state.src.charCodeAt(pos);

      // 改行やネストした`[`は wikilink として扱わない
      if (code === NEWLINE || code === OPEN) return false;

      if (code === PIPE && pipePos === -1) {
        pipePos = pos;
      }

      // `]]`を見つけたらwikilink
      if (code === CLOSE && state.src.charCodeAt(pos + 1) === CLOSE) {
        const shouldHaveLabel = pipePos !== -1;

        const target = shouldHaveLabel
          ? state.src.slice(start + 2, pipePos).trim()
          : state.src.slice(start + 2, pos).trim();
        const label = shouldHaveLabel ? state.src.slice(pipePos + 1, pos).trim() : null;

        // targetは必須
        if (!target) return false;
        // `[[target|]]`のように`|`はあるがlabelが空の場合は無効
        if (shouldHaveLabel && !label) return false;

        if (!silent) {
          if (config.mode === "component") {
            // mdc_inline_componentのopen/closeペアとしてpush する。
            state.push("mdc_inline_component", "wikilink", 1);

            const textToken = state.push("text", "", 0);
            textToken.markup = "[[";

            state.push("mdc_inline_component", "wikilink", -1);

            // close直後にmdc_inline_propsを置くと、
            // Comark側がコンポーネントのattrsとして扱ってくれる
            const propsToken = state.push("mdc_inline_props", "", 0);
            propsToken.hidden = true;
            propsToken.attrSet("target", target);
            if (label !== null) {
              propsToken.attrSet("label", label);
            }
          } else if (config.mode === "a") {
            const openToken = state.push("link_open", "a", 1);
            openToken.attrSet("href", config.resolveHref ? config.resolveHref(target) : target);
            openToken.markup = "[[";

            const textToken = state.push("text", "", 0);
            textToken.content =
              label ?? (config.resolveLabel ? config.resolveLabel(target) : target);

            state.push("link_close", "a", -1);
          }
        }

        state.pos = pos + 2;
        return true;
      }

      pos++;
    }

    // `]]`が見つからなかった場合はwikilinkでない
    return false;
  };

/**
 * Wikilinks plugin for Comark.
 *
 * This plugin adds support fot the `[[target]]` and `[[target|label]]` wikilink syntax to Markdown.
 *
 * This plugin allows you to use the `[[target]]` or `[[target|label]]` syntax in your Markdown to create links.
 *
 * In `a` mode, wikilinks are converted directly into regular `a` node.
 *
 * In `component` mode, wikilinks are converted into a `wikilink` node:
 *
 * ```ts
 * ["wikilink", { target: string, label?: string }]
 * ```
 *
 * This allows applications to resolve the target dynamically and render
 * wikilinks using their own components.
 *
 * @example
 * using `a` mode:
 * ```ts
 * import { parseMarkdown } from "comark";
 * import wikilink from "comark-wikilink";
 *
 * const tree = await parseMarkdown("[[target|label]]", {
 *  plugins: [wikilink({ mode: "a" })],
 *  });
 *  ```
 *
 * @example
 * using `component` mode with React:
 *
 * ```tsx
 * import { parseMarkdown } from "comark";
 * import wikilink from "comark-wikilink";
 *
 * interface WikiLinkProps {
 *   target: string;
 *   label?: string;
 * }
 *
 * function WikiLink({ target, label } : WikiLinkProps) {
 *   const page = getPage(target);
 *   const resolvedLabel = label ?? page.title;
 *   const href = `/wiki/${page.slug}`;
 *
 *   return <a href={href}>{resolvedLabel}</a>;
 * }
 *
 * export default function App() {
 *   return(
 *     <Markdown
 *       plugins={[wikilink({ mode: "component" })]}
 *       components={{ wikilink: WikiLink }}
 *     >
 *       {content}
 *     </Markdown>
 *   );
 * }
 *  ```
 */
export default defineComarkPlugin<WikilinkConfig>((config = { mode: "component" }) => {
  const plugin: MarkdownItPlugin = (md) => {
    md.inline.ruler.before("link", "wikilink", createWikilinkRule(config));
  };

  return {
    name: "wikilink",
    markdownItPlugins: [plugin],
  };
});
