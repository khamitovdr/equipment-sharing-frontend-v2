import { Route, Routes } from "react-router-dom";
import MainPage from "./pages/MainPage";
import NotFoundPage from "./pages/PageNotFound";
import PrivateRoutes from "./router/PrivateRoutes";

function App() {
	return (
		<Routes>
			<Route path="/" element={<MainPage />} />
			<Route element={<PrivateRoutes />}>
				<Route path="/my-equipment/:id" element={<MainPage />} />
			</Route>
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}

export default App;
