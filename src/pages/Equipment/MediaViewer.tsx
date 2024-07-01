import { Box, Grid, Paper } from "@mui/material";
import { useState } from "react";

type MediaViewerProps = {
	images: string[];
};

const MediaViewer = ({ images }: MediaViewerProps) => {
	const [activeImage, setActiveImage] = useState(images[0]);

	return (
		<Box sx={{ flexGrow: 1 }}>
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<Paper elevation={3}>
						<Box
							component="img"
							src={activeImage}
							alt="Active"
							sx={{ width: "100%", height: "auto" }}
						/>
					</Paper>
				</Grid>
				<Grid item xs={12}>
					<Grid container spacing={2} justifyContent="center">
						{images.map((image, index) => (
							<Grid item key={index}>
								<Paper
									elevation={1}
									onClick={() => setActiveImage(image)}
									sx={{
										cursor: "pointer",
										padding: "4px",
										border:
											activeImage === image ? "2px solid #1976d2" : "none",
									}}
								>
									<Box
										component="img"
										src={image}
										alt={`Thumbnail ${index + 1}`}
										sx={{ width: "100px", height: "auto" }}
									/>
								</Paper>
							</Grid>
						))}
					</Grid>
				</Grid>
			</Grid>
		</Box>
	);
};

export default MediaViewer;
