#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const templateDir = path.join(rootDir, "templates", "default");
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const agentsBridgeStart = "<!-- stride-workflow:start -->";
const agentsBridgeEnd = "<!-- stride-workflow:end -->";

const commandNames = ["touch", "frame", "carry", "land", "kit", "review", "mend", "status", "workers"];
const strideVersionFile = path.join(".stride", "version.txt");
const requiredPaths = [
  ".stride/config.md",
  ".stride/ledger.md",
  ".stride/version.txt",
  ".agents/skills/stride/SKILL.md",
  ".agents/skills/stride-workers/SKILL.md",
  ".agents/skills/stride-touch/SKILL.md",
  ".agents/skills/stride-frame/SKILL.md",
  ".agents/skills/stride-carry/SKILL.md",
  ".agents/skills/stride-land/SKILL.md",
  ".agents/skills/stride-kit/SKILL.md",
  ".agents/skills/stride-review/SKILL.md",
  ".agents/skills/stride-mend/SKILL.md",
  ".agents/skills/stride-status/SKILL.md",
  ".stride/commands/touch.md",
  ".stride/commands/frame.md",
  ".stride/commands/carry.md",
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
  stride-workflow command <touch|frame|carry|land|kit|review|mend|status|workers>
  stride-workflow <touch|frame|carry|land|kit|review|mend|status|workers>
  stride-workflow workers [path]
  stride-workflow subject [path]
  stride-workflow status [path]
  stride-workflow doctor [path]
  stride-workflow version
  stride-workflow --help

Commands:
  init     Install or refresh .stride workflow files in a project.
  command  Print the instructions for one Stride Workflow command.
  workers  Print the worker policy for token-aware execution.
  subject  Suggest a conventional commit subject from the active frame and handoff.
  doctor   Check whether a project has the expected Stride Workflow files.
  status   Show the current handoff, frame, and ledger for a project.
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
  const framePath = path.join(projectDir, ".stride", "frames", "current.md");
  const runPath = path.join(projectDir, ".stride", "runs", "current.md");

  const frameText = fs.existsSync(framePath) ? fs.readFileSync(framePath, "utf8") : "";
  const runText = fs.existsSync(runPath) ? fs.readFileSync(runPath, "utf8") : "";
  const primaryText = frameText || runText;
  const combinedText = [primaryText, runText].filter(Boolean).join("\n\n");

  if (!combinedText) {
    fail(`no active frame or run found at ${path.join(projectDir, ".stride", "frames", "current.md")} or ${runPath}`);
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
    "- Use .stride/runs/current.md for the latest manual-test handoff when it exists.",
    "- Use .stride/ledger.md for durable project facts.",
    "- Update the ledger when a discovery should survive future turns.",
    "",
    "Primary loop: $stride frame -> approval -> $stride carry -> manual test -> $stride land.",
    "Tiny changes can use $stride touch.",
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
  return fs.existsSync(path.join(projectDir, ".stride")) || fs.existsSync(path.join(projectDir, ".agents")) || fs.existsSync(path.join(projectDir, "AGENTS.md"));
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
  const yes = args.includes("--yes");
  const cleanArgs = args.filter((arg) => !arg.startsWith("--"));
  const projectDir = path.resolve(cleanArgs[0] ?? process.cwd());

  if (!fs.existsSync(templateDir)) {
    fail(`missing template directory: ${templateDir}`);
  }

  const existingStride = hasExistingStride(projectDir);
  const installedVersion = readInstalledStrideVersion(projectDir);
  const strideChanges = collectDirChanges(path.join(templateDir, ".stride"), path.join(projectDir, ".stride"), {
    cwd: projectDir,
    force,
  });
  const agentChanges = noCodex
    ? []
    : collectDirChanges(path.join(templateDir, ".agents"), path.join(projectDir, ".agents"), {
        cwd: projectDir,
        force,
  });
  const bridgeChange = noCodex ? null : collectCodexBridgeChange(projectDir);
  const changes = [...strideChanges, ...agentChanges, ...(bridgeChange ? [bridgeChange] : [])];
  const needsVersionUpdate = installedVersion !== packageJson.version;
  const shouldPrompt = existingStride && (changes.length > 0 || needsVersionUpdate) && !yes && !force;

  if (shouldPrompt) {
    const shouldUpdate = await confirmUpdate(projectDir, summarizeStrideUpdates(installedVersion));
    if (!shouldUpdate) {
      console.log("Skipped updating existing Stride install.");
      return;
    }
  }

  ensureDir(projectDir);
  ensureDir(path.join(projectDir, ".stride"));
  applyDirChanges(strideChanges, {
    cwd: projectDir,
    force,
  });
  if (!noCodex) {
    ensureDir(path.join(projectDir, ".agents"));
    applyDirChanges(agentChanges, {
      cwd: projectDir,
      force,
    });

    if (bridgeChange) {
      applyCodexBridgeChange(bridgeChange);
    }
  }

  writeInstalledStrideVersion(projectDir);

  console.log("");
  console.log(`Stride Workflow initialized in ${projectDir}`);
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
  const frame = path.join(projectDir, ".stride", "frames", "current.md");

  if (!fs.existsSync(ledger)) {
    fail(`no Stride Workflow ledger found at ${ledger}. Run "stride-workflow init" first.`);
  }

  if (fs.existsSync(run)) {
    process.stdout.write(fs.readFileSync(run, "utf8"));
    process.stdout.write("\n\n---\n\n");
  }

  if (fs.existsSync(frame)) {
    process.stdout.write(fs.readFileSync(frame, "utf8"));
    process.stdout.write("\n\n---\n\n");
  }

  process.stdout.write(fs.readFileSync(ledger, "utf8"));
}

function doctor(args) {
  const projectDir = path.resolve(args[0] ?? process.cwd());
  const missing = requiredPaths.filter((requiredPath) => {
    return !fs.existsSync(path.join(projectDir, requiredPath));
  });

  if (missing.length === 0) {
    console.log(`Stride Workflow looks ready in ${projectDir}`);
    return;
  }

  console.log(`Stride Workflow is incomplete in ${projectDir}`);
  console.log("");
  for (const missingPath of missing) {
    console.log(`missing ${missingPath}`);
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
    case "command":
      printCommand(args);
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
    case "touch":
    case "frame":
    case "carry":
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
