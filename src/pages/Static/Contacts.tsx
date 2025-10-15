import { Container, Paper, Typography, Link as MuiLink } from "@mui/material";
import Box from "@mui/material/Box";
import MainPageHeader from "src/pages/MainPage/MainPageHeader";
import Footer from "src/components/Footer";

const ContactsPage = () => {
    return (
        <Box display="flex" flexDirection="column" minHeight="100vh">
            <MainPageHeader />
            <Container sx={{ py: { xs: 2, md: 4 }, flex: 1 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h4" sx={{ mb: 2 }}>Контакты</Typography>
                    <Typography variant="body1">Полное название: Общество с ограниченной ответственностью «Цифровая платформа совместного использования активов»</Typography>
                    <Typography variant="body1">Краткое название: ООО «ЦПСИА»</Typography>
                    <Typography variant="body1">Телефон: +7-977-377-66-95</Typography>
                    <Typography variant="body1">Почта: <MuiLink href="mailto:info@equip-me.ru">info@equip-me.ru</MuiLink></Typography>
                    <Typography variant="body1">ИНН: 7720876531</Typography>
                    <Typography variant="body1">Фактический адрес: 119234 г. Москва, ул. Ленинские горы, 1</Typography>
                </Paper>
            </Container>
            <Footer />
        </Box>
    );
};

export default ContactsPage;


