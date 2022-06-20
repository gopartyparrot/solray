#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const package_json_1 = __importDefault(require("../../package.json"));
const utils_1 = require("./utils");
commander_1.program.version(package_json_1.default.version);
commander_1.program
    .command("build <my-program> [path]")
    .description("Build the solana program.")
    .action(async (program, toPath) => {
    await (0, utils_1.build)(program, toPath);
});
commander_1.program.parse(process.argv);
if (commander_1.program.args.length < 1) {
    commander_1.program.outputHelp();
}
