import { Outlet } from "react-router-dom";
import Auth from "../pages/Login/Auth";

const PrivateRoutes = () => {
	return (
		<>
			<Auth />
			<Outlet />
		</>
	);
};

export default PrivateRoutes;
