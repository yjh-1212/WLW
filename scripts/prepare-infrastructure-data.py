"""Normalize local logistics facility points for browser rendering."""

from __future__ import annotations

import json
import heapq
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / "public" / "data" / "infrastructure"

FACILITY_SOURCES = (
    {
        "file": "全国229个国家物流枢纽_代表点.geojson",
        "id": "nationalHubs",
        "label": "国家物流枢纽",
        "nameKey": "国家物流枢纽名称",
        "provinceKey": "省级行政区",
        "cityKey": "承载城市/地区",
        "categoryKey": "枢纽类型",
        "color": "#ffe08a",
    },
    {
        "file": "全国105个国家骨干冷链物流基地_代表点.geojson",
        "id": "coldChainBases",
        "label": "骨干冷链基地",
        "nameKey": "国家骨干冷链物流基地名称",
        "provinceKey": "省级行政区",
        "cityKey": "承载城市/地区",
        "categoryKey": "批次年份",
        "color": "#83f4ff",
    },
    {
        "file": "全国规模物流园区_高可信名单_地图版.geojson",
        "id": "logisticsParks",
        "label": "规模物流园区",
        "nameKey": "园区名称",
        "provinceKey": "省份",
        "cityKey": "城市/地名",
        "categoryKey": "可信度",
        "color": "#8dffb1",
    },
)

TRANSPORT_SOURCES = (
    {
        "file": "主要公路.geojson",
        "id": "majorRoads",
        "label": "主要公路",
        "color": "#ffbf5f",
        "opacity": 0.94,
        "dashed": False,
        "z": 1.72,
    },
    {
        "file": "主要铁路.geojson",
        "id": "majorRailways",
        "label": "主要铁路",
        "color": "#80dfff",
        "opacity": 0.94,
        "dashed": True,
        "z": 1.84,
    },
)

STORY_ROUTE_LEGS = (
    {
        "id": "originShortHaul",
        "mode": "road",
        "label": "吉林粮源基地 → 吉林铁路货运站",
        "layerId": "majorRoads",
        "anchors": [[125.328656, 43.839828], [125.240517, 43.880982]],
        "color": "#ffbd59",
    },
    {
        "id": "northRail",
        "mode": "rail",
        "label": "吉林铁路货运站 → 营口港铁路场站",
        "layerId": "majorRailways",
        "anchors": [[125.240517, 43.880982], [122.22, 40.65]],
        "color": "#80dfff",
    },
    {
        "id": "coastalShipping",
        "mode": "sea",
        "label": "营口港 → 湛江港",
        "anchors": [
            [122.22, 40.65], [121.35, 38.78], [122.65, 36.60], [123.10, 33.10],
            [122.35, 29.55], [121.15, 26.20], [119.65, 23.55], [117.20, 22.15],
            [114.45, 21.45], [112.35, 20.55], [110.41, 21.19],
        ],
        "color": "#56e6ff",
    },
    {
        "id": "arrivalPortTransfer",
        "mode": "road",
        "label": "湛江港 → 湛江铁路货运站",
        "layerId": "majorRoads",
        "anchors": [[110.41, 21.19], [110.235968, 21.374145]],
        "color": "#ffbd59",
    },
    {
        "id": "southRail",
        "mode": "rail",
        "label": "湛江铁路货运站 → 佛山铁路货运站",
        "layerId": "majorRailways",
        "anchors": [[110.235968, 21.374145], [112.851869, 23.155553]],
        "color": "#80dfff",
    },
    {
        "id": "destinationShortHaul",
        "mode": "road",
        "label": "佛山铁路货运站 → 佛山粮油消费工厂",
        "layerId": "majorRoads",
        "anchors": [[112.851869, 23.155553], [113.00, 23.10]],
        "color": "#ffbd59",
    },
)


