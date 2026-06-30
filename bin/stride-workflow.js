#!/usr/bin/env node

import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const templateDir = path.join(rootDir, "templates", "default");
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const requireFromHere = createRequire(import.meta.url);
const agentsBridgeStart = "<!-- stride-workflow:start -->";
const agentsBridgeEnd = "<!-- stride-workflow:end -->";

const commandNames = ["patch", "spec", "impl", "land", "kit", "review", "mend", "status", "workers"];
const managedInstallRoots = [".stride", ".agents", ".codex"];
const staleManagedPaths = [
  ".agents/skills/stride-touch",
  ".agents/skills/stride-frame",
  ".agents/skills/stride-carry",
  ".agents/skills/stride-land",
  ".agents/skills/stride-kit",
  ".agents/skills/stride-review",
  ".agents/skills/stride-mend",
  ".agents/skills/stride-status",
  ".agents/skills/stride-workers",
  ".stride/commands/touch.md",
  ".stride/commands/frame.md",
  ".stride/commands/carry.md",
  ".codex/agents/stride-builder.toml",
  ".codex/agents/stride-lead.toml",
  ".codex/agents/stride-reviewer.toml",
];
const strideVersionFile = path.join(".stride", "version.txt");
const requiredPaths = [
  ".stride/config.md",
  ".stride/ledger.md",
  ".stride/version.txt",
  ".stride/bin/stride-workflow.mjs",
  ".codex/agents/stridebuilder.toml",
  ".codex/agents/stridelead.toml",
  ".codex/agents/strideuiauditor.toml",
  ".codex/agents/stridereviewer.toml",
  ".agents/skills/stride/SKILL.md",
  ".agents/skills/strideworkers/SKILL.md",
  ".agents/skills/stridepatch/SKILL.md",
  ".agents/skills/stridespec/SKILL.md",
  ".agents/skills/strideimpl/SKILL.md",
  ".agents/skills/strideland/SKILL.md",
  ".agents/skills/stridekit/SKILL.md",
  ".agents/skills/stridereview/SKILL.md",
  ".agents/skills/stridemend/SKILL.md",
  ".agents/skills/stridestatus/SKILL.md",
  ".stride/commands/patch.md",
  ".stride/commands/spec.md",
  ".stride/commands/impl.md",
  ".stride/commands/land.md",
  ".stride/commands/kit.md",
  ".stride/commands/review.md",
  ".stride/commands/mend.md",
  ".stride/commands/status.md",
  ".stride/commands/workers.md",
  ".stride/phases/intake.md",
  ".stride/phases/probe.md",
  ".stride/phases/framer.md",
  ".stride/phases/builder.md",
  ".stride/phases/checker.md",
  ".stride/phases/debugger.md",
  ".stride/phases/reviewer.md",
  ".stride/phases/fixer.md",
  ".stride/phases/worktree.md",
  ".stride/phases/previewer.md",
  ".stride/phases/handoff.md",
  ".stride/phases/ui-auditor.md",
  ".stride/phases/reference-reader.md",
  ".stride/phases/kit-designer.md",
  ".stride/phases/migrator.md",
  ".stride/phases/ledger.md",
  ".stride/phases/workers.md",
];
const commitTypeKeywords = [
  { type: "docs", keywords: ["docs", "documentation", "readme", "guide", "wording", "copy"] },
  { type: "fix", keywords: ["fix", "bug", "error", "broken", "repair", "issue", "skip", "append", "restore"] },
  { type: "feat", keywords: ["add", "new", "create", "implement", "support", "install", "enable", "allow"] },
  { type: "refactor", keywords: ["refactor", "rework", "reshape", "split", "cleanup", "clean up", "refresh", "rename"] },
  { type: "chore", keywords: ["release", "version", "release notes", "release release", "publish", "package", "dependency"] },
];

