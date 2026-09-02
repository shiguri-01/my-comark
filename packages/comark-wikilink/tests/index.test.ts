import { parseMarkdown } from "comark";
import { describe, expect, it } from "vite-plus/test";
import wikilink from "../src/index";

async function parseInline(source: string) {
  const tree = await parseMarkdown(source, {
    plugins: [wikilink({ mode: "component" })],
    autoClose: false, // 不完全な閉じかっこでwikilinkが解釈されないことを確認するため
  });
  return tree.nodes;
}

describe("wikilink plugin", () => {
  it("`[[target]]`をlabel未指定のwikilinkノードに変換する", async () => {
    const nodes = await parseInline("[[target]]");
    expect(nodes).toEqual([["p", {}, ["wikilink", { target: "target" }]]]);
  });

  it("`[[target|label]]`をlabel付きのwikilinkノードに変換する", async () => {
    const nodes = await parseInline("[[target|label]]");
    expect(nodes).toEqual([["p", {}, ["wikilink", { target: "target", label: "label" }]]]);
  });

  it("target, lableの前後の空白を除去する", async () => {
    const nodes = await parseInline("[[ target | label ]]");
    expect(nodes).toEqual([["p", {}, ["wikilink", { target: "target", label: "label" }]]]);
  });

  it("`[[]]`の中身が空の場合はwikilinkだと解釈しない", async () => {
    const nodes1 = await parseInline("[[]]");
    expect(JSON.stringify(nodes1)).not.toContain('"wikilink"');

    const nodes2 = await parseInline("[[ ]]");
    expect(JSON.stringify(nodes2)).not.toContain('"wikilink"');
  });

  it("`[[|label]]`のようにtargetが空の場合はwikilinkだと解釈しない", async () => {
    const nodes = await parseInline("[[|label]]");
    expect(JSON.stringify(nodes)).not.toContain('"wikilink"');
  });

  it("`[[target|]]`のようにlabelが空の場合はwikilinkだと解釈しない", async () => {
    const nodes = await parseInline("[[target|]]");
    expect(JSON.stringify(nodes)).not.toContain('"wikilink"');
  });

  it("閉じ`]]`がない場合はwikilinkだと解釈しない", async () => {
    const nodes = await parseInline("[[target]");
    expect(JSON.stringify(nodes)).not.toContain('"wikilink"');
  });

  it("改行が含まれている場合はwikilinkだと解釈しない", async () => {
    const nodes = await parseInline("[[target\n|label]]");
    expect(JSON.stringify(nodes)).not.toContain('"wikilink"');
  });
});
