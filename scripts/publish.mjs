import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Git タグ名を取得 (例: "comark-solid@v0.0.2")
const gitTag = process.env.GITHUB_REF_NAME || "";
const targetPackage = gitTag.includes("@") ? gitTag.split("@")[0] : null;

if (targetPackage) {
  console.log(`Targeting package from tag: "${targetPackage}"\n`);
}

// npm に既にバージョンが存在するか確認
function isAlreadyPublished(name, version) {
  try {
    const remote = execSync(`npm view ${name}@${version} version`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return remote === version;
  } catch {
    return false;
  }
}

// packages ディレクトリ内の各パッケージをチェック
const packagesDir = "packages";
const dirs = readdirSync(packagesDir);

let publishedCount = 0;

for (const dir of dirs) {
  const pkgDir = join(packagesDir, dir);
  const pkgPath = join(pkgDir, "package.json");

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  } catch {
    continue; // package.json がないフォルダはスキップ
  }

  const { name, version, private: isPrivate } = pkg;
  if (!name || !version) continue;

  // 1. タグ指定がある場合、対象外のパッケージはスキップ
  if (targetPackage && name !== targetPackage) {
    continue;
  }

  // 2. private パッケージ、または初期状態(0.0.0)はスキップ
  if (isPrivate || version === "0.0.0") {
    console.log(`[skip] ${name} (private or version 0.0.0)`);
    continue;
  }

  // 3. 既に npm に公開済みならスキップ
  console.log(`Checking ${name}@${version}...`);
  if (isAlreadyPublished(name, version)) {
    console.log(`[skip] ${name}@${version} is already published.`);
    continue;
  }

  // 4. パッケージディレクトリ内で安全に publish
  console.log(`🚀 Publishing ${name}@${version}...`);
  execSync("vp pm publish --access public --no-git-checks --provenance", {
    cwd: pkgDir,
    stdio: "inherit",
  });

  publishedCount++;
}

if (publishedCount > 0) {
  console.log(`\n🎉 Successfully published ${publishedCount} package(s).`);
} else {
  console.log("\n✨ No packages needed publishing.");
}
