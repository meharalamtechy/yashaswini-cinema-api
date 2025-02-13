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
    
  };

  // Purchase the first two consecutive available seats
export const purchaseConsecutiveSeats = async (req: Request, res: Response): Promise<any> => {
    
  };
  

