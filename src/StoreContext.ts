import React from "react";
import { AuthStore } from "./stores/Auth";
import { AuthService } from "./api/Auth";

interface IStoreContext {
	authStore: AuthStore;
}

const authService = new AuthService();
const authStore = new AuthStore(authService);

export const StoreContext = React.createContext<IStoreContext>({
	authStore,
});
