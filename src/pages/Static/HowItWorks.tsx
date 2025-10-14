import { Container, Paper, Typography, List, ListItem, ListItemText } from "@mui/material";
import MainPageHeader from "src/pages/MainPage/MainPageHeader";

const HowItWorksPage = () => {
    return (
        <>
            <MainPageHeader />
            <Container sx={{ py: { xs: 2, md: 4 } }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h4" sx={{ mb: 2 }}>Как это работает?</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        На маркетплейсе встречаются владельцы активов и арендаторы. Арендаторы могут найти необходимую спецтехнику, оборудование или сделать заказ на контрактное производство у проверенных контрагентов. Equip-me поможет совершить сделку, проведет по процессу аренды и может выступить безопасным посредником во взаиморасчетах. Через платформу можно заключить договор, подписав его электронной подписью, или напрямую выйти на контрагента.
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 2 }}>Как взять в аренду актив или сделать заказ?</Typography>
                    <List dense>
                        <ListItem><ListItemText primary="1. Зарегистрируйте личный кабинет" /></ListItem>
                        <ListItem><ListItemText primary="2. Выберите понравившееся объявление об аренде или контрактном производстве" /></ListItem>
                        <ListItem><ListItemText primary="3. Обсудите с владельцем детали сделки и согласуйте договор" /></ListItem>
                        <ListItem><ListItemText primary="4. Воспользуйтесь оборудованием или контрактным производством" /></ListItem>
                        <ListItem><ListItemText primary="5. Верните оборудование или заберите готовую продукцию" /></ListItem>
                        <ListItem><ListItemText primary="6. Оставьте отзыв о владельце" /></ListItem>
                    </List>
                    <Typography variant="h6" sx={{ mt: 2 }}>Как сдать оборудование или разместить контрактное производство?</Typography>
                    <List dense>
                        <ListItem><ListItemText primary="1. Зарегистрируйте личный кабинет" /></ListItem>
                        <ListItem><ListItemText primary="2. Дождитесь проверки аккаунта" /></ListItem>
                        <ListItem><ListItemText primary="3. Разместите объявления о доступных активах или производственных мощностях" /></ListItem>
                        <ListItem><ListItemText primary="4. Получайте заявки от арендаторов" /></ListItem>
                        <ListItem><ListItemText primary="5. Обсудите детали сделки и согласуйте договор" /></ListItem>
                        <ListItem><ListItemText primary="6. Передайте оборудование в аренду или примите заказ" /></ListItem>
                        <ListItem><ListItemText primary="7. Примите оборудование или передайте готовые изделия" /></ListItem>
                        <ListItem><ListItemText primary="8. Оставьте отзыв об арендаторе или заказчике" /></ListItem>
                    </List>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Остались вопросы? Пишите на info@equip-me.ru или звоните +7-977-377-66-95
                    </Typography>
                </Paper>
            </Container>
        </>
    );
};

export default HowItWorksPage;


