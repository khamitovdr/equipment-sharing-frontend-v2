import { Container, Paper, Typography } from "@mui/material";
import MainPageHeader from "src/pages/MainPage/MainPageHeader";

const AboutPage = () => {
    return (
        <>
            <MainPageHeader />
            <Container sx={{ py: { xs: 2, md: 4 } }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h4" sx={{ mb: 2 }}>О нас</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Equip-me – это маркетплейс недоиспользованных активов, где владельцы могут сдать в аренду спецтехнику, оборудование или разместить заказ на контрактное производство. Арендаторы могут найти необходимое оборудование в аренду или заказать контрактное производство.
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Наша миссия: сделать совместное использование активов доступным, простым и удобным.
                    </Typography>
                    <Typography variant="body1">
                        Наш проект был поддержан Фондом содействия инноваций в 2022–23 годах.
                    </Typography>
                </Paper>
            </Container>
        </>
    );
};

export default AboutPage;


