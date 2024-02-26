import { Outlet } from "react-router-dom";
import Auth from "src/pages/Login/Auth";

const PrivateRoutes = () => {
	return (
		<>
			<Auth isObligatory />
			<Outlet />
		</>
	);
};

export default PrivateRoutes;
