import inquirer from "inquirer";
import { execSync } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { getRNVersions, getUIKitVersions } from "./versions.js";
import { createProject } from "./createProject.js";
import { installDependencies } from "./installDeps.js";

const [_, __, script] = process.argv;
global.__filename = fileURLToPath(import.meta.url);
global.__dirname = dirname(__filename);
global.exec = (command, cwd) => execSync(command, { cwd, stdio: "inherit" });
global.TEST = script === "--test";
global.log = (...args) => console.log(chalk.bold.green("\n", ...args));
global.logGroup = (...args) => console.log(chalk.green("  --", ...args));

async function run() {
  const [rnVersions, uikitVersions] = await Promise.all([
    getRNVersions(),
    getUIKitVersions(),
  ]);
  const answers = await inquirer.prompt([
    {
      type: "list",
      message: "Select React-Native version",
      name: "rn_version",
      choices: rnVersions,
    },
    {
      type: "list",
      message: "Select UIKit version",
      name: "uikit_version",
      choices: uikitVersions,
    },
  ]);

  const { rn_version, uikit_version } = answers;

  const project = createProject(rn_version);
  installDependencies(project, uikit_version);

  log(`Done! 🎉 ${project.name}`);
  exec(`open ${project.path}`);
}

run();
