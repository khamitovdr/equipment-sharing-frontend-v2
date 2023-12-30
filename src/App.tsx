import { Route, Routes } from "react-router-dom";
import MainPage from "./pages/MainPage";
import Auth from "./components/Auth";

function App() {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<>
						<Auth />
						<MainPage />
					</>
				}
			/>
		</Routes>
	);
}

export default App;
