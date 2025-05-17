import dynamic from "next/dynamic";

const MapCanvas = dynamic(() => import("../../components/MapCanvas"));

export default function Home() {
  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Dehradun Railway Network Planner</h1>
      <MapCanvas apiKey={GOOGLE_API_KEY} />
    </main>
  );
}
