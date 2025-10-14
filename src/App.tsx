import { Route, Routes } from "react-router-dom";
import SignUpSteps from "src/forms/signUpSteps";
import EquipmentPage from "src/pages/Equipment";
import MainPage from "src/pages/MainPage";
import NotFoundPage from "src/pages/PageNotFound";
import SignUp from "src/pages/Signup";
import PrivateRoutes from "src/router/PrivateRoutes";
import { Routes as AppRoutes } from "src/router/routes";
import RentEquipment from "src/pages/Rentals/RentEquipment.tsx";
import SettingsPage from "src/pages/Settings";

function App() {
	return (
		<Routes>
			<Route path={AppRoutes.Home} element={<MainPage />} />
			<Route path={AppRoutes.Equipment}>
				<Route path=":id" element={<EquipmentPage />} />
			</Route>
			<Route path={AppRoutes.SignUp} element={<SignUp />}>
				<Route path=":step" element={<SignUpSteps />} />
			</Route>
			<Route element={<PrivateRoutes />}>
				<Route path={AppRoutes.Notifications} element={<NotFoundPage />} />
				<Route path={AppRoutes.Settings} element={<SettingsPage />} />
				<Route path={AppRoutes.Rentals}>
					<Route path=":id" element={<RentEquipment />} />
				</Route>
			</Route>
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}

export default App;
