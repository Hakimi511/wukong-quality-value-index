"""Fail closed before committing the public GitHub repository.

The project may expose only its reviewed static source and the two aggregate
JSON files.  This validator intentionally checks the Git candidate set rather
than the surrounding WUKONG project, which contains the private ledger.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ALLOWED_DATA = {"public/data/public_snapshot.json", "public/data/public_manifest.json"}
FORBIDDEN_FILE_TOKENS = (
    "portfolio_", "h_ranking", "rebalance_preview", "wukong_shadow", "tdx", "candidate", "holding", "order", "ledger",
)
FORBIDDEN_SUFFIXES = {".db", ".sqlite", ".csv", ".xlsx", ".parquet", ".pem", ".key", ".pfx", ".zip", ".tar", ".gz"}
TICKER = re.compile(r"\b(?:00|30|60|68)\d{4}\.(?:SH|SZ)\b", re.I)
SENSITIVE_VALUE = re.compile(r"(?i)(?:cloudflare|github|api)[_-]?(?:token|key|secret)\s*[:=]\s*[^\s]+")
ALLOWED_SNAPSHOT_KEYS = {"schema_version", "generated_at_utc", "data_as_of", "source_snapshot_at", "strategy", "nav_daily", "factor_highlights", "daily_public", "daily_brief", "disclosure"}


def candidates() -> list[Path]:
    result = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=ROOT, text=True, capture_output=True, check=True)
    return [ROOT / line for line in result.stdout.splitlines() if line.strip()]


def validate_snapshot(path: Path) -> list[str]:
    issues: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"{path.relative_to(ROOT)} is not readable JSON: {exc}"]
    if path.name == "public_snapshot.json":
        unknown = set(data) - ALLOWED_SNAPSHOT_KEYS
        if unknown:
            issues.append(f"public snapshot has unreviewed fields: {sorted(unknown)}")
        raw = json.dumps(data, ensure_ascii=False)
        if TICKER.search(raw):
            issues.append("public snapshot contains a security code")
        for token in ("symbol", "股票名称", "持仓", "现金", "订单", "调仓明细", "H优化分"):
            if token in raw:
                issues.append(f"public snapshot contains restricted token: {token}")
    return issues


def main() -> int:
    issues: list[str] = []
    tracked = candidates()
    names = {path.relative_to(ROOT).as_posix() for path in tracked}
    missing = ALLOWED_DATA - names
    if missing:
        issues.append(f"missing reviewed data files: {sorted(missing)}")
    for path in tracked:
        rel = path.relative_to(ROOT).as_posix()
        lower = rel.lower()
        if path.suffix.lower() in FORBIDDEN_SUFFIXES:
            issues.append(f"forbidden binary/data suffix: {rel}")
        if rel not in ALLOWED_DATA and any(token in lower for token in FORBIDDEN_FILE_TOKENS):
            issues.append(f"restricted filename token: {rel}")
        if path.suffix.lower() in {".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css", ".html", ".yml", ".yaml"} and rel != "scripts/validate_public_repository.py":
            text = path.read_text(encoding="utf-8", errors="ignore")
            if TICKER.search(text):
                issues.append(f"security code found in source: {rel}")
            if SENSITIVE_VALUE.search(text):
                issues.append(f"credential-like value found in source: {rel}")
    for rel in ALLOWED_DATA & names:
        issues.extend(validate_snapshot(ROOT / rel))
    if issues:
        for item in issues:
            print(f"FAIL: {item}")
        return 2
    print(f"PASS: public GitHub candidate set contains {len(tracked)} reviewed files and no detected sensitive data")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
