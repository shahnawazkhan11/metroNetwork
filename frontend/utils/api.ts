import axios from "axios";
import { NetworkPayload, PathRequest } from "./types";

const BASE = "http://127.0.0.1:5000/api";

export const saveNetwork = (payload: NetworkPayload) =>
  axios.post(`${BASE}/save-network`, payload);

export const getShortestPath = (payload: PathRequest) =>
  axios.post(`${BASE}/shortest-path`, payload);

export const getNetworks = () => axios.get(`${BASE}/networks`);

export const loadNetwork = (name: string) =>
  axios.get(`${BASE}/load-network?name=${name}`);
