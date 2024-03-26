"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployedDone = exports.executeQuery = void 0;
// Importing necessary modules
const mysql = require('mysql');
require('dotenv').config();
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: "3306",
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DB_DATABASE,
});
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to the database.');
});
function executeQuery(query) {
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
        }
        else {
            console.log('Query executed successfully:', result);
        }
    });
}
exports.executeQuery = executeQuery;
const deployedDone = (id, deployed, callback) => __awaiter(void 0, void 0, void 0, function* () {
    const deployedValue = deployed ? 1 : 0;
    const insertQuery = `UPDATE vercel SET deployed = 1 WHERE id = '${id}'`;
    try {
        const result = yield executeQuery(insertQuery);
        callback(null, result);
    }
    catch (err) {
        callback(err, null);
    }
});
exports.deployedDone = deployedDone;
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
