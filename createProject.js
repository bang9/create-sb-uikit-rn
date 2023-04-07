import { initDirectory } from "./directories.js";
import path from "path";

export function createProject(version) {
  log("Create react-native project...");

  if (TEST) {
    return {
      cwd: "/Users/airenkang/Desktop/create-sb-uikit/projects",
      name: "ChatApp60a5",
      path: "/Users/airenkang/Desktop/create-sb-uikit/projects/ChatApp60a5",
      version: "0.70.0",
    };
  }

  const hash = Math.random().toString(16).slice(4, 8);
  const name = `ChatApp${hash}`;

  const cwd = initDirectory("projects");
  exec(`npx react-native init ${name} --version=${version}`, cwd);

  return {
    cwd,
    name,
    path: path.join(cwd, name),
    version,
  };
}
