import express from "express";
import { createCinema, purchaseSeat, purchaseConsecutiveSeats } from "../controllers/cinemaController";

const router = express.Router();

// Correct way to define the route
router.post("/cinema", createCinema);
router.post("/cinemas/:cinemaId/seats/:seatNumber", purchaseSeat);
router.post("/cinemas/:cinemaId/two_free_consecutive/", purchaseConsecutiveSeats);


export default router;
