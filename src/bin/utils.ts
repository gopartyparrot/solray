import fs from 'fs';
import path from 'path';

import { exec as execute } from 'child_process';

// Wrap it to show stdout
function exec(cmd: string) {
  return new Promise((resolve, reject) => {
    const childProcess = execute(cmd, function(err, stdout, stderr) {
      if (err === null) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    });
    childProcess.stdout?.pipe(process.stdout);
    childProcess.stderr?.pipe(process.stderr);
  });
}

// paths
const cwd = process.cwd();
const binDir = __dirname;
const rootDir = path.resolve(binDir, '../../');
const web3Dir = path.join(rootDir, '/node_modules/@solana/web3.js');
const bpfSdkDir = path.join(web3Dir, '/bpf-sdk');

// shells
const sdkInstaller = path.join(binDir, '/bpf-sdk-install.sh');
const programBuilder = path.join(bpfSdkDir, 'rust/build.sh');

// The Cargo.tomal package name may not equals the program name,
// so we so we need to compatible this.
function getSoFilePath(program: string, profilePath: string): string {
  let soFilePath = path.join(profilePath, (program + '').replace(/\-/g, '_') + '.so');
  if (fs.existsSync(soFilePath)) {
    return soFilePath;
  }
  // Find the first .so file in the directory
  const files = fs.readdirSync(profilePath);
  let soFile = '';
  files.every(file => !(/.*\.so$/.test(file) && (soFile = file)));
  return path.join(profilePath, soFile);
}

// Build the solana program.
async function runBuild(program: string, toPath: string): Promise<void> {

  const programDir = path.join(cwd, program);
  const targetDir = path.join(programDir, 'target');
  const profilePath = path.join(targetDir, 'bpfel-unknown-unknown', 'release');
  if (!fs.existsSync(programDir)) {
    console.log('Not found program:', programDir);
    return;
  }

  await exec(programBuilder + ' ' + program);
 
  const soFilePath = getSoFilePath(program, profilePath);

  const soFileName = program + '.so';
  let outputDir = 'build';

  if (toPath) {
    outputDir = /\/$|^((?!(\/)).)*$/.test(toPath) ? toPath : path.dirname(toPath);
  }

  const outputFilePath = /\.so$/.test(toPath) ? toPath : path.join(outputDir, soFileName);

  // Create the folder if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.copyFileSync(soFilePath, outputFilePath);
  console.log('Program built to:', outputFilePath);
}

async function ensureLatestBuildSDK(): Promise<void> {
  if (fs.existsSync(bpfSdkDir)) {
    const sdkVersionFile = path.join(bpfSdkDir, 'version.txt');
    const sdkVersionData = fs.readFileSync(sdkVersionFile, 'utf-8');
    const pkgJSONData = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8');

    const pkgJSON = JSON.parse(pkgJSONData) || {};
    
    let checked = pkgJSON.testnetDefaultChannel == 'v' + (/^(.*)\s/.exec(sdkVersionData) || [])[1];
    if (checked) {
      return;
    }
    console.log('SDK version not match, download the new version.');
    fs.rmdirSync(bpfSdkDir, { recursive: true });
  }
  await exec(sdkInstaller + ' ' + web3Dir);
}

export async function build(program: string, toPath: string): Promise<void> {
  await ensureLatestBuildSDK();
  await runBuild(program, toPath);
}