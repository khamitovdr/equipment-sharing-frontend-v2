import {
	Autocomplete,
	Box,
	CircularProgress,
	ListItem,
	ListItemText,
	TextField,
	Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { DaDataPartySuggestion } from "react-dadata";
import { fetchOrganizationSuggestions } from "../../api/dadata";

type TextInputProps = {
	label: string;
	required?: boolean;
	isReady?: boolean;
	error?: boolean;
	helpText?: string;
	selectedOption: DaDataPartySuggestion | null;
	setSelectedOption: (value: DaDataPartySuggestion | null) => void;
} & React.ComponentProps<typeof TextField>;

const InnAutocompleteInput = ({
	label,
	required,
	isReady = true,
	error,
	helpText,
	selectedOption,
	setSelectedOption,
	...rest
}: TextInputProps) => {
	const [query, setQuery] = React.useState("");

	const {
		isPending,
		isFetching,
		data: suggestions = [],
	} = useQuery({
		queryKey: ["organizationSuggestions", { query }],
		queryFn: () => fetchOrganizationSuggestions(query),
		enabled: !!query,
	});

	const options = React.useMemo(() => suggestions, [suggestions]);

	const isActive = (option: DaDataPartySuggestion) =>
		option.data.state.status === "ACTIVE";

	if (!isReady) {
		return <CircularProgress />;
	}

	return (
		<Autocomplete
			// open={true} // dont close options
			disablePortal
			fullWidth
			blurOnSelect
			filterOptions={(x) => x}
			options={options}
			loading={isPending && isFetching}
			getOptionLabel={(option) => option.value}
			isOptionEqualToValue={(option, value) =>
				option.data.hid === value.data.hid
			}
			value={selectedOption}
			getOptionDisabled={(option) => !isActive(option)}
			onChange={(_, value) => {
				setSelectedOption(value || null);
			}}
			inputValue={query}
			onInputChange={(_, value) => {
				setQuery(value);
			}}
			renderInput={(params) => (
				<TextField
					{...params}
					required={required}
					margin="normal"
					label={label}
					error={error}
					helperText={
						error ? helpText : !query && "Начните вводить название или ИНН"
					}
					fullWidth
					InputProps={{
						...params.InputProps,
						endAdornment: (
							<React.Fragment>
								{isFetching ? (
									<CircularProgress color="inherit" size={20} />
								) : null}
								{params.InputProps.endAdornment}
							</React.Fragment>
						),
					}}
					{...rest}
				/>
			)}
			renderOption={(props, option) => (
				<ListItem {...props} key={option.data.hid}>
					<ListItemText
						primary={
							<Typography
								variant="subtitle1"
								style={{
									textDecoration: !isActive(option)
										? "line-through"
										: undefined,
								}}
								lineHeight={1.25}
								mb={0.7}
							>
								{option.value}
							</Typography>
						}
						secondaryTypographyProps={{ component: "div" }}
						secondary={
							<Box sx={{ display: "flex", flexDirection: "row" }}>
								<Typography variant="body2" sx={{ mr: 2 }}>
									{option.data.inn}
								</Typography>
								<Typography noWrap variant="body2" color="textSecondary">
									{option.data.address.value}
								</Typography>
							</Box>
						}
					/>
				</ListItem>
			)}
		/>
	);
};

export default InnAutocompleteInput;
