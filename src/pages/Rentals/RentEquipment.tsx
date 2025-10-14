import { Box, Button, Container, Paper, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createOrder, fetchEquipment } from "src/api/equipment";
import MainPageHeader from "src/pages/MainPage/MainPageHeader";

const RentEquipment = () => {
    const { id: equipmentIdStr } = useParams();
    const navigate = useNavigate();

    if (!equipmentIdStr) {
        return <span>Equipment ID is required</span>;
    }
    const equipmentId = Number(equipmentIdStr);

    const { data: equipment } = useQuery({
        queryKey: ["equipmentDetail", { id: equipmentId }],
        queryFn: () => fetchEquipment({ id: equipmentId }),
    });

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const mutation = useMutation({
        mutationFn: () =>
            createOrder({
                equipment_id: equipmentId,
                start_date: startDate,
                end_date: endDate,
            }),
        onSuccess: () => {
            navigate(-1);
        },
    });

    const disabled = !startDate || !endDate || mutation.isPending;

    return (
        <>
            <MainPageHeader />
            <Container sx={{ py: { xs: 2, md: 4 } }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>Оформление аренды</Typography>
                    {equipment && (
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            {equipment.name} — {equipment.price.toLocaleString("ru-RU")} руб / {equipment.time_interval}
                        </Typography>
                    )}
                    <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2}>
                        <TextField
                            type="date"
                            label="Дата начала"
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            type="date"
                            label="Дата окончания"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            fullWidth
                        />
                    </Box>
                    <Button
                        sx={{ mt: 3 }}
                        variant="contained"
                        size="large"
                        disabled={disabled}
                        onClick={() => mutation.mutate()}
                        fullWidth
                    >
                        {mutation.isPending ? "Отправка..." : "Отправить заявку"}
                    </Button>
                    {mutation.isError && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {(mutation.error as Error).message}
                        </Typography>
                    )}
                </Paper>
            </Container>
        </>
    );
};

export default RentEquipment;


