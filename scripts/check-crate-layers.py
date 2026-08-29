#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
crates 分层依赖校验

规则：brier-* crate 只能依赖层号严格更低的 brier-* crate
      （禁止同层依赖、禁止反向依赖）

层映射：foundation(0) < primitives(1) < domain(2) < infrastructure(3) < application(4)

用法：python3 scripts/check-crate-layers.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "Cargo.toml"

LAYER = {
    "foundation": 0,
    "primitives": 1,
    "domain": 2,
    "infrastructure": 3,
    "application": 4,
}

# 形如: brier-error = { path = "crates/foundation/brier-error" }
PATH_RE = re.compile(
    r'^([a-z][a-z0-9_-]*)\s*=\s*\{\s*path\s*=\s*"crates/([a-z]+)/[^"]+"'
)
NAME_RE = re.compile(r'^name\s*=\s*"([^"]+)"', re.MULTILINE)
DEP_RE = re.compile(r"brier-[a-z-]+")


def parse_workspace_manifest() -> dict:
    """解析 workspace.dependencies 段，返回 crate 名 -> (层目录, 层号)。"""
    crate_info = {}
    in_workspace_deps = False
    for line in MANIFEST.read_text().splitlines():
        if line.startswith("[workspace.dependencies]"):
            in_workspace_deps = True
            continue
        if line.startswith("["):
            in_workspace_deps = False
            continue
        if in_workspace_deps:
            m = PATH_RE.match(line.strip())
            if m:
                name, layer_dir = m.group(1), m.group(2)
                layer = LAYER.get(layer_dir, 255)
                crate_info[name] = (layer_dir, layer)
    return crate_info


def main() -> int:
    crate_info = parse_workspace_manifest()
    violations = []

    for toml in sorted((ROOT / "crates").glob("*/*/Cargo.toml")):
        text = toml.read_text()
        # 去除注释行，避免注释文字（如"由 brier-api 开启"）被误判为依赖
        lines = [l for l in text.splitlines() if not l.strip().startswith("#")]
        text = "\n".join(lines)
        name_m = NAME_RE.search(text)
        if not name_m:
            continue
        pkg = name_m.group(1)
        src_dir, src_layer = crate_info.get(pkg, ("unknown", 255))

        deps = sorted(set(DEP_RE.findall(text)) - {pkg})
        for dep in deps:
            if dep not in crate_info:
                continue  # 第三方依赖，跳过
            dst_dir, dst_layer = crate_info[dep]
            if dst_layer >= src_layer:
                violations.append(
                    f"  x {pkg} ({src_dir}/L{src_layer}) 依赖 {dep} "
                    f"({dst_dir}/L{dst_layer}) - 违规（依赖必须指向更低层）"
                )

    if violations:
        print("分层校验失败：")
        print("\n".join(violations))
        return 1

    print("✓ 分层校验通过：全部 brier-* 依赖均指向更低层")
    return 0


if __name__ == "__main__":
    sys.exit(main())
