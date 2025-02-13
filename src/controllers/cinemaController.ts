import { Request, Response } from "express";
import pool from "../config/db";

// Create a new cinema with N seats
export const createCinema = async (req: Request, res: Response): Promise<any> => {
    const { cinemaName, cinemaId, address } = req.body;
    let totalSeats:number = parseInt(req.body.totalSeats, 10)
    let eachRowCapacity:number = parseInt(req.body.eachRowCapacity, 10)
    if (!cinemaName || !cinemaId || !totalSeats || !eachRowCapacity || !address) return res.status(400).json({ error: "Invalid input" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const result = await client.query(
        "INSERT INTO cinemas (cinema_name, cinema_id, total_seats, each_row_capacity, address) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [cinemaName, cinemaId, totalSeats, eachRowCapacity, address]
      );
      const cinemaPId = result.rows[0].id;
  
      // Insert seats
    //   const seatValues = Array.from({ length: totalSeats }, (_, i) => `(${cinemaId}, ${i + 1}, FALSE)`).join(",");
    var totalCompletedRow:number = Math.floor(totalSeats / eachRowCapacity)
    console.log('totalCompletedRow', totalCompletedRow)
    var uncompletedRowCapacity = totalSeats % eachRowCapacity
    let rowNo = 1;
    let seatNumber = 1
    const rowObj = []
    if(uncompletedRowCapacity > 0) {
        for(seatNumber = seatNumber; seatNumber <= uncompletedRowCapacity; seatNumber++){
            rowObj.push(`(${cinemaPId}, ${rowNo}, ${seatNumber}, FALSE)`)
        }
        rowNo = 2
        totalCompletedRow += 1
    }
    
    for(let i = rowNo; i <= totalCompletedRow; i++){
        for(let j = 0; j < eachRowCapacity; j++){
            rowObj.push(`(${cinemaPId}, ${i}, ${seatNumber}, FALSE)`)
            seatNumber++
        }
    }
    
     console.log(rowObj)
      const seatValues:string = rowObj.join(",")
      await client.query(`INSERT INTO seats (cinema_id, row_num, seat_number, is_sold) VALUES ${seatValues}`);
  
      await client.query("COMMIT");
      return res.status(201).json({ cinemaId }) as Response;
    } catch (error) {
        console.log(error.message)
      await client.query("ROLLBACK");
      return res.status(500).json({ error: error.message? error.message : "Error creating cinema" }) as Response;
    } finally {
      client.release();
    }
  };

  // Purchase Specific seat
  export const purchaseSeat = async (req: Request, res: Response): Promise<any>  => {
    const { cinemaId, seatNumber } = req.params;
    const client = await pool.connect();
  
    try {
      await client.query("BEGIN");
  
      const result = await client.query(
        "SELECT seats.id, seats.seat_number, seats.is_sold, cinemas.id AS cinemaPId, cinemas.cinema_id FROM seats inner join cinemas on  seats.cinema_id = cinemas.id  WHERE cinemas.cinema_id = $1 AND seat_number = $2 FOR UPDATE",
        [cinemaId, seatNumber]
      );
      if (result.rows.length === 0) {
        throw new Error("Seat not found");
      }
  
      const seat = result.rows[0];
      if (seat.is_sold) {
        throw new Error("Seat already sold");
      }
  
      await client.query("UPDATE seats SET is_sold = TRUE WHERE id = $1", [seat.id]);
      await client.query("COMMIT");
  
      return res.status(201).json({ seat });
    } catch (error) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: error.message });
    } finally {
      client.release();
    }
  };

  // Purchase the first two consecutive available seats
  export const purchaseConsecutiveSeats = async (req: Request, res: Response): Promise<any> => {
    const { cinemaId } = req.params;
    const totalWantedSeates:number = 2;
    const client = await pool.connect();
  
    try {
      await client.query("BEGIN");
  
      // Find first two consecutive free seats
      const result = await client.query(
        `SELECT
            S1.ID AS SEAT1_ID,
            S2.ID AS SEAT2_ID,
            S1.seat_number AS SEAT1_NO,
            S2.seat_number AS SEAT2_NO,
            S1.ROW_NUM AS S1_ROW,
            S2.ROW_NUM AS S2_ROW,
            S1.IS_SOLD AS S1_SOLD,
            S2.IS_SOLD AS S2_SOLD,
            CINEMAS.ID AS CINEMA_ID,
            CINEMAS.CINEMA_ID
        FROM
            SEATS S1
            INNER JOIN SEATS S2 ON S1.CINEMA_ID = S2.CINEMA_ID AND S1.ROW_NUM = S2.ROW_NUM
            AND S1.SEAT_NUMBER = S2.SEAT_NUMBER - 1
            INNER JOIN CINEMAS ON S1.CINEMA_ID = CINEMAS.ID
        WHERE
            CINEMAS.CINEMA_ID = $1 and s1.IS_SOLD = false and s2.IS_SOLD = false limit $2 for update`,
        [cinemaId, totalWantedSeates]
      );
      let selectedSeats = [];
      console.log('result.rows.length...', result.rows.length)
      if(result.rows.length ===  totalWantedSeates){
        for (let i = 0; i < result.rows.length - 1; i++) {
            selectedSeats.push(result.rows[i])
        }
        await client.query("UPDATE seats SET is_sold = TRUE WHERE id IN ($1, $2)", [
            selectedSeats[0].seat1_id,
            selectedSeats[0].seat2_id,
        ]);
      } else {
        throw new Error("No two consecutive seats available");
      }
   
      await client.query("COMMIT");
      const seats = {
        seat1:selectedSeats[0].seat1_id,
        seat2:selectedSeats[0].seat2_id,
        rowNo:selectedSeats[0].s1_row,
      }
      return res.status(201).json({ seats: seats });
    } catch (error) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: error.message });
    } finally {
      client.release();
    }
  };
  

