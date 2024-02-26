import { Route, Routes } from "react-router-dom";
import SignUpSteps from "src/forms/signUpSteps";
import MainPage from "src/pages/MainPage";
import NotFoundPage from "src/pages/PageNotFound";
import SignUp from "src/pages/SignUp";
import PrivateRoutes from "src/router/PrivateRoutes";
import { Routes as AppRoutes } from "src/router/routes";

function App() {
	return (
		<Routes>
			<Route path={AppRoutes.Home} element={<MainPage />} />
			<Route path={AppRoutes.SignUp} element={<SignUp />}>
				<Route path=":step" element={<SignUpSteps />} />
			</Route>
			<Route element={<PrivateRoutes />}>
				<Route path={AppRoutes.Notifications} element={<NotFoundPage />} />
			</Route>
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}

export default App;
