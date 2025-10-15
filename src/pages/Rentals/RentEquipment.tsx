import { Box, Button, Container, Paper, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createOrder, fetchEquipment } from "src/api/equipment";
import MainPageHeader from "src/pages/MainPage/MainPageHeader";
import MuiBox from "@mui/material/Box";
import Footer from "src/components/Footer";

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

    const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const ensureIsoDate = (value: string) => {
        if (!value) return value;
        // Already ISO
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        // dd.mm.yyyy -> yyyy-mm-dd
        const dotMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (dotMatch) {
            const [, dd, mm, yyyy] = dotMatch;
            return `${yyyy}-${mm}-${dd}`;
        }
        // yyyy/mm/dd -> yyyy-mm-dd
        const slashMatch = value.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
        if (slashMatch) {
            const [, yyyy, mm, dd] = slashMatch;
            return `${yyyy}-${mm}-${dd}`;
        }
        // Fallback robust conversion without TZ shift
        try {
            const parts = value.split(/[-T :/.]/);
            if (parts.length >= 3) {
                const [p1, p2, p3] = parts.map((p) => p.padStart(2, "0"));
                // Heuristic: if first part has 4 digits -> yyyy-mm-dd else dd-mm-yyyy
                if (p1.length === 4) return `${p1}-${p2}-${p3}`;
                return `${p3}-${p2}-${p1}`;
            }
        } catch {}
        return value;
    };

    const mutation = useMutation({
        mutationFn: () =>
            createOrder({
                equipment_id: equipmentId,
                start_date: ensureIsoDate(startDate),
                end_date: ensureIsoDate(endDate),
            }),
        onSuccess: () => {
            navigate(-1);
        },
    });

    const disabled = !startDate || !endDate || mutation.isPending;

    return (
        <MuiBox display="flex" flexDirection="column" minHeight="100vh">
            <MainPageHeader />
            <Container sx={{ py: { xs: 2, md: 4 }, flex: 1 }}>
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
                            onChange={(e) => {
                                const v = e.target.value;
                                setStartDate(v);
                                if (endDate && ensureIsoDate(endDate) < ensureIsoDate(v)) {
                                    setEndDate(v);
                                }
                            }}
                            fullWidth
                            inputProps={{ min: todayIso }}
                        />
                        <TextField
                            type="date"
                            label="Дата окончания"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            fullWidth
                            inputProps={{ min: startDate || todayIso }}
                        />
                    </Box>
                    {(startDate || endDate) && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Вы выбрали: {startDate ? startDate.split("-").reverse().join(".") : "—"} – {endDate ? endDate.split("-").reverse().join(".") : "—"}
                        </Typography>
                    )}
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
            <Footer />
        </MuiBox>
    );
};

export default RentEquipment;


