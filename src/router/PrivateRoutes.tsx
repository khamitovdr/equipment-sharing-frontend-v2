import { Outlet } from "react-router-dom";
import Auth from "../pages/Login/Auth";

const PrivateRoutes = () => {
	return (
		<>
			<Auth isObligatory />
			<Outlet />
		</>
	);
};

export default PrivateRoutes;
