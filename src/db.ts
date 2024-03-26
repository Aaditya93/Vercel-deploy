// Importing necessary modules
const mysql = require('mysql');
require('dotenv').config(); 

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port:"3306",
  user: process.env.DATABASE_USER ,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DB_DATABASE,

}); 

db.connect((err: any) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to the database.');

})



export function executeQuery(query:string) {
  db.query(query, (err:any, result:any) => {
    if (err) {
      console.error('Error executing query:', err);
      
    } else {
      console.log('Query executed successfully:', result);

    }
  });
}

export const deployedDone = async (id:string, deployed:boolean, callback:any) => {
    const deployedValue =deployed ? 1 : 0;
    const insertQuery = `UPDATE vercel SET deployed = 1 WHERE id = '${id}'`;
  
    try {
      const result = await executeQuery(insertQuery);
      callback(null, result);
    } catch (err) {
      callback(err, null);
    }
  };

/* 
await deployedDone("eoen2", true, (err:any, result:any) => {
    if (err) {
      console.error('Error adding entry:', err);
    } else {
      console.log('Entry added successfully.');
    }
  });
  console.log("done")
   */