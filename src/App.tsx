import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// import MainPage from "./pages/MainPage";
// import Auth from "./components/Auth";
import PathStateExample from './pages/PathStateExample';


const queryClient = new QueryClient()

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			{/* <Auth />
			<MainPage /> */}
			<PathStateExample />
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}

export default App;