def prepare_transport() -> dict:
    layers = []
    for source in TRANSPORT_SOURCES:
        source_path = DATA_DIR / source["file"]
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        payload = json.loads(source_path.read_text(encoding="utf-8"))
        segments = []
        feature_count = 0
        for feature in payload.get("features", []):
            geometry = feature.get("geometry") or {}
            if geometry.get("type") == "LineString":
                lines = [geometry.get("coordinates") or []]
            elif geometry.get("type") == "MultiLineString":
                lines = geometry.get("coordinates") or []
            else:
                continue
            emitted = False
            for line in lines:
                for start, end in zip(line, line[1:]):
                    if len(start) < 2 or len(end) < 2:
                        continue
                    values = [float(start[0]), float(start[1]), float(end[0]), float(end[1])]
                    if not all(math.isfinite(value) for value in values):
                        continue
                    segments.extend(round(value, 6) for value in values)
                    emitted = True
            if emitted:
                feature_count += 1
        layers.append({
            "id": source["id"],
            "label": source["label"],
            "source": source["file"],
            "featureCount": feature_count,
            "segmentCount": len(segments) // 4,
            "color": source["color"],
            "opacity": source["opacity"],
            "dashed": source["dashed"],
            "z": source["z"],
            "segments": segments,
        })
    return {
        "meta": {
            "title": "全国主要公路与主要铁路",
            "coordinateSystem": "WGS84",
            "note": "线位与属性沿用用户提供的本地 GeoJSON 数据。",
        },
        "layers": layers,
    }


def prepare_facilities() -> dict:
    layers = []
    for source in FACILITY_SOURCES:
        source_path = DATA_DIR / source["file"]
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        payload = json.loads(source_path.read_text(encoding="utf-8"))
        points = []
        for index, feature in enumerate(payload.get("features", []), start=1):
            geometry = feature.get("geometry") or {}
            coordinates = geometry.get("coordinates")
            if geometry.get("type") != "Point" or not coordinates or len(coordinates) < 2:
                continue
            properties = feature.get("properties") or {}
            points.append({
                "id": f'{source["id"]}-{index}',
                "name": properties.get(source["nameKey"]) or f'{source["label"]} {index}',
                "province": properties.get(source["provinceKey"]) or "—",
                "city": properties.get(source["cityKey"]) or "—",
                "category": str(properties.get(source["categoryKey"]) or source["label"]),
                "coordinates": [round(float(coordinates[0]), 6), round(float(coordinates[1]), 6)],
            })
        layers.append({
            "id": source["id"],
            "label": source["label"],
            "source": source["file"],
            "count": len(points),
            "color": source["color"],
            "points": points,
        })
    return {
        "meta": {
            "title": "国家物流设施代表点",
            "coordinateSystem": "WGS84",
            "note": "点位沿用用户提供数据中的全国尺度代表点，具体边界和门牌位置以源数据说明为准。",
        },
        "layers": layers,
    }


def distance(left: tuple[float, float], right: tuple[float, float]) -> float:
    latitude = math.radians((left[1] + right[1]) / 2)
    dx = (left[0] - right[0]) * math.cos(latitude)
    dy = left[1] - right[1]
    return math.hypot(dx, dy)


def build_transport_graph(layer: dict) -> tuple[dict, set]:
    graph = {}
    segments = layer.get("segments") or []
    for index in range(0, len(segments), 4):
        start = (segments[index], segments[index + 1])
        end = (segments[index + 2], segments[index + 3])
        weight = distance(start, end)
        graph.setdefault(start, []).append((end, weight))
        graph.setdefault(end, []).append((start, weight))

    visited = set()
    largest = set()
    for node in graph:
        if node in visited:
            continue
        component = {node}
        stack = [node]
        visited.add(node)
        while stack:
            current = stack.pop()
            for neighbor, _ in graph[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    component.add(neighbor)
                    stack.append(neighbor)
        if len(component) > len(largest):
            largest = component
    return graph, largest


def nearest_node(nodes: set, target: list[float]) -> tuple[float, float]:
    coordinate = (float(target[0]), float(target[1]))
    return min(nodes, key=lambda node: distance(node, coordinate))


def shortest_path(graph: dict, allowed: set, start: tuple, end: tuple) -> list[tuple]:
    queue = [(0.0, start)]
    costs = {start: 0.0}
    previous = {}
    while queue:
        cost, current = heapq.heappop(queue)
        if current == end:
            break
        if cost != costs.get(current):
            continue
        for neighbor, weight in graph[current]:
            if neighbor not in allowed:
                continue
            next_cost = cost + weight
            if next_cost >= costs.get(neighbor, math.inf):
                continue
            costs[neighbor] = next_cost
            previous[neighbor] = current
            heapq.heappush(queue, (next_cost, neighbor))
    if end not in costs:
        raise RuntimeError(f"No transport path between {start} and {end}")
    path = [end]
    while path[-1] != start:
        path.append(previous[path[-1]])
    path.reverse()
    return path


def point_line_distance(point: tuple, start: tuple, end: tuple) -> float:
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    if dx == 0 and dy == 0:
        return distance(point, start)
    amount = max(0.0, min(1.0, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)))
    projection = (start[0] + amount * dx, start[1] + amount * dy)
    return distance(point, projection)


