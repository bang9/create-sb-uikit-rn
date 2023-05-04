import fetch from "node-fetch";
import semver from "semver";

export async function readVersions(pkg, includeRC) {
  const response = await fetch(`https://registry.npmjs.org/${pkg}`).then(
    (res) => res.json()
  );
  return semver
    .sort(Object.keys(response.versions).filter((it) => includeRC ? true : !it.includes("rc")))
    .reverse();
}

export async function getRNVersions() {
  const minVersion = "0.64.4";
  const versions = await readVersions("react-native");
  return versions.filter((it) => semver.satisfies(it, `>=${minVersion}`));
}

export async function getUIKitVersions() {
  const minVersion = "2.0.0";
  const versions = await readVersions("@sendbird/uikit-react-native", true);
  return versions.filter((it) => semver.satisfies(it, `>=${minVersion}`, { includePrerelease: true }));
}
