import { parseMarkdown } from "comark";
import { describe, expect, it } from "vite-plus/test";
import wikilink, { type WikilinkConfig } from "../src/index";

async function parseWithWikilinkComponent(
  source: string,
  config: Omit<Extract<WikilinkConfig, { mode: "component" }>, "mode"> = {},
) {
  const tree = await parseMarkdown(source, {
    plugins: [wikilink({ mode: "component", ...config })],
    autoClose: false, // 不完全な閉じかっこでwikilinkが解釈されないことを確認するため
  });
  return tree.nodes;
}

async function parseWithWikilinkA(
  source: string,
  config: Omit<Extract<WikilinkConfig, { mode: "a" }>, "mode"> = {},
) {
  const tree = await parseMarkdown(source, {
    plugins: [wikilink({ mode: "a", ...config })],
    autoClose: false, // 不完全な閉じかっこでwikilinkが解釈されないことを確認するため
  });
  return tree.nodes;
}

// 比較用
async function parseWithoutWikilink(source: string) {
  const tree = await parseMarkdown(source, { autoClose: false });
  return tree.nodes;
}

describe("component mode", () => {
  it("`[[target]]`をlabel未指定のwikilinkノードに変換する", async () => {
    const nodes = await parseWithWikilinkComponent("[[target]]");
    expect(nodes).toEqual([["p", {}, ["wikilink", { target: "target" }]]]);
  });

  it("`[[target|label]]`をlabel付きのwikilinkノードに変換する", async () => {
    const nodes = await parseWithWikilinkComponent("[[target|label]]");
    expect(nodes).toEqual([["p", {}, ["wikilink", { target: "target", label: "label" }]]]);
  });

  it("target, lableの前後の空白を除去する", async () => {
    const nodes = await parseWithWikilinkComponent("[[ target | label ]]");
    expect(nodes).toEqual([["p", {}, ["wikilink", { target: "target", label: "label" }]]]);
  });

  it("`[[]]`の中身が空の場合はwikilinkだと解釈しない", async () => {
    const nodes1 = await parseWithWikilinkComponent("[[]]");
    expect(JSON.stringify(nodes1)).not.toContain('"wikilink"');

    const nodes2 = await parseWithWikilinkComponent("[[ ]]");
    expect(JSON.stringify(nodes2)).not.toContain('"wikilink"');
  });

  it("`[[|label]]`のようにtargetが空の場合はwikilinkだと解釈しない", async () => {
    const nodes = await parseWithWikilinkComponent("[[|label]]");
    expect(JSON.stringify(nodes)).not.toContain('"wikilink"');
  });

  it("`[[target|]]`のようにlabelが空の場合はwikilinkだと解釈しない", async () => {
    const nodes = await parseWithWikilinkComponent("[[target|]]");
    expect(JSON.stringify(nodes)).not.toContain('"wikilink"');
  });

  it("閉じ`]]`がない場合はwikilinkだと解釈しない", async () => {
    const nodes = await parseWithWikilinkComponent("[[target]");
    expect(JSON.stringify(nodes)).not.toContain('"wikilink"');
  });

  it("改行が含まれている場合はwikilinkだと解釈しない", async () => {
    const nodes = await parseWithWikilinkComponent("[[target\n|label]]");
    expect(JSON.stringify(nodes)).not.toContain('"wikilink"');
  });
});

describe("a mode", () => {
  it("`[[target]]`は`[target](target)`と同じ結果になる", async () => {
    const wikilinkNodes = await parseWithWikilinkA("[[target]]");
    const normalNodes = await parseWithoutWikilink("[target](target)");
    expect(wikilinkNodes).toEqual(normalNodes);
  });

  it("`[[target|label]]`は`[label](target)`と同じ結果になる", async () => {
    const wikilinkNodes = await parseWithWikilinkA("[[target|label]]");
    const normalNodes = await parseWithoutWikilink("[label](target)");
    expect(wikilinkNodes).toEqual(normalNodes);
  });

  it("target, labelの前後の空白を除去したうえで`[label](target)`と同じ結果になる", async () => {
    const wikilinkNodes = await parseWithWikilinkA("[[ target | label ]]");
    const normalNodes = await parseWithoutWikilink("[label](target)");
    expect(wikilinkNodes).toEqual(normalNodes);
  });

  it("resolveHrefが指定されている場合、`[target](resolveHref(target))`と同じ結果になる", async () => {
    const wikilinkNodes = await parseWithWikilinkA("[[target]]", {
      resolveHref: (target) => `/wiki/${target}`,
    });
    const normalNodes = await parseWithoutWikilink("[target](/wiki/target)");
    expect(wikilinkNodes).toEqual(normalNodes);
  });

  it("resolveLabelが指定されている場合、label未指定時は`[resolveLabel(target)](target)`と同じ結果になる", async () => {
    const wikilinkNodes = await parseWithWikilinkA("[[target]]", {
      resolveLabel: (target) => `Page: ${target}`,
    });
    const normalNodes = await parseWithoutWikilink("[Page: target](target)");
    expect(wikilinkNodes).toEqual(normalNodes);
  });

  it("labelが明示されている場合はresolveLabelが呼ばれず、`[label](target)`と同じ結果になる", async () => {
    const wikilinkNodes = await parseWithWikilinkA("[[target|label]]", {
      resolveLabel: (target) => `Page: ${target}`,
    });
    const normalNodes = await parseWithoutWikilink("[label](target)");
    expect(wikilinkNodes).toEqual(normalNodes);
  });

  it("validateLinkに弾かれるhref(javascript:スキーム等)の場合はwikilinkだと解釈しない", async () => {
    const nodes = await parseWithWikilinkA("[[javascript:alert(1)]]");
    expect(JSON.stringify(nodes)).not.toContain("href");
  });
});
