#!/usr/bin/env python3
"""
Legacy vs modernized REST API parity checker.

This script reads the legacy OpenAPI inventory and the Markdown parity matrix,
then reports how many endpoints have a verified one-to-one mapping.

Usage:
    python scripts/api_parity_eval.py

Limitations:
    * The script trusts documentation status; it does not call any live server.
    * If the Markdown format changes, the parser below must be updated.
"""
from __future__ import annotations

import argparse
import dataclasses
import enum
import pathlib
import re
from typing import Dict, Iterable, List, Optional, Tuple


LEGACY_DEFAULT_PATH = pathlib.Path(
    "docs/server-modernization/server-api-inventory.yaml"
)
PARITY_MATRIX_DEFAULT_PATH = pathlib.Path(
    "docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md"
)
STATUS_COMPLETE_SYMBOL = "\u25ce"  # U+25CE (circled)


class CoverageStatus(enum.Enum):
    """Classification used for parity coverage."""

    COMPLETE = "complete"  # checkbox checked and status is STATUS_COMPLETE_SYMBOL
    INCOMPLETE = "incomplete"  # checkbox checked but status is not STATUS_COMPLETE_SYMBOL
    UNCOVERED = "uncovered"  # checkbox unchecked or entry missing altogether


@dataclasses.dataclass(frozen=True)
class EndpointKey:
    method: str
    normalized_path: str


@dataclasses.dataclass
class LegacyEndpoint:
    method: str
    path: str


@dataclasses.dataclass
class ParityEntry:
    resource: str
    method: str
    legacy_path: str
    modern_resource: Optional[str]
    modern_path: Optional[str]
    checkbox_raw: str
    status_raw: str
    note: str

    @property
    def key(self) -> EndpointKey:
        return EndpointKey(self.method, normalize_path(self.legacy_path))

    @property
    def is_checked(self) -> bool:
        return self.checkbox_raw.strip().lower() == "[x]"

    @property
    def status_symbol(self) -> str:
        text = self.status_raw.strip()
        return text[:1] if text else ""

    @property
    def coverage(self) -> CoverageStatus:
        if self.is_checked and self.status_symbol == STATUS_COMPLETE_SYMBOL:
            return CoverageStatus.COMPLETE
        if self.is_checked:
            return CoverageStatus.INCOMPLETE
        return CoverageStatus.UNCOVERED


def normalize_path(path: str) -> str:
    """Replace `{param}` segments with `{}` for canonical comparison."""
    return re.sub(r"\{[^{}]*\}", "{}", path)


def parse_legacy_openapi(path: pathlib.Path) -> Dict[EndpointKey, LegacyEndpoint]:
    """
    Extract method/path entries from the legacy OpenAPI YAML file.

    This lightweight parser only walks the `paths:` section and avoids third-party
    YAML dependencies so the script stays portable.
    """
    entries: Dict[EndpointKey, LegacyEndpoint] = {}
    path_pattern = re.compile(r"^\s{2,}(/[^:]+):\s*$")
    method_pattern = re.compile(
        r"^\s{4,}(get|put|post|delete|patch|options|head|trace):\s*$", re.IGNORECASE
    )

    with path.open(encoding="utf-8") as stream:
        in_paths = False
        current_path: Optional[str] = None
        for raw_line in stream:
            line = raw_line.rstrip("\n")
            stripped = line.strip()

            if not in_paths:
                if stripped == "paths:":
                    in_paths = True
                continue

            # Leaving the `paths:` section means we can stop scanning.
            if stripped and not line.startswith(" "):
                break

            match = path_pattern.match(line)
            if match:
                current_path = match.group(1)
                continue

            if current_path:
                method_match = method_pattern.match(line)
                if method_match:
                    method = method_match.group(1).upper()
                    key = EndpointKey(method, normalize_path(current_path))
                    entries[key] = LegacyEndpoint(method=method, path=current_path)

    return entries


