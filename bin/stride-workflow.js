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

function usage() {
  return `stride-workflow

Usage:
  stride-workflow init [path] [--force] [--no-codex]
  stride-workflow command <touch|frame|carry|land|kit|review|mend|status>
  stride-workflow <touch|frame|carry|land|kit|review|mend|status>
  stride-workflow status [path]
  stride-workflow doctor [path]
  stride-workflow version
  stride-workflow --help

Commands:
  init     Install .stride workflow files into a project.
  command  Print the instructions for one Stride Workflow command.
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

function copyDir(src, dest, options) {
  ensureDir(dest);

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, options);
      continue;
    }

    if (!options.force && fs.existsSync(destPath)) {
      console.log(`skip ${path.relative(options.cwd, destPath)} already exists`);
      continue;
    }

    fs.copyFileSync(srcPath, destPath);
    console.log(`write ${path.relative(options.cwd, destPath)}`);
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
