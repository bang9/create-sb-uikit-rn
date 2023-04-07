import * as fs from "fs";
import * as path from "path";

export function initDirectory(name) {
  const _path = path.join(global.__dirname, name);
  try {
    fs.mkdirSync(_path);
  } catch {}
  return _path;
}
