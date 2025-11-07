#!/usr/bin/env python3
"""API インベントリからスモークテスト用設定ファイルの雛形を生成する。"""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Any, Dict, List

import yaml


def load_inventory(path: Path) -> List[Dict[str, Any]]:
    data = yaml.safe_load(path.read_text())
    endpoints: List[Dict[str, Any]] = []
    for resource_entry in data.get("resources", []):
        for endpoint_entry in resource_entry.get("endpoints", []):
            endpoints.append(endpoint_entry)
    return endpoints


def build_case(endpoint: Dict[str, Any]) -> Dict[str, Any]:
    template = endpoint.get("path_template") or endpoint.get("path")
    placeholders = re.findall(r"\{([^{}]+)\}", template or "")
    case: Dict[str, Any] = {
        "id": endpoint.get("id"),
        "match": {
            "resource": endpoint.get("resource"),
            "http_method": endpoint.get("http_method"),
            "path": template,
        },
    }
    if placeholders:
        case["path_params"] = {name: "<REQUIRED>" for name in placeholders}
    if endpoint.get("requires_body"):
        case["body"] = "<REQUIRED>"
    return case


def main() -> None:
    parser = argparse.ArgumentParser(description="スモークテスト設定の雛形生成")
    parser.add_argument("--inventory", type=Path, default=Path(__file__).parent / "api_inventory.yaml")
    parser.add_argument("--output", type=Path, default=Path("test_config.skeleton.yaml"))
    args = parser.parse_args()

    endpoints = load_inventory(args.inventory)
    skeleton = {
        "defaults": {
            "headers": {
                "userName": "<施設ID:ユーザーID>",
                "password": "<MD5パスワード>",
                "clientUUID": "<クライアントUUID>",
            },
            "path_params": {},
            "query": {},
            "expected_status": [200],
            "compare": {
                "mode": "auto",
                "ignore_fields": [],
            },
        },
        "cases": [],
    }

    for endpoint in endpoints:
        skeleton["cases"].append(build_case(endpoint))

    args.output.write_text(yaml.safe_dump(skeleton, sort_keys=False, allow_unicode=True))
    print(f"generated skeleton -> {args.output}")


if __name__ == "__main__":
    main()
