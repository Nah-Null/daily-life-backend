const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// ========== CONNECT DATABASE ==========
const db = mysql.createConnection({
  host: "daily-life-demo-1.cfwiseyse6is.ap-southeast-2.rds.amazonaws.com",
  user: "admin",
  password: "awd486S5!qq",
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

//=======search University=========
app.post("/api/search-university", (req, res) => {
  const { 
    university_th, 
    university_en, 
    shortName, 
    faculty, 
    major, 
    province 
  } = req.body;
  
  let sql = "SELECT * FROM un_data WHERE 1=1";
  const params = [];

  // search university name (Thai)
  if (university_th && university_th.trim()) {
    sql += " AND university_th LIKE ?";
    params.push(`%${university_th}%`);
  }

  // search university name (English)
  if (university_en && university_en.trim()) {
    sql += " AND university_en LIKE ?";
    params.push(`%${university_en}%`);
  }

  // search short name
  if (shortName && shortName.trim()) {
    sql += " AND university_shortname LIKE ?";
    params.push(`%${shortName}%`);
  }

  // search province
  if (province && province.trim()) {
    sql += " AND province LIKE ?";
    params.push(`%${province}%`);
  }

  // search faculty in JSON
  if (faculty && faculty.trim()) {
    sql += " AND JSON_SEARCH(faculties, 'one', ?) IS NOT NULL";
    params.push(faculty);
  }

  // search major in JSON
  if (major && major.trim()) {
    sql += " AND JSON_SEARCH(majors, 'one', ?) IS NOT NULL";
    params.push(major);
  }

  console.log("SQL Query:", sql);
  console.log("Params:", params);

  db.query(sql, params, (err, results) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.status(500).json({ 
        success: false,
        message: "Search Failed", 
        error: err.message 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "No universities found",
        data: []
      });
    }

    return res.json({ 
      success: true,
      message: `Found ${results.length} result(s)`,
      data: results 
    });
  });
});


//=======get all University=========
app.get("/api/search-all-university", (req, res) => {

  const sql = "SELECT * FROM un_data ";

  db.query(sql,(err, results) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.json({ message: "Search Failed", error: err });
    }else {
      return res.json({ message: results });
    }
  });
});

// ========== START SERVER ==========
app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
