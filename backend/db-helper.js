const sqlite3 = require('sqlite3')
const Promise = require('bluebird')

class DBHelper {
  constructor() {
    this.db = new sqlite3.Database('./db-storage/ds.db', (err) => {
      if (err) {
        console.log('Could not connect to database', err)
      } else {
        console.log('Connected to database');
        this.createTables();
      }
    })
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          console.log('Error running sql ' + sql)
          console.log(err)
          reject(err)
        } else {
          resolve({ id: this.lastID })
        }
      })
    })
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  createTables(){
      console.log("creating required tables...");
      this.run(`CREATE TABLE IF NOT EXISTS PARKING_OWNER (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        USERNAME TEXT, 
        PASSWORD TEXT)`);

      this.run(`CREATE TABLE IF NOT EXISTS CAR_OWNER (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        USERNAME TEXT, 
        PASSWORD TEXT)`);
      
      this.run(`CREATE TABLE IF NOT EXISTS CAR_DEVICE (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        USER_ID INTEGER, 
        DEVICE_ID TEXT,
        PLATE_NO TEXT,
        SEED_JSON TEXT)`);

      this.run(`CREATE TABLE IF NOT EXISTS PARKING_DEVICE (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          USER_ID INTEGER, 
          DEVICE_ID TEXT,
          RATE INTEGER,
          SEED_JSON TEXT,
          LAT NUMERIC,
          LNG NUMERIC)`);
  }

}

module.exports = DBHelper