"use client";

import { useState, useCallback } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import { v4 as uuidv4 } from "uuid";
import { Station, Edge } from "../utils/types";
import { MapPin } from "lucide-react";

const center = { lat: 30.3165, lng: 78.0322 }; // Dehradun

const MapCanvas = ({ apiKey }: { apiKey: string }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [path, setPath] = useState<string[]>([]);
  const [mstEdges, setMstEdges] = useState<Edge[]>([]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const position = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      const name = `Station-${stations.length + 1}`;
      setStations((prev) => [...prev, { id: uuidv4(), name, position }]);
    },
    [stations]
  );

  const handleMarkerClick = (id: string) => {
    setSelected((prev) =>
      prev.length < 2 && !prev.includes(id) ? [...prev, id] : prev
    );
  };

  const connectStations = () => {
    if (selected.length === 2) {
      const weight = parseFloat(prompt("Enter weight for this edge") || "1");
      if (!isNaN(weight)) {
        setEdges((prev) => [
          ...prev,
          { from: selected[0], to: selected[1], weight },
        ]);
      }
      setSelected([]);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        network_name: "dehradun_network",
        nodes: stations.map((s) => s.name),
        edges: edges.map((e) => ({
          from: stations.find((s) => s.id === e.from)?.name!,
          to: stations.find((s) => s.id === e.to)?.name!,
          weight: e.weight,
        })),
      };

      const res = await fetch("http://localhost:5000/api/save-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save network.");
      alert("Network saved.");
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the network.");
    }
  };

  // const handleShortestPath = async () => {
  //   try {
  //     const sourceNode = stations.find((s) => s.id === source)?.name;
  //     const destNode = stations.find((s) => s.id === destination)?.name;

  //     const res = await fetch("http://localhost:5000/api/shortest-path", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         network_name: "dehradun_network",
  //         source: sourceNode,
  //         destination: destNode,
  //       }),
  //     });

  //     const data = await res.json();

  //     if (data.path) {
  //       setPath(data.path);
  //       alert(`Path: ${data.path.join(" -> ")}`);
  //     } else {
  //       alert(data.error || "Path not found.");
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     alert("Error fetching shortest path.");
  //   }
  // };
  const handleShortestPath = async () => {
    try {
      const sourceNode = stations.find((s) => s.id === source)?.name;
      const destNode = stations.find((s) => s.id === destination)?.name;

      if (!sourceNode || !destNode) {
        alert("Please select source and destination stations.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/shortest-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network_name: "dehradun_network", // Ensure this matches what you saved
          source: sourceNode,
          destination: destNode,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      if (data.path) {
        setPath(data.path);
        alert(`Path: ${data.path.join(" -> ")}`);
      } else {
        alert(data.error || "Path not found.");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching shortest path.");
    }
  };

  const handleMST = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/minimum-spanning-tree",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            network_name: "dehradun_network",
          }),
        }
      );

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      if (data.minimum_spanning_tree) {
        const mstEdgeList = data.minimum_spanning_tree.map((edge: any) => ({
          from: stations.find((s) => s.name === edge.from)?.id!,
          to: stations.find((s) => s.name === edge.to)?.id!,
          weight: edge.weight,
        }));
        setMstEdges(mstEdgeList);

        const mstPath = data.minimum_spanning_tree
          .map((edge: any) => `${edge.from} -> ${edge.to} (${edge.weight})`)
          .join("\n");

        alert(
          `Total MST Weight: ${data.total_weight}\n\nMST Edges:\n${mstPath}`
        );
      } else {
        alert(data.error || "Could not find MST");
      }
    } catch (err) {
      console.error(err);
      alert("Error finding minimum spanning tree");
    }
  };
  return (
    <div className="flex w-full h-screen">
      <div className="flex-col p-4">
        <div className="mt-4 flex gap-2 flex-col p-8 bg-white rounded shadow">
          <button
            onClick={connectStations}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Connect Selected Stations
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Save Network
          </button>

          <select
            onChange={(e) => setSource(e.target.value)}
            className="p-2 border border-gray-300 rounded shadow-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-700"
          >
            <option value="">Select Source</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            onChange={(e) => setDestination(e.target.value)}
            className="p-2 border border-gray-300 rounded shadow-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-700"
          >
            <option value="">Select Destination</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleShortestPath}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Get Shortest Path
          </button>

          <button
            onClick={handleMST}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Get MST
          </button>
        </div>
        <div className="mt-4 p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-2">
            Map Keys
          </h2>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors duration-200">
              <MapPin className="w-6 h-6 text-red-500 drop-shadow-sm" />
              <span className="text-gray-700 font-medium">
                Station (Pointer Mark)
              </span>
            </li>
            <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors duration-200">
              <div className="w-6 h-1 bg-red-500 rounded-full shadow-sm" />
              <span className="text-gray-700 font-medium">Edge (Red Line)</span>
            </li>
            <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors duration-200">
              <div className="w-6 h-1 bg-green-500 rounded-full shadow-sm" />
              <span className="text-gray-700 font-medium">
                Shortest Path (Green Line)
              </span>
            </li>
          </ul>
        </div>
      </div>

      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={13}
          onClick={handleMapClick}
        >
          {stations.map((station) => (
            <Marker
              key={station.id}
              position={station.position}
              label={station.name}
              onClick={() => handleMarkerClick(station.id)}
              // Only apply custom icon when selected, otherwise use default
              {...(selected.includes(station.id) && {
                icon: {
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new google.maps.Size(32, 32),
                },
              })}
            />
          ))}

          {edges.map((edge, idx) => {
            const from = stations.find((s) => s.id === edge.from);
            const to = stations.find((s) => s.id === edge.to);
            if (!from || !to) return null;

            return (
              <Polyline
                key={idx}
                path={[from.position, to.position]}
                options={{ strokeColor: "#FF0000", strokeWeight: 2 }}
              />
            );
          })}

          {path.length > 1 && (
            <Polyline
              path={path.map(
                (name) => stations.find((s) => s.name === name)!.position
              )}
              options={{ strokeColor: "#00FF00", strokeWeight: 3 }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default MapCanvas;
