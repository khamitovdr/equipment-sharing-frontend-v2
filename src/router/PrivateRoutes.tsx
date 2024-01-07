import { observer } from "mobx-react-lite";
import { useContext } from "react";
import { Outlet } from "react-router-dom";
import Auth from "../pages/Login/Auth";
import { StoreContext } from "../storeContext";

const PrivateRoutes = () => {
	const { authStore } = useContext(StoreContext);
	const isAuth = authStore.isAuthenicated();

	return (
		<>
			<Auth />
			<Outlet context={{ isAuth }} />
		</>
	);
};

export default observer(PrivateRoutes);
