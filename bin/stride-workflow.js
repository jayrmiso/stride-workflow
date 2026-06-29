#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const templateDir = path.join(rootDir, "templates", "default");
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const agentsBridgeStart = "<!-- stride-workflow:start -->";
const agentsBridgeEnd = "<!-- stride-workflow:end -->";

const commandNames = ["touch", "frame", "carry", "land", "kit", "review", "mend", "status"];
const requiredPaths = [
  ".stride/config.md",
  ".stride/ledger.md",
  ".agents/skills/stride/SKILL.md",
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
  stride-workflow init [path] [--force] [--no-codex]
  stride-workflow command <touch|frame|carry|land|kit|review|mend|status>
  stride-workflow <touch|frame|carry|land|kit|review|mend|status>
  stride-workflow subject [path]
  stride-workflow status [path]
  stride-workflow doctor [path]
  stride-workflow version
  stride-workflow --help

Commands:
  init     Install or refresh .stride workflow files in a project.
  command  Print the instructions for one Stride Workflow command.
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

function syncFile(srcPath, destPath, options) {
  const nextContent = fs.readFileSync(srcPath);
  const existed = fs.existsSync(destPath);

  if (existed) {
    const currentContent = fs.readFileSync(destPath);
    if (!options.force && currentContent.equals(nextContent)) {
      console.log(`skip ${path.relative(options.cwd, destPath)} already up to date`);
      return;
    }
  }

  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, nextContent);
  console.log(`${existed ? "update" : "write"} ${path.relative(options.cwd, destPath)}`);
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

function writeCodexBridge(projectDir, force) {
  const target = path.join(projectDir, "AGENTS.md");
  const existed = fs.existsSync(target);
  const nextBody = fs.existsSync(target)
    ? upsertCodexBridge(fs.readFileSync(target, "utf8"))
    : `${buildCodexBridge()}\n`;

  if (existed && !force) {
    const currentBody = fs.readFileSync(target, "utf8");
    if (currentBody === nextBody) {
      console.log("skip AGENTS.md already contains the Stride Workflow bridge");
      return;
    }
  }

  fs.writeFileSync(target, nextBody);
  console.log(existed ? "update AGENTS.md" : "write AGENTS.md");
}

function initProject(args) {
  const force = args.includes("--force");
  const noCodex = args.includes("--no-codex");
  const cleanArgs = args.filter((arg) => !arg.startsWith("--"));
  const projectDir = path.resolve(cleanArgs[0] ?? process.cwd());

  if (!fs.existsSync(templateDir)) {
    fail(`missing template directory: ${templateDir}`);
  }

  ensureDir(projectDir);
  copyDir(path.join(templateDir, ".stride"), path.join(projectDir, ".stride"), {
    cwd: projectDir,
    force,
  });
  copyDir(path.join(templateDir, ".agents"), path.join(projectDir, ".agents"), {
    cwd: projectDir,
    force,
  });

  if (!noCodex) {
    writeCodexBridge(projectDir, force);
  }

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

if (!command || command === "--help" || command === "-h") {
  process.stdout.write(usage());
  process.exit(0);
}

switch (command) {
  case "init":
    initProject(args);
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
    printCommandByName(command);
    break;
  default:
    fail(`unknown command "${command}"\n\n${usage()}`);
}
