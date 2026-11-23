"""Fail-closed release audit for Moncevia's installable artifacts and permissions.

This does not simulate physical Safari/Opera installations and does not certify
a stable release. It validates only objectively inspectable source and bundles.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

EXPECTED_HOSTS = {
    "https://data-api.binance.vision/*",
    "https://api.binance.com/*",
    "https://open.er-api.com/*",
    "https://api.coingecko.com/*",
    "https://api.coinbase.com/*",
}

EXPECTED_CONNECT = {re.sub(r"^https://|/\*$", "", host) for host in EXPECTED_HOSTS}
EXPECTED_GRANTS = {
    "GM.getValue", "GM.setValue", "GM.xmlHttpRequest",
    "GM_getValue", "GM_setValue", "GM_xmlhttpRequest",
}


def must(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def directives(header: str, name: str) -> list[str]:
    return re.findall(rf"^// @{re.escape(name)}\s+(.+?)\s*$", header, re.MULTILINE)


def audit() -> None:
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    version = package["version"]
    must(bool(re.fullmatch(r"\d+\.\d+\.\d+", version)), "invalid semantic version")

    header = (ROOT / "src/meta/userscript.header.txt").read_text(encoding="utf-8")
    must(directives(header, "version") == [version], "userscript/package version mismatch")
    must(directives(header, "match") == ["https://*/*"], "unexpected page access scope")
    must(directives(header, "run-at") == ["document-idle"], "unexpected execution timing")
    must("// @noframes" in header, "frame isolation missing")
    must(set(directives(header, "grant")) == EXPECTED_GRANTS, "userscript grants expanded")
    must(len(directives(header, "grant")) == len(EXPECTED_GRANTS), "duplicate/extra GM grants")
    must(set(directives(header, "connect")) == EXPECTED_CONNECT, "userscript outbound hosts expanded")
    must(len(directives(header, "connect")) == len(EXPECTED_CONNECT), "duplicate/extra hosts")
    must(directives(header, "inject-into") == ["content"], "userscript injection scope changed")

    script = (ROOT / "moncevia.user.js").read_bytes()
    must(script.startswith(header.rstrip().encode("utf-8")), "generated header mismatch")
    must(b"createPageLifecycle" in script, "typed lifecycle missing from shipped bundle")
    must(b"createPanelShell" in script, "typed UI missing from shipped bundle")

    extension_version: str | None = None
    for browser in ("chromium", "firefox"):
        folder = ROOT / "extension" / browser
        manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
        must(manifest["manifest_version"] == 3, f"{browser}: not Manifest V3")
        must(manifest["permissions"] == ["storage"], f"{browser}: permissions expanded")
        must(set(manifest["host_permissions"]) == EXPECTED_HOSTS, f"{browser}: hosts expanded")
        must(len(manifest["host_permissions"]) == len(EXPECTED_HOSTS), f"{browser}: duplicate hosts")
        must(manifest["content_scripts"] == [{
            "matches": ["https://*/*"],
            "js": ["bridge.js", "engine.js"],
            "run_at": "document_idle",
            "all_frames": False,
        }], f"{browser}: injected content-script scope changed")
        must((folder / "engine.js").read_bytes() == script, f"{browser}: engine/source drift")
        must((folder / "bridge.js").is_file(), f"{browser}: missing bridge")
        must((folder / "background.js").is_file(), f"{browser}: missing background")
        must(manifest["version"], f"{browser}: extension version missing")
        if extension_version is None:
            extension_version = manifest["version"]
        else:
            must(manifest["version"] == extension_version, "native extension versions differ")
        must(extension_version in (folder / "popup.html").read_text(encoding="utf-8"),
             f"{browser}: popup version mismatch")
        if browser == "chromium":
            must(manifest["background"] == {"service_worker": "background.js"},
                 "unexpected Chromium background worker")
        else:
            must(manifest["background"] == {"scripts": ["background.js"]},
                 "unexpected Firefox background scripts")

    must(not list((ROOT / ".github/workflows").glob("phase*-temp.yml")),
         "temporary CI workflow remains in public release")
    must((ROOT / "docs/QA_DEVICE_MATRIX.md").is_file(), "missing physical-device gate")
    must((ROOT / "docs/RELEASE_READINESS.md").is_file(), "missing release blockers")
    digest = hashlib.sha256(script).hexdigest()[:16]
    print(f"PASS phase 14: userscript {version}, extensions {extension_version}, "
          f"unchanged permissions/hosts, identical browser engines; SHA256 {digest}")
    print("NOT CERTIFIED: physical Safari iOS, Opera GX, add-on store signing and release.")


if __name__ == "__main__":
    audit()
