import {
	Autocomplete,
	BaseTextFieldProps,
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
import { Controller } from "react-hook-form";
import { fetchOrganizationSuggestions } from "../../api/dadata";

type OrganizationByInnAutocompleteProps = {
	label: string;
} & BaseTextFieldProps;

const OrganizationByInnAutocomplete = (
	props: OrganizationByInnAutocompleteProps,
) => {
	const { label } = props;

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
		return suggestions;
	}, [suggestions]);

	const isActive = (option: DaDataPartySuggestion) =>
		option.data.state.status === "ACTIVE";

	return (
		<>
			<Controller
				name="organization_inn"
				render={({ field }) => (
					<input {...field} value={field.value} type="hidden" />
				)}
			/>
			<Controller
				name="organization_data"
				render={({ field, fieldState: { invalid, error } }) => (
					<Autocomplete
						// open={true} // dont close options
						{...field}
						disablePortal
						fullWidth
						blurOnSelect
						filterOptions={(x) => x}
						options={options}
						loading={isPending && isFetching}
						getOptionLabel={(option) => (option as DaDataPartySuggestion).value}
						isOptionEqualToValue={(option, value) =>
							option.data.hid === value.data.hid
						}
						getOptionDisabled={(option) => !isActive(option)}
						onChange={(_, data) => field.onChange(data)}
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
										: !query &&
										  "Начните вводить название или ИНН вашей организации"
								}
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
				)}
			/>
		</>
	);
};

export default OrganizationByInnAutocomplete;
