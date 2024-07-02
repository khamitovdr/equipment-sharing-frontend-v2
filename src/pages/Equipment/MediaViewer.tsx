import { Box, Grid, Paper } from "@mui/material";
import { useState } from "react";
import { Image } from "src/models/files";
import getStaticUrl from "src/utils/staticUrl";

type MediaViewerProps = {
	images: Image[];
};

const MediaViewer = ({ images }: MediaViewerProps) => {
	if (images.length === 0) {
		return null;
	}

	const [activeImage, setActiveImage] = useState(images[0]);

	return (
		<Box sx={{ flexGrow: 1 }}>
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<Paper elevation={3}>
						<Box
							component="img"
							src={getStaticUrl(activeImage.derived_path.large)}
							alt="Active"
							sx={{ width: "100%", height: "auto" }}
						/>
					</Paper>
				</Grid>
				<Grid item xs={12}>
					<Grid container spacing={2} justifyContent="center">
						{images.map((image, index) => (
							<Grid item key={image.id}>
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
										src={getStaticUrl(image.derived_path.small)}
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
