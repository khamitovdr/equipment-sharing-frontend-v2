import axios from "axios";

export const axiosConfig = () => {
	axios.defaults.baseURL = import.meta.env.VITE_API_URL;
};
