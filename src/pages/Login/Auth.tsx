import { Dialog } from "@mui/material";
import LoginForm from "../../forms/authForm";
import { useAuthStore } from "../../stores/authStore";

type AuthProps =
	| {
			isObligatory: true;
	  }
	| (React.ComponentProps<typeof Dialog> & { isObligatory?: false });

const Auth = (props: AuthProps) => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

	const { isObligatory, ...rest } = props;

	return (
		<Dialog open={!isAuthenticated} {...rest}>
			<LoginForm />
		</Dialog>
	);
};

export default Auth;
