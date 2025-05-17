from flask import Flask, request, jsonify
import os
import json
import heapq

from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow only your frontend



# Directory to store saved networks
NETWORKS_DIR = "saved_networks"
os.makedirs(NETWORKS_DIR, exist_ok=True)

# Utility: Dijkstra's algorithm
def dijkstra(nodes, edges, source, destination):
    # Validate inputs
    if source not in nodes:
        raise ValueError(f"Source node '{source}' not found in network")
    if destination not in nodes:
        raise ValueError(f"Destination node '{destination}' not found in network")
        
    graph = {node: [] for node in nodes}
    for edge in edges:
        # Ensure the edge data is valid
        if not all(key in edge for key in ["from", "to", "weight"]):
            raise ValueError("Edge missing required fields (from, to, weight)")
            
        # Ensure the nodes in the edge exist in the graph
        if edge["from"] not in nodes or edge["to"] not in nodes:
            raise ValueError(f"Edge references nonexistent node: {edge}")
            
        # Add edges in both directions (undirected graph)
        graph[edge["from"]].append((edge["to"], float(edge["weight"])))
        graph[edge["to"]].append((edge["from"], float(edge["weight"])))

    dist = {node: float('inf') for node in nodes}
    dist[source] = 0
    prev = {node: None for node in nodes}

    heap = [(0, source)]
    while heap:
        current_dist, current_node = heapq.heappop(heap)

        if current_node == destination:
            break

        # Skip if we've found a better path already
        if current_dist > dist[current_node]:
            continue

        for neighbor, weight in graph[current_node]:
            distance = current_dist + weight
            if distance < dist[neighbor]:
                dist[neighbor] = distance
                prev[neighbor] = current_node
                heapq.heappush(heap, (distance, neighbor))

    # Reconstruct path
    if dist[destination] == float('inf'):
        return [], None  # No path found
        
    path = []
    node = destination
    while node:
        path.append(node)
        node = prev[node]
    path.reverse()

    return path, dist[destination]


@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"})


@app.route("/api/save-network", methods=["POST"])
def save_network():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400
            
        name = data.get("network_name")
        nodes = data.get("nodes")
        edges = data.get("edges")

        if not name:
            return jsonify({"error": "Missing network_name field"}), 400
        if not nodes:
            return jsonify({"error": "Missing nodes field"}), 400
        if not edges:
            return jsonify({"error": "Missing edges field"}), 400

        # Validate network name (avoid directory traversal attacks)
        if "/" in name or "\\" in name or ".." in name:
            return jsonify({"error": "Invalid network name"}), 400

        # Ensure nodes is a list of strings
        if not isinstance(nodes, list):
            return jsonify({"error": "Nodes must be a list"}), 400
            
        # Ensure edges is a list of dictionaries with required fields
        if not isinstance(edges, list):
            return jsonify({"error": "Edges must be a list"}), 400
        
        for edge in edges:
            if not isinstance(edge, dict) or not all(key in edge for key in ["from", "to", "weight"]):
                return jsonify({"error": "Each edge must have 'from', 'to', and 'weight' fields"}), 400

        filepath = os.path.join(NETWORKS_DIR, f"{name}.json")
        with open(filepath, 'w') as f:
            json.dump({"nodes": nodes, "edges": edges}, f)

        return jsonify({"message": "Network saved successfully."})
        
    except Exception as e:
        return jsonify({"error": f"Failed to save network: {str(e)}"}), 500


@app.route("/api/load-network", methods=["GET"])
def load_network():
    try:
        name = request.args.get("name")
        if not name:
            return jsonify({"error": "Missing network name parameter"}), 400
            
        # Validate network name (avoid directory traversal attacks)
        if "/" in name or "\\" in name or ".." in name:
            return jsonify({"error": "Invalid network name"}), 400
            
        path = os.path.join(NETWORKS_DIR, f"{name}.json")

        if not os.path.exists(path):
            return jsonify({"error": f"Network '{name}' not found"}), 404

        with open(path, 'r') as f:
            data = json.load(f)
        return jsonify(data)
        
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON format in network file"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to load network: {str(e)}"}), 500


@app.route("/api/networks", methods=["GET"])
def list_networks():
    try:
        files = os.listdir(NETWORKS_DIR)
        networks = [f.replace(".json", "") for f in files if f.endswith(".json")]
        return jsonify({"networks": networks})
    except Exception as e:
        return jsonify({"error": f"Failed to list networks: {str(e)}"}), 500


@app.route("/api/shortest-path", methods=["POST"])
def shortest_path():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400
            
        source = data.get("source")
        destination = data.get("destination")
        
        if not source:
            return jsonify({"error": "Missing source node"}), 400
        if not destination:
            return jsonify({"error": "Missing destination node"}), 400

        if "network_name" in data:
            # Load saved network
            name = data["network_name"]
            
            # Validate network name
            if "/" in name or "\\" in name or ".." in name:
                return jsonify({"error": "Invalid network name"}), 400
                
            path = os.path.join(NETWORKS_DIR, f"{name}.json")
            if not os.path.exists(path):
                return jsonify({"error": f"Network '{name}' not found"}), 404
                
            with open(path, 'r') as f:
                saved = json.load(f)
            nodes = saved.get("nodes", [])
            edges = saved.get("edges", [])
        else:
            nodes = data.get("nodes", [])
            edges = data.get("edges", [])
            
            if not nodes:
                return jsonify({"error": "Missing nodes"}), 400
            if not edges:
                return jsonify({"error": "Missing edges"}), 400

        path, distance = dijkstra(nodes, edges, source, destination)
        
        if not path:
            return jsonify({"error": f"No path found from '{source}' to '{destination}'"}), 404
            
        return jsonify({
            "path": path, 
            "total_distance": distance,
            "node_count": len(path)
        })
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to find shortest path: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)