import { useRef, useEffect } from "react";

type useFormLeavingActionProps = {
	isDirty: boolean;
};

const useFormLeavingAction = ({ isDirty }: useFormLeavingActionProps) => {
	const isFormDirtyRef = useRef(isDirty);

	useEffect(() => {
		isFormDirtyRef.current = isDirty;
	}, [isDirty]);

	const handleNavigation = (event: BeforeUnloadEvent) => {
		if (isFormDirtyRef.current) {
			// In current implementations of the beforeunload event in browsers like Chrome, Firefox, and others,
			// custom messages are no longer displayed in the confirmation dialog. Instead, the browser displays a
			// generic message. The key aspect now is just to trigger the dialog, not to customize its content.
			const confirmMessage =
				"You have unsaved changes. Are you sure you want to leave?";
			event.returnValue = confirmMessage; // Standard for most browsers
			return confirmMessage; // For some older browsers
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: handleNavigation is up to date thanks to useRef
	useEffect(() => {
		window.addEventListener("beforeunload", handleNavigation);
		return () => window.removeEventListener("beforeunload", handleNavigation);
	}, []);

	return;
};

export default useFormLeavingAction;
