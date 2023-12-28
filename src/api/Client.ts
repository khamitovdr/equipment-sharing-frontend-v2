import axios from "axios";

console.log(import.meta.env.VITE_API_URL);

export const client = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
});