def simplify_path(points: list[tuple], tolerance: float = 0.0025) -> list[tuple]:
    if len(points) <= 2:
        return points
    start, end = points[0], points[-1]
    split_index = 0
    max_distance = 0.0
    for index in range(1, len(points) - 1):
        current_distance = point_line_distance(points[index], start, end)
        if current_distance > max_distance:
            split_index = index
            max_distance = current_distance
    if max_distance <= tolerance:
        return [start, end]
    left = simplify_path(points[:split_index + 1], tolerance)
    right = simplify_path(points[split_index:], tolerance)
    return left[:-1] + right


def prepare_story_route(transport: dict) -> dict:
    layers = {layer["id"]: layer for layer in transport["layers"]}
    graphs = {}
    output_legs = []
    for definition in STORY_ROUTE_LEGS:
        if definition["mode"] == "sea":
            path = [tuple(coordinate) for coordinate in definition["anchors"]]
            source = "中国沿海航线示意节点（WGS84）"
            snap_distances = []
        else:
            layer_id = definition["layerId"]
            if layer_id not in graphs:
                graphs[layer_id] = build_transport_graph(layers[layer_id])
            graph, largest = graphs[layer_id]
            snapped = [nearest_node(largest, coordinate) for coordinate in definition["anchors"]]
            path = []
            for start, end in zip(snapped, snapped[1:]):
                section = shortest_path(graph, largest, start, end)
                path.extend(section if not path else section[1:])
            path = simplify_path(path)
            source = layers[layer_id]["source"]
            snap_distances = [round(distance(node, tuple(anchor)) * 111, 2) for node, anchor in zip(snapped, definition["anchors"])]
        output_legs.append({
            "id": definition["id"],
            "mode": definition["mode"],
            "label": definition["label"],
            "source": source,
            "color": definition["color"],
            "path": [[round(point[0], 6), round(point[1], 6)] for point in path],
            "snapDistanceKm": snap_distances,
        })
    return {
        "meta": {
            "title": "北粮南运公铁海多式联运路线",
            "coordinateSystem": "WGS84",
            "note": "公路和铁路路径沿用户提供的线网图搜索生成；海路按中国近海航向节点概化，仅用于业务演示。",
        },
        "legs": output_legs,
    }


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    transport = prepare_transport()
    facilities = prepare_facilities()
    story_route = prepare_story_route(transport)
    manifest = {
        "dataset": "national-logistics-infrastructure",
        "version": "1.0.0-local",
        "coordinateSystem": "WGS84",
        "transportLayers": [
            {key: layer[key] for key in ("id", "label", "featureCount", "segmentCount")}
            for layer in transport["layers"]
        ],
        "facilityLayers": [
            {key: layer[key] for key in ("id", "label", "count")}
            for layer in facilities["layers"]
        ],
        "storyRoute": [
            {"id": leg["id"], "mode": leg["mode"], "points": len(leg["path"]), "snapDistanceKm": leg["snapDistanceKm"]}
            for leg in story_route["legs"]
        ],
        "files": ["transport.json", "facilities.json", "north-grain-route.json"],
    }
    write_json(OUTPUT_DIR / "transport.json", transport)
    write_json(OUTPUT_DIR / "facilities.json", facilities)
    write_json(OUTPUT_DIR / "north-grain-route.json", story_route)
    write_json(OUTPUT_DIR / "manifest.json", manifest)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
