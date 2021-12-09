/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  static async search(query) {
    query = query.split(" ");
    let q1, q2, SQLQuery;

    let searchType = "OR";

    if (query.length > 1) {
      q1 = query[0];
      q2 = query[1];
      searchType = "AND";
    } else {
      q1 = query[0];
      q2 = query[0];
    }

    if (searchType === "AND") {
      SQLQuery = `SELECT id,
          first_name AS "firstName",  
          last_name AS "lastName", 
          phone, 
          notes
          FROM customers WHERE first_name ILIKE $1 AND last_name ILIKE $2
          ORDER BY first_name`;
    } else {
      SQLQuery = `SELECT id,
          first_name AS "firstName",  
          last_name AS "lastName", 
          phone, 
          notes
          FROM customers WHERE first_name ILIKE $1 OR last_name ILIKE $2
          ORDER BY first_name`;
    }
    const results = await db.query(`${SQLQuery}`, [`${q1}%`, `${q2}%`]);

    return results.rows.map((c) => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

module.exports = Customer;
