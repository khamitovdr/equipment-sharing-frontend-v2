import React from "react";
import { AuthStore } from "./stores/auth";
import { AuthService } from "./api/auth";

interface IStoreContext {
	authStore: AuthStore;
}

const authService = new AuthService();
const authStore = new AuthStore(authService);

export const StoreContext = React.createContext<IStoreContext>({
	authStore,
});
