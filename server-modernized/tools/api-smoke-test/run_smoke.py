#!/usr/bin/env python3
"""既存サーバー API を一括叩いてレスポンス差分を確認するスモークテストスクリプト。

1. `api_inventory.yaml` に列挙されたエンドポイントを読み込む。
2. `--config` で渡されたテストデータを解決し、各 API へリクエストを送信する。
3. `--secondary-base-url` が指定されている場合は新旧サーバーのレスポンスを比較する。

テストデータの書式は `test_config.sample.yaml` を参照。
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import httpx
import yaml


@dataclass
class Endpoint:
    id: str
    resource: str
    http_method: str
    path_template: str
    requires_body: bool
    notes: str = ""
    signature: str = ""
    source_file: Optional[str] = None


@dataclass
class RequestSpec:
    headers: Dict[str, Any] = field(default_factory=dict)
    query: Dict[str, Any] = field(default_factory=dict)
    path_params: Dict[str, Any] = field(default_factory=dict)
    body: Any = None
    body_format: Optional[str] = None
    expected_status: Iterable[int] = field(default_factory=lambda: [200])
    compare_mode: str = "auto"
    compare_ignore_fields: List[str] = field(default_factory=list)
    skip: bool = False


@dataclass
class ExecutionResult:
    endpoint: Endpoint
    status_primary: Optional[int] = None
    status_secondary: Optional[int] = None
    success: bool = False
    mismatch: bool = False
    skipped: bool = False
    message: str = ""
    elapsed_primary: Optional[float] = None
    elapsed_secondary: Optional[float] = None


def load_inventory(path: Path) -> List[Endpoint]:
    data = yaml.safe_load(path.read_text())
    endpoints: List[Endpoint] = []
    for resource_entry in data.get("resources", []):
        source_file = resource_entry.get("source_file")
        for endpoint_entry in resource_entry.get("endpoints", []):
            path_template = endpoint_entry.get("path_template") or endpoint_entry.get("path")
            if not path_template:
                raise ValueError(f"path_template が空です: {endpoint_entry}")
            endpoints.append(
                Endpoint(
                    id=str(endpoint_entry.get("id")),
                    resource=str(endpoint_entry.get("resource") or resource_entry.get("resource")),
                    http_method=str(endpoint_entry.get("http_method")),
                    path_template=str(path_template),
                    requires_body=bool(endpoint_entry.get("requires_body", False)),
                    notes=str(endpoint_entry.get("notes", "")),
                    signature=str(endpoint_entry.get("signature", "")),
                    source_file=source_file,
                )
            )
    return endpoints


def _merge_dict(base: Dict[str, Any], override: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    result = dict(base)
    if override:
        for key, value in override.items():
            if value is None:
                result.pop(key, None)
            else:
                result[key] = value
    return result


def find_case_config(endpoint: Endpoint, cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    for case in cases:
        case_id = case.get("id")
        match_def = case.get("match", {})
        if case_id and case_id == endpoint.id:
            return case
        if match_def:
            if match_def.get("resource") and match_def["resource"] != endpoint.resource:
                continue
            if match_def.get("http_method") and match_def["http_method"].upper() != endpoint.http_method.upper():
                continue
            if match_def.get("path") and match_def["path"] != endpoint.path_template:
                continue
            return case
    return {}


def resolve_request_spec(
    endpoint: Endpoint,
    defaults: Dict[str, Any],
    case: Dict[str, Any],
) -> RequestSpec:
    headers = _merge_dict(defaults.get("headers", {}), case.get("headers"))
    query = _merge_dict(defaults.get("query", {}), case.get("query"))
    path_params = _merge_dict(defaults.get("path_params", {}), case.get("path_params"))

    body = case.get("body")
    if body is None and "body" in defaults:
        body = defaults.get("body")

    body_format = case.get("body_format") or defaults.get("body_format")

    expected = case.get("expected_status") or defaults.get("expected_status")
    if expected is None:
        expected = [200]
    if isinstance(expected, int):
        expected_status = [expected]
    else:
        expected_status = list(expected)

    compare_def = defaults.get("compare", {})
    compare_case = case.get("compare", {})
    compare_mode = compare_case.get("mode") or compare_def.get("mode") or "auto"
    ignore_fields = list(compare_def.get("ignore_fields", []))
    if compare_case.get("ignore_fields"):
        ignore_fields = list(compare_case.get("ignore_fields"))

    skip = bool(case.get("skip", False) or defaults.get("skip", False))

    return RequestSpec(
        headers=headers,
        query=query,
        path_params=path_params,
        body=body,
        body_format=body_format,
        expected_status=expected_status,
        compare_mode=compare_mode,
        compare_ignore_fields=ignore_fields,
        skip=skip,
    )


def build_path(template: str, params: Dict[str, Any]) -> str:
    missing: List[str] = []

    def repl(match: re.Match[str]) -> str:
        key = match.group(1)
        if key not in params:
            missing.append(key)
            return match.group(0)
        return str(params[key])

    path = re.sub(r"\{([^{}]+)\}", repl, template)
    if missing:
        raise KeyError(f"パスパラメータ {missing} が設定されていません")
    if not path.startswith("/"):
        path = "/" + path
    return path


def prepare_request_kwargs(spec: RequestSpec) -> Tuple[Dict[str, Any], Optional[str]]:
    kwargs: Dict[str, Any] = {
        "headers": spec.headers,
        "params": spec.query,
    }
    body_mode = None
    body = spec.body
    if body is not None:
        mode = (spec.body_format or "auto").lower()
        if mode == "auto":
            mode = "json" if isinstance(body, (dict, list)) else "raw"
        if mode == "json":
            kwargs["json"] = body
        elif mode == "form":
            kwargs["data"] = body
        elif mode == "raw":
            if isinstance(body, str):
                kwargs["content"] = body.encode("utf-8")
            else:
                kwargs["content"] = body
        else:
            raise ValueError(f"body_format '{mode}' は未対応です")
        body_mode = mode
    return kwargs, body_mode


def canonicalize_response_body(response: httpx.Response, mode: str, ignore_fields: List[str]) -> Any:
    content_type = response.headers.get("content-type", "").lower()
    resolved_mode = mode
    if mode == "status":
        return None
    if mode in ("auto", "default"):
        if "json" in content_type:
            resolved_mode = "json"
        elif any(binary in content_type for binary in ("octet-stream", "pdf", "zip")):
            resolved_mode = "bytes"
        else:
            resolved_mode = "text"
    if resolved_mode == "json":
        try:
            payload = response.json()
        except Exception:
            raise ValueError("JSON レスポンスの解析に失敗しました")
        if ignore_fields and isinstance(payload, dict):
            for key in ignore_fields:
                payload.pop(key, None)
        return payload
    if resolved_mode == "bytes":
        return response.content
    return response.text


def save_artifacts(
    artifact_dir: Optional[Path],
    endpoint: Endpoint,
    request_kwargs: Dict[str, Any],
    body_mode: Optional[str],
    primary_url: str,
    primary: Optional[httpx.Response],
    secondary_url: Optional[str] = None,
    secondary: Optional[httpx.Response] = None,
) -> None:
    if artifact_dir is None:
        return
    endpoint_dir = artifact_dir / endpoint.id
    endpoint_dir.mkdir(parents=True, exist_ok=True)
    request_dump = {
        "id": endpoint.id,
        "resource": endpoint.resource,
        "method": endpoint.http_method,
        "url": primary_url,
        "headers": request_kwargs.get("headers"),
        "query": request_kwargs.get("params"),
        "body_mode": body_mode,
    }
    if "json" in request_kwargs:
        request_dump["body_json"] = request_kwargs["json"]
    if "data" in request_kwargs:
        request_dump["body_form"] = request_kwargs["data"]
    if "content" in request_kwargs:
        try:
            request_dump["body_text"] = request_kwargs["content"].decode("utf-8")
        except Exception:
            request_dump["body_bytes_base64"] = request_kwargs["content"].hex()
    (endpoint_dir / "request.json").write_text(json.dumps(request_dump, ensure_ascii=False, indent=2))

    def dump_response(name: str, url: str, resp: httpx.Response) -> None:
        body_representation: Dict[str, Any] = {
            "status": resp.status_code,
            "headers": dict(resp.headers),
            "url": url,
        }
        try:
            body_representation["body_json"] = resp.json()
        except Exception:
            try:
                body_representation["body_text"] = resp.text
            except Exception:
                body_representation["body_bytes_base64"] = resp.content.hex()
        (endpoint_dir / f"{name}.json").write_text(json.dumps(body_representation, ensure_ascii=False, indent=2))

    if primary is not None:
        dump_response("primary_response", primary_url, primary)
    if secondary is not None and secondary_url is not None:
        dump_response("secondary_response", secondary_url, secondary)


def execute(
    endpoints: List[Endpoint],
    defaults: Dict[str, Any],
    cases: List[Dict[str, Any]],
    primary_base_url: str,
    secondary_base_url: Optional[str],
    timeout: float,
    verify_tls: bool,
    artifact_dir: Optional[Path],
    allow_skips: bool,
) -> Tuple[List[ExecutionResult], bool]:
    results: List[ExecutionResult] = []
    base_primary = primary_base_url.rstrip("/")
    base_secondary = secondary_base_url.rstrip("/") if secondary_base_url else None

    if artifact_dir:
        if artifact_dir.exists():
            # 既存成果物は削除する
            for child in artifact_dir.glob("*"):
                if child.is_dir():
                    for sub in child.glob("*"):
                        sub.unlink()
                    child.rmdir()
                else:
                    child.unlink()
        artifact_dir.mkdir(parents=True, exist_ok=True)

    with httpx.Client(base_url=base_primary, timeout=timeout, verify=verify_tls) as primary_client:
        secondary_client = None
        if base_secondary:
            secondary_client = httpx.Client(base_url=base_secondary, timeout=timeout, verify=verify_tls)
        try:
            for endpoint in endpoints:
                case_config = find_case_config(endpoint, cases)
                spec = resolve_request_spec(endpoint, defaults, case_config)
                result = ExecutionResult(endpoint=endpoint)
                if spec.skip:
                    result.skipped = True
                    result.success = allow_skips
                    result.message = "skip 指定" if allow_skips else "skip 指定のため未実行"
                    results.append(result)
                    continue
                try:
                    path = build_path(endpoint.path_template, spec.path_params)
                except KeyError as exc:
                    result.message = f"パス展開エラー: {exc}"
                    results.append(result)
                    continue
                if endpoint.requires_body and spec.body is None:
                    result.message = "リクエストボディが設定されていません"
                    results.append(result)
                    continue
                request_kwargs, body_mode = prepare_request_kwargs(spec)
                url_primary = path
                try:
                    start = time.perf_counter()
                    response = primary_client.request(endpoint.http_method, url_primary, **request_kwargs)
                    result.elapsed_primary = time.perf_counter() - start
                except Exception as exc:  # noqa: BLE001
                    result.message = f"旧サーバー呼び出し失敗: {exc}"
                    results.append(result)
                    continue

                result.status_primary = response.status_code
                if result.status_primary not in spec.expected_status:
                    result.message = f"期待ステータス {spec.expected_status} と不一致"
                    save_artifacts(artifact_dir, endpoint, request_kwargs, body_mode, primary_client.base_url.join(url_primary).human_repr(), response)
                    results.append(result)
                    continue

                secondary_response = None
                url_secondary = None
                if secondary_client is not None:
                    url_secondary = path
                    try:
                        start = time.perf_counter()
                        secondary_response = secondary_client.request(endpoint.http_method, url_secondary, **request_kwargs)
                        result.elapsed_secondary = time.perf_counter() - start
                    except Exception as exc:  # noqa: BLE001
                        result.message = f"新サーバー呼び出し失敗: {exc}"
                        save_artifacts(
                            artifact_dir,
                            endpoint,
                            request_kwargs,
                            body_mode,
                            primary_client.base_url.join(url_primary).human_repr(),
                            response,
                        )
                        results.append(result)
                        continue
                    result.status_secondary = secondary_response.status_code
                    if result.status_secondary not in spec.expected_status:
                        result.message = f"新サーバーのステータス {result.status_secondary} が期待値 {spec.expected_status} と不一致"
                        save_artifacts(
                            artifact_dir,
                            endpoint,
                            request_kwargs,
                            body_mode,
                            primary_client.base_url.join(url_primary).human_repr(),
                            response,
                            secondary_client.base_url.join(url_secondary).human_repr(),
                            secondary_response,
                        )
                        results.append(result)
                        continue
                    try:
                        primary_body = canonicalize_response_body(response, spec.compare_mode, spec.compare_ignore_fields)
                        secondary_body = canonicalize_response_body(secondary_response, spec.compare_mode, spec.compare_ignore_fields)
                        if primary_body != secondary_body:
                            result.mismatch = True
                            result.message = "レスポンスボディが一致しません"
                        else:
                            result.success = True
                    except Exception as exc:  # noqa: BLE001
                        result.message = f"レスポンス比較失敗: {exc}"
                    save_artifacts(
                        artifact_dir,
                        endpoint,
                        request_kwargs,
                        body_mode,
                        primary_client.base_url.join(url_primary).human_repr(),
                        response,
                        secondary_client.base_url.join(url_secondary).human_repr(),
                        secondary_response,
                    )
                else:
                    result.success = True
                    save_artifacts(
                        artifact_dir,
                        endpoint,
                        request_kwargs,
                        body_mode,
                        primary_client.base_url.join(url_primary).human_repr(),
                        response,
                    )
                results.append(result)
        finally:
            if secondary_client is not None:
                secondary_client.close()
    has_error = any((not r.success and not r.skipped) or r.mismatch for r in results)
    if not allow_skips and any(r.skipped for r in results):
        has_error = True
    return results, has_error


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="旧サーバー API スモークテスト")
    parser.add_argument("--inventory", type=Path, default=Path(__file__).parent / "api_inventory.yaml", help="API インベントリのパス")
    parser.add_argument("--config", type=Path, required=True, help="テストデータ設定ファイル")
    parser.add_argument("--primary-base-url", required=True, help="旧サーバーのベース URL (例: https://legacy.example.com/api)")
    parser.add_argument("--secondary-base-url", help="比較対象サーバーのベース URL")
    parser.add_argument("--timeout", type=float, default=30.0, help="HTTP タイムアウト秒")
    parser.add_argument("--insecure", action="store_true", help="TLS 証明書検証を無効化する")
    parser.add_argument("--artifact-dir", type=Path, help="レスポンスを保存するディレクトリ")
    parser.add_argument("--allow-skips", action="store_true", help="skip 指定されたエンドポイントを失敗扱いにしない")
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    inventory = load_inventory(args.inventory)
    config = yaml.safe_load(args.config.read_text())
    defaults = config.get("defaults", {})
    cases = config.get("cases", [])

    results, has_error = execute(
        endpoints=inventory,
        defaults=defaults,
        cases=cases,
        primary_base_url=args.primary_base_url,
        secondary_base_url=args.secondary_base_url,
        timeout=args.timeout,
        verify_tls=not args.insecure,
        artifact_dir=args.artifact_dir,
        allow_skips=args.allow_skips,
    )

    success_count = sum(1 for r in results if r.success)
    mismatch_count = sum(1 for r in results if r.mismatch)
    skipped_count = sum(1 for r in results if r.skipped)
    failure_count = sum(1 for r in results if not r.success and not r.skipped)

    print("==== スモークテスト結果 ====")
    print(f"成功: {success_count}")
    print(f"不一致: {mismatch_count}")
    print(f"失敗: {failure_count}")
    print(f"スキップ: {skipped_count}")
    for result in results:
        status = "OK" if result.success else ("SKIP" if result.skipped else ("MISMATCH" if result.mismatch else "FAIL"))
        primary_status = result.status_primary if result.status_primary is not None else "-"
        secondary_status = result.status_secondary if result.status_secondary is not None else "-"
        print(f"[{status}] {result.endpoint.http_method} {result.endpoint.path_template} -> primary={primary_status} secondary={secondary_status} {result.message}")

    return 1 if has_error else 0


if __name__ == "__main__":
    sys.exit(main())
