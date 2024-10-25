import fs from "fs";
import path from "path";
import semver from "semver";

function install(deps, path, dev = false) {
  logGroup("Install dependencies to", path);

  const depsFromGit = deps.filter((it) => it.includes("#"));

  exec(`yarn add ${deps.join(" ")}` + (dev ? " --dev" : ""), path);

  depsFromGit.forEach((dep) => {
    const pkg = dep.slice(0, dep.lastIndexOf("@"));
    try {
      exec(
        `cd node_modules/${pkg} && npx react-native-builder-bob@latest build`,
        path
      );
    } catch {}
  });
}

function setupTypeScript(project) {
  log("Setup typescript to project");

  install(
    [
      "@tsconfig/react-native",
      "@types/react",
      "@types/react-native",
      "typescript",
      "pod-install",
    ],
    project.path,
    true
  );

  logGroup("Create tsconfig.json");
  fs.writeFileSync(
    path.join(project.path, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "@tsconfig/react-native/tsconfig.json",
      },
      null,
      4
    ),
    { encoding: "utf-8" }
  );
}

function setupSendbird(project, uikitVersion) {
  log("Setup sendbird to project");

  const [, minor] = project.version.split(".");
  let createThumbnailVersion = "latest",
    safeAreaContextVersion = "latest",
    documentPickerVersion = "latest",
    fileAccessVersion = "latest",
    asyncStorageVersion = "latest",
    cameraRollVersion = "latest",
    clipboardVersion = "latest",
    reactNativeScreens = "latest";

  if (minor > 69) {
    createThumbnailVersion = "2.0.0-rc.2";
  }
  if (minor <= 68) {
    safeAreaContextVersion = "3.4.1";
  }
  if (minor <= 66) {
    asyncStorageVersion = "1.7.0";
    cameraRollVersion = "4.1.2";
    clipboardVersion = "1.9.0";
  }
  if (minor <= 64) {
    reactNativeScreens = "3.14.0";
    documentPickerVersion = "4";
    fileAccessVersion = "1.7.1";
  }

  const deps = [
    "@bam.tech/react-native-image-resizer",
    `@react-native-async-storage/async-storage@react-native-async-storage/async-storage#${asyncStorageVersion}`,
    `@react-native-camera-roll/camera-roll@react-native-cameraroll/react-native-cameraroll#${cameraRollVersion}`,
    `@react-native-clipboard/clipboard@${clipboardVersion}`,
    "@react-native-community/netinfo",
    "@react-navigation/native",
    "@react-navigation/native-stack",
    "@sendbird/chat",
    `@sendbird/uikit-react-native@${uikitVersion}`,
    "@types/react-native-video",
    "date-fns",
    `react-native-create-thumbnail@${createThumbnailVersion}`,
    `react-native-document-picker@${documentPickerVersion}`,
    `react-native-file-access@${fileAccessVersion}`,
    "react-native-image-picker",
    "react-native-permissions",
    `react-native-safe-area-context@${safeAreaContextVersion}`,
    `react-native-screens@${reactNativeScreens}`,
    "react-native-video",
  ];

  // Since 2.5.0
  if (minor < 72) {
    deps.push("@sendbird/react-native-scrollview-enhancer");
  }

  if (minor > 70) {
    const asyncIdx = deps.findIndex(dep => dep.startsWith("@react-native-async-storage/async-storage"));
    const cameraRollIdx = deps.findIndex(dep => dep.startsWith("@react-native-camera-roll/camera-roll"));
    deps[asyncIdx] = "@react-native-async-storage/async-storage@latest";
    deps[cameraRollIdx] = "@react-native-camera-roll/camera-roll@latest";
  }

  // Setup by UIKit version
  const uikit = uikitVersion.replace(/-rc.+/, "");
  if (semver.satisfies(uikit, ">=3.2.0")) {
    deps.push("react-native-audio-recorder-player");
  }
  if (semver.satisfies(uikit, ">=3.7.0")) {
    // Remove async-storage
    const asyncIdx = deps.findIndex(dep => dep.includes("async-storage"));
    deps.splice(asyncIdx, 1);
    deps.push('react-native-mmkv@2.x.x');
  }

  install(deps, project.path);

  logGroup("Update package.json");
  const pkg = JSON.parse(
    fs.readFileSync(path.join(project.path, "package.json"), {
      encoding: "utf-8",
    })
  );

  // pkg["reactNativePermissionsIOS"] = [
  //   "Camera",
  //   "Microphone",
  //   "PhotoLibrary",
  //   "MediaLibrary",
  //   "PhotoLibraryAddOnly",
  // ];
  // pkg["scripts"]["postinstall"] =
  //   "react-native setup-ios-permissions && pod-install";

  fs.writeFileSync(
    path.join(project.path, "package.json"),
    JSON.stringify(pkg, null, 2),
    { encoding: "utf-8" }
  );
}

function setupFiles(project, uikitVersion) {
  log("Setup required files");
  try {
    fs.rmSync(path.join(project.path, "App.js"));
  } catch {}
  try {
    fs.rmSync(path.join(project.path, "App.tsx"));
  } catch {}

  const rcRemovedVersion = uikitVersion.replace(/-rc.+/, "");

  logGroup("Create App.tsx");
  let templatePath = path.join(
    __dirname,
    "templates",
    `App.tsx-${rcRemovedVersion}`
  );
  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(__dirname, "templates", `App.tsx-2.4.1`);
  }
  const template = fs.readFileSync(templatePath, {
    encoding: "utf-8",
  });
  fs.writeFileSync(path.join(project.path, "App.tsx"), template, {
    encoding: "utf-8",
  });

  logGroup("Update info.plist");
  const plistpath = path.join(project.path, "ios", project.name, "info.plist");
  // read the contents of the file
  const plist = fs.readFileSync(plistpath, "utf-8");

  // modify the contents to add the new permissions
  // Note: This example assumes that the plist file is in XML format
  // and uses regex to find and modify the relevant XML tags.
  const newPlist = plist.replace(
    /<\/dict>/g,
    `
  <key>NSCameraUsageDescription</key>
  <string>Allows access to the camera for taking photos and videos</string>
  <key>NSMicrophoneUsageDescription</key>
  <string>Allows access to the microphone for recording audio</string>
  <key>NSPhotoLibraryUsageDescription</key>
  <string>Allows access to the photo library to select photos and videos</string>
  <key>NSAppleMusicUsageDescription</key>
  <string>Allows access to the media library to select media files</string>
  <key>NSPhotoLibraryAddUsageDescription</key>
  <string>Allows adding photos and videos to the photo library</string>
</dict>`
  );

  // write the new contents back to the file
  fs.writeFileSync(plistpath, newPlist, "utf-8");
}

export function installDependencies(project, uikitVersion) {
  if (semver.satisfies(project.version, '<0.71.0')) {
    setupTypeScript(project);
  }
  setupSendbird(project, uikitVersion);
  setupFiles(project, uikitVersion);
  exec("yarn install", project.path);
}
