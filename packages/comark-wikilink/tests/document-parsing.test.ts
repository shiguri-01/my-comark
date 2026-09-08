import { parseMarkdown } from "comark";
import { describe, expect, it } from "vite-plus/test";

import wikilink from "../src/index";

describe("リアルなドキュメントパース検証", () => {
  const sampleDocument = `
# プロジェクトドキュメント

このプロジェクトは [[introduction|はじめに]] からスタートしてください。
詳細な仕様は [[docs/specification]] に記載されています。

## 主な機能

* [[features/auth|認証機能]]: OAuth2 と セッション管理
* [[features/editor|エディタ機能]]: Markdown リアルタイムプレビュー
* [[features/plugins]]: プラグイン拡張機構

## 補足と注意

> 注意: 設定の変更を行う前に必ず [[configuration#backup|バックアップ手順]] を確認してください。

関連ページ一覧:
| カテゴリ | リンク |
| :--- | :--- |
| ガイド | [[guides/getting-started\\|入門ガイド]] |
| API | [[api/reference]] |

インラインコード内の \`[[not-a-link]]\` やコードブロック内の wikilink 記法はパースされません:

\`\`\`markdown
[[code-block-example]]
\`\`\`

**[[important|重要な注意事項]]** も太字の中で機能します。
`.trim();

  it("a モードでリアルなドキュメントが正しくパースされ、リンクノードが生成される", async () => {
    const tree = await parseMarkdown(sampleDocument, {
      plugins: [
        wikilink({
          mode: "a",
          resolveHref: (target) => `/wiki/${encodeURI(target)}`,
        }),
      ],
    });

    const jsonStr = JSON.stringify(tree.nodes);

    // 通常のテキストと見出しが存在すること
    expect(jsonStr).toContain("プロジェクトドキュメント");

    // wikilink が a ノードに変換されていること
    // [[introduction|はじめに]] -> href: /wiki/introduction, content: はじめに
    expect(jsonStr).toContain('["a",{"href":"/wiki/introduction"},"はじめに"]');

    // [[docs/specification]] -> href: /wiki/docs/specification, content: docs/specification
    expect(jsonStr).toContain('["a",{"href":"/wiki/docs/specification"},"docs/specification"]');

    // 箇条書き内の wikilink
    expect(jsonStr).toContain('["a",{"href":"/wiki/features/auth"},"認証機能"]');
    expect(jsonStr).toContain('["a",{"href":"/wiki/features/plugins"},"features/plugins"]');

    // blockquote 内のアンカー付きリンク
    expect(jsonStr).toContain('["a",{"href":"/wiki/configuration#backup"},"バックアップ手順"]');

    // テーブル内の wikilink
    expect(jsonStr).toContain('["a",{"href":"/wiki/guides/getting-started"},"入門ガイド"]');
    expect(jsonStr).toContain('["a",{"href":"/wiki/api/reference"},"api/reference"]');

    // 太字内の wikilink
    expect(jsonStr).toContain('["strong",{},["a",{"href":"/wiki/important"},"重要な注意事項"]]');

    // コードスパン・コードブロック内の文字列は wikilink 化されていないこと
    expect(jsonStr).toContain('"[[not-a-link]]"');
    expect(jsonStr).toContain("[[code-block-example]]");
  });

  it("component モードでリアルなドキュメントが正しくパースされ、wikilink ノードが生成される", async () => {
    const tree = await parseMarkdown(sampleDocument, {
      plugins: [wikilink({ mode: "component" })],
    });

    const jsonStr = JSON.stringify(tree.nodes);

    // wikilink コンポーネントノードとして抽出されること
    expect(jsonStr).toContain('["wikilink",{"target":"introduction","label":"はじめに"}]');
    expect(jsonStr).toContain('["wikilink",{"target":"docs/specification"}]');
    expect(jsonStr).toContain('["wikilink",{"target":"features/auth","label":"認証機能"}]');
    expect(jsonStr).toContain(
      '["wikilink",{"target":"configuration#backup","label":"バックアップ手順"}]',
    );

    // コードブロック内は wikilink ノードにならないこと
    expect(jsonStr).not.toContain('{"target":"not-a-link"}');
    expect(jsonStr).not.toContain('{"target":"code-block-example"}');
  });

  it("日本語ターゲットや複雑な文字を含む wikilink も正しく処理できる", async () => {
    const markdown = "日本語ページ: [[設計仕様書#データ構造|第3章 データ構造]]";

    // a モード
    const treeA = await parseMarkdown(markdown, {
      plugins: [
        wikilink({
          mode: "a",
          resolveHref: (target) => `/docs/${encodeURIComponent(target)}`,
        }),
      ],
    });
    expect(JSON.stringify(treeA.nodes)).toContain(
      `["a",{"href":"/docs/${encodeURIComponent("設計仕様書#データ構造")}"},"第3章 データ構造"]`,
    );

    // component モード
    const treeComp = await parseMarkdown(markdown, {
      plugins: [wikilink({ mode: "component" })],
    });
    expect(JSON.stringify(treeComp.nodes)).toContain(
      '["wikilink",{"target":"設計仕様書#データ構造","label":"第3章 データ構造"}]',
    );
  });

  it("1行の中に複数の wikilink が存在する場合も正しく順番通りパースされる", async () => {
    const md = "詳細は [[page-a|ページA]] と [[page-b]]、さらに [[page-c|ページC]] を参照。";
    const tree = await parseMarkdown(md, { plugins: [wikilink({ mode: "a" })] });
    const jsonStr = JSON.stringify(tree.nodes);

    expect(jsonStr).toContain('["a",{"href":"page-a"},"ページA"]');
    expect(jsonStr).toContain('["a",{"href":"page-b"},"page-b"]');
    expect(jsonStr).toContain('["a",{"href":"page-c"},"ページC"]');
  });

  it("カッコや句読点に囲まれた wikilink も正しくパースされる", async () => {
    const md = "（[[note|備考]]）および【[[faq]]】";
    const tree = await parseMarkdown(md, { plugins: [wikilink({ mode: "a" })] });
    const jsonStr = JSON.stringify(tree.nodes);

    expect(jsonStr).toContain("（");
    expect(jsonStr).toContain('["a",{"href":"note"},"備考"]');
    expect(jsonStr).toContain("）および【");
    expect(jsonStr).toContain('["a",{"href":"faq"},"faq"]');
    expect(jsonStr).toContain("】");
  });

  it("未閉じの wikilink や不正なブラケットは通常テキストとして安全にフォールバックされる", async () => {
    const md = "通常の [[unclosed link テキスト と [[[extra-bracket]]] テキスト";
    const tree = await parseMarkdown(md, { plugins: [wikilink({ mode: "a" })] });
    const jsonStr = JSON.stringify(tree.nodes);

    // unclosed link はリンク化（a ノード）されない
    expect(jsonStr).not.toContain('"href":"unclosed link"');
    // [[[extra-bracket]]] は内側の [[extra-bracket]] がリンク化される
    expect(jsonStr).toContain('["a",{"href":"extra-bracket"},"extra-bracket"]');
  });
});
