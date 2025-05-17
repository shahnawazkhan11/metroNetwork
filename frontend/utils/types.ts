export type Station = {
  id: string;
  name: string;
  position: google.maps.LatLngLiteral;
};

export type Edge = {
  from: string;
  to: string;
  weight: number;
};

export type NetworkPayload = {
  network_name: string;
  nodes: string[];
  edges: Edge[];
};

export type PathRequest = {
  network_name: string;
  source: string;
  destination: string;
};
