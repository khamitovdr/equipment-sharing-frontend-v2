const getStaticUrl = (path: string) => {
	return import.meta.env.VITE_API_URL + path;
};

export default getStaticUrl;