def parse_parity_matrix(path: pathlib.Path) -> Dict[EndpointKey, ParityEntry]:
    """
    Parse the Markdown parity matrix and return endpoint rows as a dictionary.

    Only tables whose header starts with `| HTTP |` are considered parity tables.
    """
    text = read_text_with_fallbacks(path)
    entries: Dict[EndpointKey, ParityEntry] = {}

    lines = text.splitlines()
    current_resource: Optional[str] = None
    in_table = False

    for raw_line in lines:
        line = raw_line.rstrip()

        if line.startswith("### "):
            current_resource = line[4:].strip()
            in_table = False
            continue

        if line.startswith("| HTTP |"):
            in_table = True
            continue

        if in_table:
            stripped = line.strip()
            if set(stripped) == {"|", "-", " "}:
                # Delimiter row (`| --- | --- | ... |`)
                continue
            if not stripped.startswith("|"):
                in_table = False
                continue

            cols = [col.strip() for col in stripped.split("|")[1:-1]]
            if len(cols) < 5:
                continue

            method = cols[0].upper()
            legacy_path = extract_first_code_span(cols[1])
            modern_resource, modern_path = parse_modern_column(cols[2])
            checkbox = cols[3]
            status = cols[4]
            note = cols[5] if len(cols) >= 6 else ""

            if not legacy_path:
                continue

            entry = ParityEntry(
                resource=current_resource or "",
                method=method,
                legacy_path=legacy_path,
                modern_resource=modern_resource,
                modern_path=modern_path,
                checkbox_raw=checkbox,
                status_raw=status,
                note=note,
            )
            entries[entry.key] = entry

    return entries


