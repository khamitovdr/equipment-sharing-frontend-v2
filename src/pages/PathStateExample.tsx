import { usePathState } from "../hooks/pathState";
import { Switch, Container } from "@mui/material";

const PathStateExample = () => {
	const { pathState, setPathState } = usePathState({
		a: "b",
		foo: "bar",
	});

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { checked } = event.target
        setPathState("a", checked ? "c" : "b")
      };

	return (
		<>
			<Container>
				<Switch
					checked={pathState.a === "c"}
					onChange={handleChange}
					inputProps={{ "aria-label": "controlled" }}
				/>
			</Container>
		</>
	);
};

export default PathStateExample;
