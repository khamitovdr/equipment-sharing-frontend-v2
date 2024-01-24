import { Route, Routes } from "react-router-dom";
import MainPage from "./pages/MainPage";
import NotFoundPage from "./pages/PageNotFound";
import SignUp from "./pages/Signup";
import PrivateRoutes from "./router/PrivateRoutes";
import { Routes as AppRoutes } from "./router/routes";

function App() {
	return (
		<Routes>
			<Route path={AppRoutes.Home} element={<MainPage />} />
			<Route path={AppRoutes.Signup} element={<SignUp />} />
			<Route element={<PrivateRoutes />}>
				<Route path={AppRoutes.Notifications} element={<NotFoundPage />} />
			</Route>
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}

export default App;
