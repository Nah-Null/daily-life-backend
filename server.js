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
      console.log("DB ERROR:", err);
      return res.json({ message: "Insert Failed", error: err });
    }

    return res.json({ message: "Register Success", id: result.insertId });
  });
});

// ========== LOGIN API ==========
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";

  db.query(sql, [username], (err, results) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.json({ message: "Login Failed", error: err });
    }

    const user = results[0];

    if (!user) {
      return res.json({ message: "User not found" });
    }

    // ไม่ใช้ bcrypt — เทียบตรง ๆ
    if (password === user.password) {
      return res.json({ message: "Login Success", user });
    } else {
      return res.json({ message: "Invalid password" });
    }
  });
});

// ========== LOGIN ADMIN API ==========
app.post("/api/login-@min", (req, res) => {
  const { username, password } = req.body;

  if (username === "Daily@Life" && password === "@min1234") {
    return res.json({ message: "Admin Login Success"});
  }else{
        return res.json({ message: "Next step"});
  }
});

// ========== START SERVER ==========
app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
