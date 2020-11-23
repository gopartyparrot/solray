#!/usr/bin/env node
import program from 'commander';

// @ts-ignore
import appInfo from '../../package.json';
import { build } from './utils';

program.version(appInfo.version);

program
  .command('build <my-program> [path]')
  .description('Build the solana program.')
  .action(async (program, toPath) => {
    await build(program, toPath);
  });

program.parse(process.argv);

if (program.args.length < 1) {
  program.outputHelp();
}