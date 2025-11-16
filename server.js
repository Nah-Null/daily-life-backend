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
    const { firstname, lastname } = req.body;

    const sql = "INSERT INTO users (firstname, lastname) VALUES (?, ?)";
    db.query(sql, [firstname, lastname], (err) => {
        if (err) return res.json({ message: "Insert Failed", error: err });
        return res.json({ message: "Register Success" });
    });
});

// ========== START SERVER ==========
app.listen(5000, () => {
    console.log("Backend running on port 5000");
});
