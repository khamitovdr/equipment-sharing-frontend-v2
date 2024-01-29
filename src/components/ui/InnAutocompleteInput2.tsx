import {
	Autocomplete,
	// AutocompleteRenderInputParams,
	Box,
	BaseTextFieldProps,
	CircularProgress,
	ListItem,
	ListItemText,
	TextField,
	Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
	// Controller,
	FieldValues,
	// FieldError,
	Path,
} from "react-hook-form";
import { fetchOrganizationSuggestions } from "../../api/dadata";
import { DaDataPartySuggestion } from "react-dadata";

// type AutocompleteInputParams = {
// 	label: string;
// 	invalid?: boolean;
// 	error?: FieldError;
// 	isFetching?: boolean;
// } & AutocompleteRenderInputParams;

// const AutocompleteInput = ({
// 	label,
// 	invalid,
// 	error,
// 	isFetching,
// 	...rest
// }: AutocompleteInputParams) => {
// 	return (
// 		<TextField
// 			{...rest}
// 			label={label}
// 			error={invalid}
// 			margin="normal"
// 			helperText={
// 				invalid
// 					? (error?.message as React.ReactNode)
// 					: !query && "Начните вводить ИНН вашей организации"
// 			}
// 			// fullWidth
// 			InputProps={{
// 				...rest.InputProps,
// 				endAdornment: (
// 					<React.Fragment>
// 						{isFetching ? <CircularProgress color="inherit" size={20} /> : null}
// 						{rest.InputProps.endAdornment}
// 					</React.Fragment>
// 				),
// 			}}
// 		/>
// 	);
// };

type OrganizationByInnAutocompleteProps<T extends FieldValues> = {
	fieldName: Path<T>;
	label: string;
} & BaseTextFieldProps;

const OrganizationByInnAutocomplete = <T extends FieldValues>(
	props: OrganizationByInnAutocompleteProps<T>,
) => {
	const {
		// fieldName,
		label,
		// ...rest
	} = props;

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
	const options = React.useMemo(() => {
		console.log("suggestions", suggestions);
		return suggestions;
	}, [suggestions]);

	const invalid = false;
	const error = {
		message: "error",
	};

	const isActive = (option: DaDataPartySuggestion) =>
		option.data.state.status === "ACTIVE";

	return (
		// <Controller
		// 	name={fieldName}
		// defaultValue={{
		// 	value: "ФФФ",
		// 	data: { hid: "123", inn: "1231231230", address: { value: "moscow" },
		//     state: { status: "ACTIVE" }
		//  },
		// }}
		// render={({ field, fieldState: { invalid, error } }) => (
		<Autocomplete
			// open={true} // dont close options
			// {...field}
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
			getOptionDisabled={(option) => !isActive(option)}
			// onChange={(_, data) => field.onChange(data)}

			// onChange={(_, value) => {
			// 	// setSelectedOption(value || null);
			//     onChange(value);

			// }}
			// inputValue={query}
			onInputChange={(_, value) => {
				setQuery(value);
			}}
			renderInput={(params) => (
				<TextField
					{...params}
					margin="normal"
					label={label}
					error={invalid}
					helperText={
						invalid
							? (error?.message as React.ReactNode)
							: !query && "Начните вводить ИНН вашей организации"
					}
					// fullWidth
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
		// 	)}
		// />
	);
};

export default OrganizationByInnAutocomplete;
