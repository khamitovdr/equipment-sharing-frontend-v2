import { Box, Container, Link as MuiLink, Stack, Typography } from "@mui/material";
import HeaderLogo from "src/pages/MainPage/HeaderLogo";

const Footer = () => {
    return (
        <Box component="footer" sx={{ bgcolor: "#f5f5f5", mt: 4, py: { xs: 4, sm: 6 } }}>
            <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexDirection: { xs: "column", sm: "row" }, gap: 3 }}>
                <HeaderLogo />
                <Stack spacing={0.8} alignItems={{ xs: "center", sm: "flex-end" }}>
                    <Typography variant="body1">ООО «ЦПСИА»</Typography>
                    <Typography variant="body1">
                        Тел.: <MuiLink href="tel:+79773776695">+7-977-377-66-95</MuiLink>
                    </Typography>
                    <Typography variant="body1">
                        Почта: <MuiLink href="mailto:info@equip-me.ru">info@equip-me.ru</MuiLink>
                    </Typography>
                    <Typography variant="body1">ИНН: 7720876531</Typography>
                    <Typography variant="body1">Адрес: 119234, Москва, ул. Ленинские горы, 1</Typography>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer;