def read_text_with_fallbacks(path: pathlib.Path) -> str:
    """Try UTF-8, UTF-8 with BOM, and CP932 when loading text."""
    for encoding in ("utf-8", "utf-8-sig", "cp932"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError(
        "utf-8/cp932", b"", 0, 0, f"Failed to decode {path} with supported encodings."
    )


def extract_first_code_span(text: str) -> Optional[str]:
    """Return the first inline code span wrapped in backticks."""
    match = re.search(r"`([^`]+)`", text)
    return match.group(1).strip() if match else None


def parse_modern_column(text: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract the modern resource name and path from the column text.

    The expected pattern is `ResourceName: `/path`` but the function tolerates missing
    resource names or paths by returning None.
    """
    resource_match = re.match(r"([A-Za-z0-9_]+):", text)
    resource = resource_match.group(1) if resource_match else None
    path = extract_first_code_span(text)
    return resource, path


def calculate_statistics(
    legacy: Dict[EndpointKey, LegacyEndpoint],
    parity: Dict[EndpointKey, ParityEntry],
) -> Dict[str, object]:
    """Aggregate parity coverage statistics."""
    legacy_keys = set(legacy.keys())
    parity_keys = set(parity.keys())

    covered_keys = legacy_keys & parity_keys
    uncovered_keys = legacy_keys - parity_keys
    extra_in_parity = parity_keys - legacy_keys

    coverage_buckets: Dict[CoverageStatus, List[ParityEntry]] = {
        CoverageStatus.COMPLETE: [],
        CoverageStatus.INCOMPLETE: [],
        CoverageStatus.UNCOVERED: [],
    }

    for key in covered_keys:
        entry = parity[key]
        coverage_buckets[entry.coverage].append(entry)

    for key in legacy_keys:
        if key not in parity:
            coverage_buckets[CoverageStatus.UNCOVERED].append(
                ParityEntry(
                    resource="(not documented)",
                    method=legacy[key].method,
                    legacy_path=legacy[key].path,
                    modern_resource=None,
                    modern_path=None,
                    checkbox_raw="[ ]",
                    status_raw="",
                    note="missing from parity matrix",
                )
            )

    per_resource: Dict[str, Dict[str, int]] = {}
    for entry in parity.values():
        resource = entry.resource or "(resource not declared)"
        stats = per_resource.setdefault(
            resource,
            {
                "total": 0,
                "complete": 0,
                "incomplete": 0,
                "uncovered": 0,
            },
        )
        stats["total"] += 1
        bucket = entry.coverage
        if bucket is CoverageStatus.COMPLETE:
            stats["complete"] += 1
        elif bucket is CoverageStatus.INCOMPLETE:
            stats["incomplete"] += 1
        else:
            stats["uncovered"] += 1

    return {
        "legacy_total": len(legacy_keys),
        "documented_total": len(parity_keys),
        "covered_total": len(covered_keys),
        "uncovered_total": len(uncovered_keys),
        "extra_total": len(extra_in_parity),
        "coverage_buckets": coverage_buckets,
        "per_resource": per_resource,
        "extra_entries": [parity[key] for key in extra_in_parity],
    }


def format_summary(stats: Dict[str, object]) -> str:
    """Render the statistics in a readable format."""
    lines: List[str] = []

    legacy_total = stats["legacy_total"]
    documented_total = stats["documented_total"]
    extra_total = stats["extra_total"]
    buckets: Dict[CoverageStatus, List[ParityEntry]] = stats["coverage_buckets"]  # type: ignore[index]

    complete_count = len(buckets[CoverageStatus.COMPLETE])
    incomplete_count = len(buckets[CoverageStatus.INCOMPLETE])
    uncovered_count = len(buckets[CoverageStatus.UNCOVERED])

    lines.append("=== Summary ===")
    lines.append(f"Legacy endpoints total        : {legacy_total}")
    lines.append(f"Endpoints documented in matrix: {documented_total}")
    lines.append(
        f"Fully validated ({STATUS_COMPLETE_SYMBOL} / [x])     : {complete_count}"
    )
    lines.append(f"Needs follow-up (checked only) : {incomplete_count}")
    lines.append(f"Unverified / undocumented      : {uncovered_count}")
    lines.append(f"Extra entries in matrix        : {extra_total}")
    lines.append("")

    lines.append("=== Follow-up items ===")
    if uncovered_count == 0 and incomplete_count == 0:
        lines.append("None")
    else:
        followups = buckets[CoverageStatus.UNCOVERED] + buckets[CoverageStatus.INCOMPLETE]
        for entry in sorted(
            followups, key=lambda e: (e.resource, e.method, e.legacy_path)
        ):
            status = entry.status_symbol or "-"
            checkbox = entry.checkbox_raw or "[ ]"
            note = entry.note or ""
            lines.append(
                f"[{entry.resource}] {entry.method} {entry.legacy_path} | "
                f"{checkbox}, {status} | {note}"
            )
    lines.append("")

    extra_entries: Iterable[ParityEntry] = stats["extra_entries"]  # type: ignore[assignment]
    lines.append("=== Not present in legacy OpenAPI ===")
    if extra_total == 0:
        lines.append("None")
    else:
        for entry in sorted(extra_entries, key=lambda e: (e.resource, e.method, e.legacy_path)):
            lines.append(
                f"[{entry.resource}] {entry.method} {entry.legacy_path} -> "
                f"{entry.modern_resource or '-'} {entry.modern_path or '(path missing)'}"
            )

    return "\n".join(lines)


def validate_input_files(legacy_path: pathlib.Path, matrix_path: pathlib.Path) -> None:
    """Confirm that both reference documents exist."""
    missing: List[str] = []
    if not legacy_path.is_file():
        missing.append(str(legacy_path))
    if not matrix_path.is_file():
        missing.append(str(matrix_path))
    if missing:
        raise FileNotFoundError("Missing reference documents: " + ", ".join(missing))


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Summarize coverage between the legacy OpenAPI inventory and the "
            "modernized parity matrix."
        )
    )
    parser.add_argument(
        "--legacy-openapi",
        type=pathlib.Path,
        default=LEGACY_DEFAULT_PATH,
        help=f"path to the legacy OpenAPI definition (default: {LEGACY_DEFAULT_PATH})",
    )
    parser.add_argument(
        "--parity-matrix",
        type=pathlib.Path,
        default=PARITY_MATRIX_DEFAULT_PATH,
        help=f"path to the parity matrix Markdown file (default: {PARITY_MATRIX_DEFAULT_PATH})",
    )
    args = parser.parse_args()

    validate_input_files(args.legacy_openapi, args.parity_matrix)

    legacy_entries = parse_legacy_openapi(args.legacy_openapi)
    parity_entries = parse_parity_matrix(args.parity_matrix)
    stats = calculate_statistics(legacy_entries, parity_entries)

    summary = format_summary(stats)
    print(summary)


if __name__ == "__main__":
    main()
