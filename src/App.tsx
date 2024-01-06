import { Route, Routes } from "react-router-dom";
import MainPage from "./pages/MainPage";
import PrivateRoutes from "./router/PrivateRoutes";

function App() {
	return (
		<Routes>
			<Route path="/" element={<MainPage />} />
			<Route element={<PrivateRoutes />}>
				<Route path="/my-equipment/:id" element={<MainPage />} />
			</Route>
		</Routes>
	);
}

export default App;
