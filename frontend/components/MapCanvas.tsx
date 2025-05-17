"use client";

import { useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";
import { v4 as uuidv4 } from "uuid";
import { Station, Edge } from "../utils/types";

const center = { lat: 30.3165, lng: 78.0322 }; // Dehradun

const MapCanvas = ({ apiKey }: { apiKey: string }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [path, setPath] = useState<string[]>([]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const position = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    const name = `Station-${stations.length + 1}`;
    setStations((prev) => [...prev, { id: uuidv4(), name, position }]);
  }, [stations]);

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
        network_name: "dehradun_network",  // Ensure this matches what you saved
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


  return (
    <div>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "500px" }}
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
              path={path.map((name) => stations.find((s) => s.name === name)!.position)}
              options={{ strokeColor: "#00FF00", strokeWeight: 3 }}
            />
          )}
        </GoogleMap>
      </LoadScript>

      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          onClick={connectStations}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Connect Selected Stations
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Save Network
        </button>

        <select
          onChange={(e) => setSource(e.target.value)}
          className="p-2 border"
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
          className="p-2 border"
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
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          Get Shortest Path
        </button>
      </div>
    </div>
  );
};

export default MapCanvas;
