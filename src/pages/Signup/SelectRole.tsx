import { ChevronRight } from "@mui/icons-material";
import {
	Box,
	Button,
	Card,
	CardActionArea,
	CardActions,
	CardContent,
	Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSignupStore } from "../../stores/createUserStore";

type RoleCardProps = {
	roleName: string;
	description: string;
	action: () => void;
};

const RoleCard = ({ roleName, description, action }: RoleCardProps) => {
	return (
		<Card elevation={3}>
			<CardActionArea onClick={action}>
				<CardContent>
					<Typography variant="h5" sx={{ mb: 1 }}>
						{roleName}
					</Typography>
					<Typography
						variant="body1"
						sx={{
							mb: {
								xs: 0,
								sm: 3,
							},
						}}
					>
						{description}
					</Typography>
				</CardContent>
			</CardActionArea>
			<CardActions>
				<Button variant="outlined" size="large" fullWidth onClick={action}>
					Выбрать
					<ChevronRight sx={{ ml: 1 }} />
				</Button>
			</CardActions>
		</Card>
	);
};

type SelectRoleProps = {
	nextStep: string;
};

const SelectRole = ({ nextStep }: SelectRoleProps) => {
	const navigate = useNavigate();

	const resetSignupStore = useSignupStore((state) => state.reset);
	const updateUserData = useSignupStore((state) => state.updateUserData);

	const handleRoleSelect = (is_owner: boolean) => {
		resetSignupStore();
		updateUserData({ is_owner });
		navigate(`../${nextStep}`);
	};

	return (
		<>
			<Typography variant="body1" align="center" sx={{ mb: 3 }}>
				Вы хотите продолжить как...
			</Typography>
			<Box
				display="flex"
				flexDirection={{
					xs: "column",
					sm: "row",
				}}
				justifyContent="space-between"
				alignItems="stretch"
				gap={3}
			>
				<RoleCard
					roleName="Арендатор"
					description="И найти необходимое оборудование"
					action={() => handleRoleSelect(false)}
				/>
				<RoleCard
					roleName="Владелец"
					description="И сдать своё оборудование в аренду"
					action={() => handleRoleSelect(true)}
				/>
			</Box>
		</>
	);
};

export default SelectRole;