function usage() {
  return `stride-workflow

Usage:
  stride-workflow init [path] [--force] [--no-codex] [--yes]
  stride-workflow refresh [path] [--no-codex] [--yes]
  stride-workflow command <patch|spec|impl|land|kit|review|mend|status|workers>
  stride-workflow <patch|spec|impl|land|kit|review|mend|status|workers>
  stride-workflow worktree <create|status|assert|cleanup> [slug-or-path]
  stride-workflow workers [path]
  stride-workflow subject [path]
  stride-workflow status [path]
  stride-workflow doctor [path]
  stride-workflow version
  stride-workflow --help

Commands:
  init     Install or refresh .stride workflow files in a project.
  refresh  Remove managed Stride files and reinstall the current release.
  command  Print the instructions for one Stride Workflow command.
  worktree Create, inspect, assert, or clean up the active Stride worktree.
  workers  Print the worker policy for token-aware execution.
  subject  Suggest a conventional commit subject from the active spec and handoff.
  doctor   Check whether a project has the expected Stride Workflow files.
  status   Show the current handoff, spec, and ledger for a project.
  version  Print the Stride Workflow CLI version.
`;
}

function fail(message) {
  console.error(`stride-workflow: ${message}`);
  process.exit(1);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function parseVersion(version) {
  return version.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function readInstalledStrideVersion(projectDir) {
  const filePath = path.join(projectDir, strideVersionFile);
  if (!fs.existsSync(filePath)) return null;
  const version = fs.readFileSync(filePath, "utf8").trim();
  return version || null;
}

function writeInstalledStrideVersion(projectDir) {
  const filePath = path.join(projectDir, strideVersionFile);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${packageJson.version}\n`);
}

function checkPlaywrightAvailability() {
  try {
    const playwright = requireFromHere("playwright");
    const executablePath = playwright.chromium?.executablePath?.();
    if (!executablePath || !fs.existsSync(executablePath)) {
      return "missing Playwright Chromium browser binary required for strideuiauditor";
    }
    return null;
  } catch {
    return "missing playwright dependency required for strideuiauditor";
  }
}

function printPlaywrightStatus() {
  const problem = checkPlaywrightAvailability();
  if (problem) {
    console.log(`Playwright status: blocked (${problem})`);
    return;
  }

  const playwright = requireFromHere("playwright");
  const version = playwright?.version ?? packageJson.dependencies?.playwright ?? "available";
  console.log(`Playwright status: ready (${version})`);
}

function collectDirChanges(srcDir, destDir, options, changes = []) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      collectDirChanges(srcPath, destPath, options, changes);
      continue;
    }

    const nextContent = fs.readFileSync(srcPath);
    const existed = fs.existsSync(destPath);

    if (existed) {
      const currentContent = fs.readFileSync(destPath);
      if (!options.force && currentContent.equals(nextContent)) {
        continue;
      }
    }

    changes.push({
      action: existed ? "update" : "write",
      relPath: path.relative(options.cwd, destPath),
      srcPath,
      destPath,
    });
  }

  return changes;
}

function applyDirChanges(changes, options) {
  for (const change of changes) {
    ensureDir(path.dirname(change.destPath));
    fs.writeFileSync(change.destPath, fs.readFileSync(change.srcPath));
    console.log(`${change.action} ${change.relPath}`);
  }
}

function collectTemplateFiles(srcDir, relBase = "") {
  const files = [];

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const relPath = path.join(relBase, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectTemplateFiles(srcPath, relPath));
    } else {
      files.push(relPath);
    }
  }

  return files;
}

function collectManagedResetChanges(projectDir, includeCodex) {
  const changes = [];
  for (const root of managedInstallRoots) {
    if (root === ".codex" && !includeCodex) continue;
    if (root === ".agents" || root === ".codex") {
      const target = path.join(projectDir, root);
      if (fs.existsSync(target)) {
        changes.push({ action: "delete", relPath: root, target });
      }
      continue;
    }

    const templateRoot = path.join(templateDir, root);
    const rootFiles = collectTemplateFiles(templateRoot).map((relPath) => path.join(root, relPath));

    for (const relPath of rootFiles) {
      const target = path.join(projectDir, relPath);
      if (fs.existsSync(target)) {
        changes.push({ action: "delete", relPath, target });
      }
    }
  }

  return changes;
}

function collectStaleManagedChanges(projectDir) {
  return staleManagedPaths
    .map((relPath) => ({ action: "delete", relPath, target: path.join(projectDir, relPath) }))
    .filter((change) => fs.existsSync(change.target));
}

function applyStaleManagedChanges(changes) {
  for (const change of changes) {
    fs.rmSync(change.target, { recursive: true, force: true });
    console.log(`delete ${change.relPath}`);
  }
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .replace(/[`*_>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkdownLine(line) {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\-\s+/, "")
    .replace(/^\*\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/`/g, "")
    .trim();
}

function cleanSubjectText(text) {
  return stripMarkdownLine(text)
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim();
}

function getFirstNonEmptyLine(text) {
  for (const rawLine of text.split(/\r?\n/)) {
    const line = cleanSubjectText(rawLine);
    if (!line) continue;
    if (/^---$/.test(line)) continue;
    if (/^(status|active worktree path|active branch|preview url|what changed|what you should check manually|commands\/checks that passed|known risks or untested areas|next command|goal|repo facts discovered|files, routes, apis, tables, or services likely affected|implementation steps|acceptance checks|risks|blocking questions)$/i.test(line)) {
      continue;
    }
    return line;
  }
  return "";
}

function extractTopic(text) {
  const content = text ?? "";
  const patterns = [
    /(?:^|\n)\s*goal\s*[:\-]\s*(.+)$/im,
    /(?:^|\n)\s*what changed\s*[:\-]\s*(.+)$/im,
    /(?:^|\n)\s*summary\s*[:\-]\s*(.+)$/im,
    /(?:^|\n)\s*task\s*[:\-]\s*(.+)$/im,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      const candidate = cleanSubjectText(match[1]);
      if (candidate) return candidate;
    }
  }

  const headingMatch = content.match(/^#{1,3}\s+(.+)$/m);
  if (headingMatch?.[1]) {
    const candidate = cleanSubjectText(headingMatch[1]);
    if (candidate) return candidate;
  }

  const bullet = content.match(/^[\-\*]\s+(.+)$/m);
  if (bullet?.[1]) {
    const candidate = cleanSubjectText(bullet[1]);
    if (candidate) return candidate;
  }

  return cleanSubjectText(getFirstNonEmptyLine(content));
}

function detectCommitType(text) {
  const normalized = normalizeText(text);
  for (const entry of commitTypeKeywords) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.type;
    }
  }
  return "feat";
}

function inferCommitSubject(projectDir) {
  const specPath = path.join(projectDir, ".stride", "specs", "current.md");
  const runPath = path.join(projectDir, ".stride", "runs", "current.md");

  const specText = fs.existsSync(specPath) ? fs.readFileSync(specPath, "utf8") : "";
  const runText = fs.existsSync(runPath) ? fs.readFileSync(runPath, "utf8") : "";
  const primaryText = specText || runText;
  const combinedText = [primaryText, runText].filter(Boolean).join("\n\n");

  if (!combinedText) {
    fail(`no active spec or run found at ${path.join(projectDir, ".stride", "specs", "current.md")} or ${runPath}`);
  }

  const topic = extractTopic(primaryText || combinedText);
  const type = detectCommitType(primaryText || combinedText);
  return `${type}: ${topic}`;
}

function parseChangelogSections(changelogText) {
  const sections = [];
  const lines = changelogText.split(/\r?\n/);
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    current.body = current.body
      .map((line) => line.replace(/\s+$/u, ""))
      .filter((line, index, list) => !(line === "" && list[index - 1] === ""));
    sections.push(current);
  };

  for (const line of lines) {
    const match = line.match(/^## \[(\d+\.\d+\.\d+)\] - (.+)$/);
    if (match) {
      pushCurrent();
      current = { version: match[1], date: match[2], body: [] };
      continue;
    }

    if (current) {
      current.body.push(line);
    }
  }

  pushCurrent();
  return sections;
}

function collectSectionBullets(lines) {
  const bullets = [];
  let current = "";

  for (const line of lines) {
    if (/^### /.test(line)) continue;
    if (/^\s*-\s+/.test(line)) {
      if (current) bullets.push(current);
      current = line.replace(/^\s*-\s+/, "").trim();
      continue;
    }
    if (current && line.trim()) {
      current += ` ${line.trim()}`;
      continue;
    }
    if (current && !line.trim()) {
      bullets.push(current);
      current = "";
    }
  }

  if (current) bullets.push(current);
  return bullets;
}

function summarizeStrideUpdates(installedVersion) {
  const changelogText = fs.readFileSync(path.join(rootDir, "CHANGELOG.md"), "utf8");
  const sections = parseChangelogSections(changelogText);
  const newerSections = installedVersion
    ? sections.filter((section) => compareVersions(section.version, installedVersion) > 0)
    : sections.slice(0, 3);

  if (newerSections.length === 0) {
    return `Stride is already at ${packageJson.version}. This run will refresh the installed Stride files from the current release.\n`;
  }

  const lines = [];
  const label = installedVersion ? `Stride updates since ${installedVersion}:` : "Latest Stride updates:";
  lines.push(label);

  for (const section of newerSections.slice(0, 4)) {
    const bullets = collectSectionBullets(section.body).slice(0, 3);
    lines.push(`- ${section.version} (${section.date})`);
    for (const bullet of bullets) {
      lines.push(`  - ${bullet}`);
    }
  }

  if (newerSections.length > 4) {
    lines.push(`  - ...and ${newerSections.length - 4} more release(s). See CHANGELOG.md.`);
  }

  return `${lines.join("\n")}\n`;
}

function copyDir(src, dest, options) {
  ensureDir(dest);

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, options);
      continue;
    }

    syncFile(srcPath, destPath, options);
  }
}

function buildCodexBridge() {
  return [
    agentsBridgeStart,
    "# Stride Workflow",
    "",
    "This repo uses Stride Workflow, an adaptive-depth workflow for Codex.",
    "",
    "Before substantial work:",
    "",
    "- Read .stride/config.md.",
    "- Route $stride commands through .stride/commands/.",
    "- Use .stride/phases/ for internal phase behavior.",
    "- Announce the active Stride phase before doing it.",
    "- Use `node .stride/bin/stride-workflow.mjs ...` as the repo-local Stride runner.",
    "- If the Stride runner is missing or fails, stop and ask the user to update Stride. Do not fall back to raw git worktree commands.",
    "- Do not edit application files until the Stride runner's `worktree assert` passes for the active Stride worktree.",
    "- Treat the main chat as orchestrator for patch, impl, and land.",
    "- If the main chat has spawned `stridebuilder` for a scoped change, it must stop writing files for that scope and only coordinate, verify, and hand off.",
    "- Spawn or use stridebuilder for patch and impl implementation work.",
    "- Use stridelead as the read-only recon worker when extra repo facts are needed.",
    "- Use strideuiauditor as the read-only visual auditor for user-facing or layout-sensitive work before preview and handoff. It should inspect the live UI with Playwright when a route is available.",
    "- Spawn or use stridereviewer during patch, impl, and land before handoff.",
    "- If a builder or reviewer result stalls, do not take over the edit or review in the main chat; either ask for a blocking report or spawn another worker when the chosen mode justifies it.",
    "- Use .stride/runs/current.md for the latest manual-test handoff when it exists.",
    "- Use .stride/ledger.md for durable project facts.",
    "- Update the ledger when a discovery should survive future turns.",
    "- Do not finish patch, impl, or land without a handoff card that says what changed, what to verify in the running app, and the next command.",
    "",
    "Primary loop: $stride spec -> approval -> $stride impl -> ui audit if visual -> manual test -> $stride land.",
    "Small no-spec changes can use $stride patch.",
    "UI consistency and screenshot-inspired frontend work can use $stride kit ui.",
    agentsBridgeEnd,
  ].join("\n");
}

function upsertCodexBridge(existingContent) {
  const bridge = buildCodexBridge();
  const existingStart = existingContent.indexOf(agentsBridgeStart);
  const existingEnd = existingContent.indexOf(agentsBridgeEnd);

  if (existingStart !== -1 && existingEnd !== -1 && existingEnd >= existingStart) {
    return existingContent.replace(
      new RegExp(`\\n?${agentsBridgeStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${agentsBridgeEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "m"),
      `\n${bridge}\n`,
    );
  }

  const separator = existingContent.length === 0 ? "" : existingContent.endsWith("\n") ? "\n" : "\n\n";
  return `${existingContent}${separator}${bridge}\n`;
}

function collectCodexBridgeChange(projectDir) {
  const target = path.join(projectDir, "AGENTS.md");
  const existed = fs.existsSync(target);
  const currentBody = existed ? fs.readFileSync(target, "utf8") : "";
  const nextBody = existed ? upsertCodexBridge(currentBody) : `${buildCodexBridge()}\n`;

  if (currentBody === nextBody) {
    return null;
  }

  return {
    action: existed ? "update" : "write",
    relPath: path.relative(projectDir, target) || "AGENTS.md",
    target,
    nextBody,
    existed,
  };
}

function applyCodexBridgeChange(change) {
  fs.writeFileSync(change.target, change.nextBody);
  console.log(`${change.action} ${change.relPath}`);
}

function hasExistingStride(projectDir) {
  return fs.existsSync(path.join(projectDir, ".stride")) || fs.existsSync(path.join(projectDir, ".agents")) || fs.existsSync(path.join(projectDir, ".codex")) || fs.existsSync(path.join(projectDir, "AGENTS.md"));
}

async function confirmUpdate(projectDir, summary) {
  process.stdout.write(`Stride Workflow updates available in ${projectDir}\n`);
  process.stdout.write(summary);

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    process.stdout.write("Non-interactive session detected; applying updates.\n");
    return true;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question("Update existing Stride install? [y/N] ")).trim().toLowerCase();
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

async function initProject(args) {
  const force = args.includes("--force");
  const noCodex = args.includes("--no-codex");
  const reinstall = args.includes("--reinstall");
  const yes = args.includes("--yes");
  const cleanArgs = args.filter((arg) => !arg.startsWith("--"));
  const projectDir = path.resolve(cleanArgs[0] ?? process.cwd());

  if (!fs.existsSync(templateDir)) {
    fail(`missing template directory: ${templateDir}`);
  }

  const existingStride = hasExistingStride(projectDir);
  const installedVersion = readInstalledStrideVersion(projectDir);
  const managedDeletes = reinstall ? collectManagedResetChanges(projectDir, !noCodex) : [];
  const strideChanges = collectDirChanges(path.join(templateDir, ".stride"), path.join(projectDir, ".stride"), {
    cwd: projectDir,
    force: force || reinstall,
  });
  const agentChanges = noCodex
    ? []
    : collectDirChanges(path.join(templateDir, ".agents"), path.join(projectDir, ".agents"), {
        cwd: projectDir,
        force: force || reinstall,
  });
  const codexChanges = noCodex
    ? []
    : collectDirChanges(path.join(templateDir, ".codex"), path.join(projectDir, ".codex"), {
        cwd: projectDir,
        force: force || reinstall,
      });
  const staleChanges = collectStaleManagedChanges(projectDir);
  const bridgeChange = noCodex ? null : collectCodexBridgeChange(projectDir);
  const changes = [...managedDeletes, ...strideChanges, ...agentChanges, ...codexChanges, ...staleChanges, ...(bridgeChange ? [bridgeChange] : [])];
  const needsVersionUpdate = installedVersion !== packageJson.version;
  const shouldPrompt = existingStride && (changes.length > 0 || needsVersionUpdate || reinstall) && !yes && !force;

  if (shouldPrompt) {
    const summary = reinstall
      ? `${summarizeStrideUpdates(installedVersion)}\nThis will remove and reinstall the managed Stride files before writing the current release.\n`
      : summarizeStrideUpdates(installedVersion);
    const shouldUpdate = await confirmUpdate(projectDir, summary);
    if (!shouldUpdate) {
      console.log("Skipped updating existing Stride install.");
      return;
    }
  }

  ensureDir(projectDir);
  applyStaleManagedChanges(managedDeletes);
  applyStaleManagedChanges(staleChanges);
  ensureDir(path.join(projectDir, ".stride"));
  applyDirChanges(strideChanges, {
    cwd: projectDir,
    force: force || reinstall,
  });
  if (!noCodex) {
    ensureDir(path.join(projectDir, ".agents"));
    applyDirChanges(agentChanges, {
      cwd: projectDir,
      force: force || reinstall,
    });
    ensureDir(path.join(projectDir, ".codex"));
    applyDirChanges(codexChanges, {
      cwd: projectDir,
      force: force || reinstall,
    });

    if (bridgeChange) {
      applyCodexBridgeChange(bridgeChange);
    }
  }

  writeInstalledStrideVersion(projectDir);

  console.log("");
  console.log(`Stride Workflow initialized in ${projectDir}`);
  console.log(`Stride UI auditor: ${checkPlaywrightAvailability() ? "blocked" : "ready"}`);
  printPlaywrightStatus();
}

async function refreshProject(args) {
  await initProject([...args, "--reinstall"]);
}

function printCommand(args) {
  const commandName = args[0];

  if (!commandNames.includes(commandName)) {
    fail(`expected command to be one of: ${commandNames.join(", ")}`);
  }

  const file = path.join(templateDir, ".stride", "commands", `${commandName}.md`);
  process.stdout.write(fs.readFileSync(file, "utf8"));
}

function printCommandByName(commandName) {
  printCommand([commandName]);
}

function showStatus(args) {
  const projectDir = path.resolve(args[0] ?? process.cwd());
  const ledger = path.join(projectDir, ".stride", "ledger.md");
  const run = path.join(projectDir, ".stride", "runs", "current.md");
  const spec = path.join(projectDir, ".stride", "specs", "current.md");

  if (!fs.existsSync(ledger)) {
    fail(`no Stride Workflow ledger found at ${ledger}. Run "stride-workflow init" first.`);
  }

  if (fs.existsSync(run)) {
    process.stdout.write(fs.readFileSync(run, "utf8"));
    process.stdout.write("\n\n---\n\n");
  }

  if (fs.existsSync(spec)) {
    process.stdout.write(fs.readFileSync(spec, "utf8"));
    process.stdout.write("\n\n---\n\n");
  }

  process.stdout.write(fs.readFileSync(ledger, "utf8"));
}

function runGit(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function tryRunGit(args, cwd) {
  try {
    return runGit(args, cwd);
  } catch {
    return null;
  }
}

function resolveGitRoot(startDir) {
  const root = tryRunGit(["rev-parse", "--show-toplevel"], startDir);
  if (!root) fail(`not inside a git repository: ${startDir}`);
  return root;
}

function resolveStrideProjectDir(gitRoot) {
  const marker = `${path.sep}.stride${path.sep}worktrees${path.sep}`;
  const markerIndex = gitRoot.indexOf(marker);
  return markerIndex === -1 ? gitRoot : gitRoot.slice(0, markerIndex);
}

function currentBranch(cwd) {
  return tryRunGit(["branch", "--show-current"], cwd) || "(detached)";
}

function sanitizeSlug(value) {
  const slug = (value || "stride-work")
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "")
    .replace(/\/+/g, "-")
    .slice(0, 80);
  return slug || "stride-work";
}

function parseWorktrees(output) {
  const worktrees = [];
  let current = null;

  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) {
      if (current) worktrees.push(current);
      current = null;
      continue;
    }

    const [key, ...rest] = line.split(" ");
    const value = rest.join(" ");
    if (key === "worktree") {
      if (current) worktrees.push(current);
      current = { path: value, branch: "(unknown)" };
    } else if (current && key === "branch") {
      current.branch = value.replace(/^refs\/heads\//, "");
    }
  }

  if (current) worktrees.push(current);
  return worktrees;
}

function listGitWorktrees(projectDir) {
  return parseWorktrees(runGit(["worktree", "list", "--porcelain"], projectDir));
}

function findWorktreeByBranch(projectDir, branch) {
  return listGitWorktrees(projectDir).find((entry) => entry.branch === branch) || null;
}

function readActiveRunWorktree(projectDir) {
  const runPath = path.join(projectDir, ".stride", "runs", "current.md");
  if (!fs.existsSync(runPath)) return null;
  const text = fs.readFileSync(runPath, "utf8");
  const worktreeMatch = text.match(/active worktree path\s*:\s*(.+)$/im);
  const branchMatch = text.match(/active branch\s*:\s*(.+)$/im);
  if (!worktreeMatch?.[1]) return null;
  return {
    path: worktreeMatch[1].trim(),
    branch: branchMatch?.[1]?.trim() || currentBranch(worktreeMatch[1].trim()),
  };
}

function writeActiveRunWorktree(projectDir, worktreePath, branch) {
  const runDir = path.join(projectDir, ".stride", "runs");
  ensureDir(runDir);
  const runPath = path.join(runDir, "current.md");
  const existing = fs.existsSync(runPath) ? fs.readFileSync(runPath, "utf8").trim() : "";
  const block = [
    "Status: Worktree ready",
    `Active worktree path: ${worktreePath}`,
    `Active branch: ${branch}`,
    "Worker mode used: pending",
    "Reviewer worker result: pending",
    "Next command: continue the current Stride phase from the active worktree",
  ].join("\n");
  fs.writeFileSync(runPath, existing ? `${block}\n\n---\n\n${existing}\n` : `${block}\n`);
}

function resolveBaseBranch(projectDir) {
  const current = currentBranch(projectDir);
  if (current === "main" || current === "master") return current;
  const mainExists = tryRunGit(["rev-parse", "--verify", "main"], projectDir);
  if (mainExists) return "main";
  const masterExists = tryRunGit(["rev-parse", "--verify", "master"], projectDir);
  if (masterExists) return "master";
  return "HEAD";
}

function printWorktreeStatus(projectDir, worktreePath, branch) {
  const runnerPath = path.join(projectDir, ".stride", "bin", "stride-workflow.mjs");
  console.log(`Project: ${projectDir}`);
  console.log(`Stride runner: node ${runnerPath}`);
  console.log(`Active worktree path: ${worktreePath}`);
  console.log(`Active branch: ${branch}`);
  console.log(`On main/master: ${branch === "main" || branch === "master" ? "yes" : "no"}`);
}

function createStrideWorktree(args) {
  const projectDir = resolveStrideProjectDir(resolveGitRoot(process.cwd()));
  const slug = sanitizeSlug(args[0]);
  const branch = `stride/${slug}`;
  const worktreePath = path.join(projectDir, ".stride", "worktrees", slug);
  const existing = findWorktreeByBranch(projectDir, branch);

  ensureDir(path.dirname(worktreePath));

  if (existing) {
    writeActiveRunWorktree(projectDir, existing.path, existing.branch);
    printWorktreeStatus(projectDir, existing.path, existing.branch);
    return;
  }

  if (fs.existsSync(worktreePath)) {
    fail(`worktree path already exists but is not registered for ${branch}: ${worktreePath}`);
  }

  const baseBranch = resolveBaseBranch(projectDir);
  runGit(["worktree", "add", worktreePath, "-b", branch, baseBranch], projectDir);
  writeActiveRunWorktree(projectDir, worktreePath, branch);
  printWorktreeStatus(projectDir, worktreePath, branch);
}

function statusStrideWorktree(args) {
  const currentRoot = resolveGitRoot(process.cwd());
  const projectDir = resolveStrideProjectDir(currentRoot);
  const target = args[0] ? path.resolve(args[0]) : null;
  const active = target
    ? { path: target, branch: currentBranch(target) }
    : readActiveRunWorktree(projectDir) || { path: currentRoot, branch: currentBranch(currentRoot) };
  printWorktreeStatus(projectDir, active.path, active.branch);
}

function assertStrideWorktree(args) {
  const projectDir = resolveStrideProjectDir(resolveGitRoot(process.cwd()));
  const target = args[0] ? path.resolve(args[0]) : process.cwd();
  const branch = currentBranch(target);
  const root = resolveGitRoot(target);
  const isMain = branch === "main" || branch === "master";
  const isStrideWorktree = root.includes(`${path.sep}.stride${path.sep}worktrees${path.sep}`);

  printWorktreeStatus(projectDir, root, branch);

  if (isMain) {
    fail("refusing to continue from main/master; run `node .stride/bin/stride-workflow.mjs worktree create <slug>` from the main checkout and continue from the printed worktree");
  }

  if (!isStrideWorktree) {
    fail(`not inside a Stride worktree under .stride/worktrees: ${root}`);
  }
}

function cleanupStrideWorktree(args) {
  const projectDir = resolveStrideProjectDir(resolveGitRoot(process.cwd()));
  const deleteBranch = args.includes("--delete-branch");
  const cleanArgs = args.filter((arg) => arg !== "--delete-branch");
  const active = cleanArgs[0]
    ? { path: path.resolve(cleanArgs[0]), branch: currentBranch(path.resolve(cleanArgs[0])) }
    : readActiveRunWorktree(projectDir);

  if (!active?.path) {
    fail("no active Stride worktree found; pass a worktree path or run from a repo with .stride/runs/current.md");
  }

  const worktreeRoot = resolveGitRoot(active.path);
  const branch = active.branch || currentBranch(worktreeRoot);
  const isMain = branch === "main" || branch === "master";
  const isStrideWorktree = worktreeRoot.includes(`${path.sep}.stride${path.sep}worktrees${path.sep}`);

  if (isMain) {
    fail("refusing to remove a main/master worktree");
  }
  if (!isStrideWorktree) {
    fail(`refusing to remove non-Stride worktree: ${worktreeRoot}`);
  }

  runGit(["worktree", "remove", worktreeRoot], projectDir);
  console.log(`removed worktree ${worktreeRoot}`);

  if (deleteBranch) {
    runGit(["branch", "-d", branch], projectDir);
    console.log(`deleted branch ${branch}`);
  } else {
    console.log(`kept branch ${branch}`);
  }
}

function worktree(args) {
  const action = args[0];
  const rest = args.slice(1);

  switch (action) {
    case "create":
      createStrideWorktree(rest);
      break;
    case "status":
      statusStrideWorktree(rest);
      break;
    case "assert":
      assertStrideWorktree(rest);
      break;
    case "cleanup":
      cleanupStrideWorktree(rest);
      break;
    default:
      fail("expected worktree action to be one of: create, status, assert, cleanup");
  }
}

function doctor(args) {
  const projectDir = path.resolve(args[0] ?? process.cwd());
  const missing = requiredPaths.filter((requiredPath) => {
    return !fs.existsSync(path.join(projectDir, requiredPath));
  });
  const installedVersion = readInstalledStrideVersion(projectDir);
  const problems = [...missing.map((missingPath) => `missing ${missingPath}`)];
  const playwrightProblem = checkPlaywrightAvailability();

  if (playwrightProblem) {
    problems.push(playwrightProblem);
  }

  if (installedVersion && installedVersion !== packageJson.version) {
    problems.push(`installed version ${installedVersion} does not match CLI version ${packageJson.version}`);
  }

  if (problems.length === 0) {
    console.log(`Stride Workflow looks ready in ${projectDir}`);
    return;
  }

  console.log(`Stride Workflow is incomplete in ${projectDir}`);
  console.log("");
  for (const problem of problems) {
    console.log(problem);
  }
  process.exitCode = 1;
}

function version() {
  console.log(packageJson.version);
}

function suggestSubject(args) {
  const projectDir = path.resolve(args[0] ?? process.cwd());
  process.stdout.write(`${inferCommitSubject(projectDir)}\n`);
}

const [, , command, ...args] = process.argv;

async function main() {
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(usage());
    process.exit(0);
  }

  switch (command) {
    case "init":
      await initProject(args);
      break;
    case "refresh":
      await refreshProject(args);
      break;
    case "command":
      printCommand(args);
      break;
    case "worktree":
      worktree(args);
      break;
    case "doctor":
      doctor(args);
      break;
    case "status":
      showStatus(args);
      break;
    case "subject":
      suggestSubject(args);
      break;
    case "version":
    case "--version":
    case "-v":
      version();
      break;
    case "patch":
    case "spec":
    case "impl":
    case "land":
    case "kit":
    case "review":
    case "mend":
    case "workers":
      printCommandByName(command);
      break;
    default:
      fail(`unknown command "${command}"\n\n${usage()}`);
  }
}

await main();
