import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createCinema } from "./controllers/cinemaController";
import cinemaRoutes from "./routes/cinemaRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
const router = express.Router();

app.get("/", (req: Request, res: Response) => {
  res.send("Cinema API is running!");
});
app.use("/api", cinemaRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
