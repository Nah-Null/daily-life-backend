const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// ========== CONNECT DATABASE ==========
const db = mysql.createConnection({
  host: "localhost",
  user: "root", 
  password: "",
  database: "Daily_Life_DB"
});

db.connect((err) => {
    if (err) {
        console.log("Database Error:", err);
    } else {
        console.log("MySQL Connected!");
    }
});

// ========== REGISTER API ==========
app.post("/api/register", (req, res) => {
    const { firstname, lastname, email, phone, username, password } = req.body;

    const sql = `
        INSERT INTO users 
        (firstname, lastname, email, phone, username, password) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [firstname, lastname, email, phone, username, password], (err, result) => {
        if (err) {
            console.log("DB ERROR:", err); // ดู error จริง
            return res.json({ message: "Insert Failed", error: err });
        }
        return res.json({ message: "Register Success", id: result.insertId });
    });
});

// ========== START SERVER ==========
app.listen(5000, () => {
    console.log("Backend running on port 5000");
});
