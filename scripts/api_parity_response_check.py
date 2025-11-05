#!/usr/bin/env python3
"""
Legacy vs modernized REST API response checker.

The script sends identical requests to the legacy and modernized servers and
compares their responses. It is driven by a JSON configuration file that lists
targets (method/path/payload) and comparison rules.

Usage example:
    python scripts/api_parity_response_check.py --config configs/api_targets.json \
        --legacy-base http://192.0.2.10:8080/opendolphin \
        --modern-base http://192.0.2.20:8080/opendolphin

Environment variables `LEGACY_API_BASE` and `MODERN_API_BASE` can be used in
place of command line arguments. The script exits with status code 0 when all
comparisons pass, otherwise 1.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import typing as t
import urllib.error
import urllib.parse
import urllib.request


class ComparisonMode:
    JSON = "json"
    TEXT = "text"
    STATUS = "status"


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Send mirrored requests to legacy and modernized servers "
        "and compare responses."
    )
    parser.add_argument(
        "--config",
        required=True,
        type=str,
        help="Path to the JSON configuration file describing API targets.",
    )
    parser.add_argument(
        "--legacy-base",
        default=os.environ.get("LEGACY_API_BASE"),
        help="Base URL for the legacy server (may include scheme, host, port, base path).",
    )
    parser.add_argument(
        "--modern-base",
        default=os.environ.get("MODERN_API_BASE"),
        help="Base URL for the modernized server (may include scheme, host, port, base path).",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=15.0,
        help="Request timeout in seconds (default: 15).",
    )
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Abort on the first mismatch instead of processing all targets.",
    )
    return parser


def ensure_base_urls(args: argparse.Namespace) -> None:
    if not args.legacy_base or not args.modern_base:
        message = (
            "Both legacy and modern base URLs must be provided. "
            "Use --legacy-base/--modern-base or the LEGACY_API_BASE and "
            "MODERN_API_BASE environment variables."
        )
        raise SystemExit(message)


def load_config(path: str) -> t.Dict[str, t.Any]:
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if "targets" not in data or not isinstance(data["targets"], list):
        raise ValueError("Configuration file must contain a 'targets' list.")
    return data


def make_request(
    base_url: str,
    target: t.Dict[str, t.Any],
    timeout: float,
    shared_headers: t.Dict[str, str],
    variant_headers: t.Dict[str, str],
) -> t.Tuple[int, t.Mapping[str, str], bytes]:
    method = str(target.get("method", "GET")).upper()
    path = target["path"]
    query = target.get("query") or {}
    body = target.get("body")

    if not isinstance(path, str):
        raise ValueError("Target path must be a string.")

    url = combine_url(base_url, path, query)
    headers = merge_headers(shared_headers, variant_headers, target.get("headers", {}))
    data = encode_body(body, headers)

    request = urllib.request.Request(url=url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            status = response.getcode()
            resp_headers = {k: v for k, v in response.headers.items()}
            content = response.read()
    except urllib.error.HTTPError as error:
        status = error.code
        resp_headers = {k: v for k, v in error.headers.items()} if error.headers else {}
        content = error.read() if error.fp else b""
    except urllib.error.URLError as error:
        raise RuntimeError(f"Request to {url} failed: {error}") from error

    return status, resp_headers, content


def combine_url(base: str, path: str, query: t.Mapping[str, t.Any]) -> str:
    normalized_base = base.rstrip("/") + "/"
    normalized_path = path.lstrip("/")
    base_url = urllib.parse.urljoin(normalized_base, normalized_path)
    if query:
        query_string = urllib.parse.urlencode(query, doseq=True)
        separator = "&" if urllib.parse.urlsplit(base_url).query else "?"
        return f"{base_url}{separator}{query_string}"
    return base_url


def merge_headers(
    shared: t.Mapping[str, str],
    variant: t.Mapping[str, str],
    local: t.Mapping[str, str],
) -> t.Dict[str, str]:
    result: t.Dict[str, str] = {}
    for mapping in (shared, variant, local):
        for key, value in mapping.items():
            result[str(key)] = str(value)
    return result


def encode_body(body: t.Any, headers: t.MutableMapping[str, str]) -> t.Optional[bytes]:
    if body is None:
        return None
    if isinstance(body, (bytes, bytearray)):
        return bytes(body)
    if isinstance(body, str):
        return body.encode("utf-8")

    # Assume JSON payload
    headers.setdefault("Content-Type", "application/json")
    return json.dumps(body, separators=(",", ":")).encode("utf-8")


def decode_body(content: bytes, headers: t.Mapping[str, str]) -> str:
    charset = "utf-8"
    content_type = headers.get("Content-Type") or ""
    if "charset=" in content_type:
        charset = content_type.split("charset=")[-1].split(";")[0].strip()
    try:
        return content.decode(charset or "utf-8")
    except (LookupError, UnicodeDecodeError):
        return content.decode("utf-8", errors="replace")


def compare_payloads(
    target: t.Dict[str, t.Any],
    legacy: t.Tuple[int, t.Mapping[str, str], bytes],
    modern: t.Tuple[int, t.Mapping[str, str], bytes],
) -> t.Tuple[bool, str]:
    expected_status = target.get("expected_status")
    compare_mode = str(target.get("compare", ComparisonMode.JSON)).lower()
    ignore_keys = set(target.get("ignore_keys") or [])

    legacy_status, legacy_headers, legacy_body = legacy
    modern_status, modern_headers, modern_body = modern

    if expected_status is not None:
        if legacy_status != expected_status or modern_status != expected_status:
            return (
                False,
                f"Status mismatch (expected {expected_status}, "
                f"legacy={legacy_status}, modern={modern_status})",
            )

    if compare_mode == ComparisonMode.STATUS:
        if legacy_status != modern_status:
            return (
                False,
                f"Status mismatch: legacy={legacy_status}, modern={modern_status}",
            )
        return True, "Status codes match."

    legacy_text = decode_body(legacy_body, legacy_headers)
    modern_text = decode_body(modern_body, modern_headers)

    if compare_mode == ComparisonMode.TEXT:
        if legacy_text != modern_text:
            return False, "Body text differs."
        return True, "Body text matches."

    # Default to JSON comparison
    try:
        legacy_json = json.loads(legacy_text) if legacy_text else None
        modern_json = json.loads(modern_text) if modern_text else None
    except json.JSONDecodeError as error:
        return False, f"JSON decode error: {error}"

    legacy_norm = normalize_json(legacy_json, ignore_keys)
    modern_norm = normalize_json(modern_json, ignore_keys)

    if legacy_norm != modern_norm:
        return False, "JSON payload differs."

    return True, "JSON payload matches."


def normalize_json(payload: t.Any, ignore_keys: t.Set[str]) -> t.Any:
    if isinstance(payload, dict):
        result: t.Dict[str, t.Any] = {}
        for key, value in payload.items():
            if key in ignore_keys:
                continue
            result[key] = normalize_json(value, ignore_keys)
        return result
    if isinstance(payload, list):
        return [normalize_json(item, ignore_keys) for item in payload]
    return payload


def run_checks(args: argparse.Namespace, config: t.Dict[str, t.Any]) -> int:
    shared_headers = config.get("defaults", {}).get("headers", {})
    legacy_headers = config.get("defaults", {}).get("legacy_headers", {})
    modern_headers = config.get("defaults", {}).get("modern_headers", {})

    total = 0
    failures = 0
    for target in config["targets"]:
        total += 1
        name = target.get("name") or target.get("path")
        try:
            legacy_response = make_request(
                args.legacy_base,
                target,
                args.timeout,
                shared_headers,
                {**legacy_headers, **target.get("legacy_headers", {})},
            )
            modern_response = make_request(
                args.modern_base,
                target,
                args.timeout,
                shared_headers,
                {**modern_headers, **target.get("modern_headers", {})},
            )
            success, message = compare_payloads(target, legacy_response, modern_response)
        except Exception as error:  # pylint: disable=broad-except
            failures += 1
            print(f"[FAIL] {name}: {error}", file=sys.stderr)
            if args.fail_fast:
                break
            continue

        if success:
            print(f"[PASS] {name}: {message}")
        else:
            failures += 1
            print(f"[FAIL] {name}: {message}", file=sys.stderr)
            if args.fail_fast:
                break

    print(f"Completed {total} target(s) with {failures} failure(s).")
    return 1 if failures else 0


def main() -> None:
    parser = build_argument_parser()
    args = parser.parse_args()
    ensure_base_urls(args)
    config = load_config(args.config)
    exit_code = run_checks(args, config)
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
