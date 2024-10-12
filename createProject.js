import {initDirectory} from "./directories.js";
import path from "path";

export function createProject(version) {
  log("Create react-native project...");

  if (TEST) {
    return {
      cwd: "/Users/airenkang/Desktop/create-sb-uikit/projects",
      name: "ChatApp8df5",
      path: "/Users/airenkang/Desktop/create-sb-uikit/projects/ChatApp8df5",
      version: "0.63.5",
    };
  }
  const [_, minor] = version.split(".");

  const hash = Math.random().toString(16).slice(4, 8);
  const name = `ChatApp${hash}`;

  const cwd = initDirectory("projects");
  const projectPath = path.join(cwd, name);

  try {
    exec(`npx @react-native-community/cli init ${name} --version=${version}`, cwd);
  } catch {
    writeGemFile(minor, projectPath);
  }

  log("📦 Create project", name);

  return {
    cwd,
    name,
    path: projectPath,
    version,
  };
}

function writeGemFile(minor, projectPath) {
  if (minor < 67) {
    log("Inject gem file");

    const data = `source 'https://rubygems.org'

# You may use http://rbenv.org/ or https://rvm.io/ to install and use this version
ruby '>= 2.6.10'

gem 'cocoapods', '>= 1.11.3'`;

    exec(`echo "${data}" >> ${projectPath}/Gemfile`);
  }
}
