import { Box } from "@mui/material";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
	A11y,
	Autoplay,
	Keyboard,
	Navigation,
	Pagination,
} from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const IMAGES = [
	"/content/banner_1.webp",
	"/content/banner_2.webp",
	"/content/banner_3.webp",
	"/content/banner_4.webp",
] as const;

const Slider = () => {
	return (
		<Box
			sx={{
				mt: {
					lg: 4,
				},
				px: {
					lg: 4,
				},
			}}
		>
			<Swiper
				modules={[Autoplay, Navigation, Pagination, Keyboard, A11y]}
				autoplay={{
					delay: 3500,
					disableOnInteraction: true,
				}}
				loop={true}
				// navigation={{
				// 	enabled: window.innerWidth > 1200,
				// }}
				breakpoints={{
					0: {
						navigation: false,
					},
					1200: {
						navigation: true,
					},
				}}
				pagination={{ clickable: false }}
				keyboard={{ enabled: true }}
			>
				{IMAGES.map((img) => (
					<SwiperSlide key={img}>
						<img
							style={{
								width: "100%",
								height: "100%",
							}}
							src={img}
							alt="aaa"
						/>
					</SwiperSlide>
				))}
			</Swiper>
			{/* <Box
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					zIndex: 1,
					background: `linear-gradient(
						90deg, 
						white,
						transparent 5% 95%,
						white 100%
					)`,
				}}
			/> */}
		</Box>
	);
};

export default Slider;
