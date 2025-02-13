CREATE DATABASE cinema_db;

CREATE TABLE cinemas (
    id SERIAL PRIMARY KEY,
    cinema_name VARCHAR(255) NOT NULL,
	cinema_id VARCHAR(255) UNIQUE NOT NULL,
    total_seats INTEGER NOT NULL,
	each_row_capacity INTEGER NOT NULL,
	address VARCHAR(255) NOT NULL
);

CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    cinema_id INTEGER REFERENCES cinemas(id) ON DELETE CASCADE,
	row_num INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    is_sold BOOLEAN DEFAULT FALSE,
    UNIQUE(cinema_id, seat_number)
);