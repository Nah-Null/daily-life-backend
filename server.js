const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// ========== CONNECT DATABASE ==========
const db = mysql.createConnection({
  host: "daily-life-demo-1.cfwiseyse6is.ap-southeast-2.rds.amazonaws.com",
  user: "admin",
  password: "awd486S5!qq",
  database: "Daily_Life_DB",
  port: "3306",
  ssl: { rejectUnauthorized: false } // ต้องใส่ถ้า RDS require SSL
});


db.connect((err) => {
  if (err) {
    console.log("Database Error:", err);
  } else {
    console.log("MySQL Connected!");
  }
});

// ========== REGISTER API ==========
// ========== REGISTER API (ปรับปรุงการ Log) ==========
app.post("/api/register", (req, res) => {
  const { firstname, lastname, email, phone, username, password } = req.body;

  const sql = `
    INSERT INTO users 
    (firstname, lastname, email, phone, username, password) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [firstname, lastname, email, phone, username, password], (err, result) => {
    if (err) {
      // 📝 ปรับปรุงการ Log เพื่อระบุวันที่/เวลา และรายละเอียดการ Query ที่มีปัญหา
      console.error("=======================================");
      console.error(`[${new Date().toISOString()}] FATAL DB INSERT ERROR`);
      console.error("SQL Query:", sql.trim()); // แสดง Query ที่รัน
      console.error("Parameters:", [firstname, lastname, email, phone, username, password]); // แสดงข้อมูลที่พยายามใส่
      console.error("Error Details:", err); // แสดงรายละเอียด Error จากฐานข้อมูล
      console.error("=======================================");

      // ส่ง response กลับไป (ไม่ควรส่ง Error object เต็มรูปแบบกลับไปใน Production)
      return res.status(500).json({ 
        message: "Insert Failed: Internal Server Error", 
        // ใน Production ควรส่งแค่รหัส Error หรือข้อความทั่วไปเท่านั้น
        error_code: err.code || "UNKNOWN_DB_ERROR" 
      });
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
// app.post("/api/login-@min", (req, res) => {
//   const { username, password } = req.body;

//   if (username === "Daily@Life" && password === "@min1234") {
//     return res.json({ message: "Admin Login Success"});
//   }else{
//         return res.json({ message: "Next step"});
//   }
// });

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

// ========== UPDATE PROFILE API ==========
app.put("/api/user/:id", (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, email, phone, username, password, profile_image } = req.body;

  // ตรวจสอบว่าไม่มีข้อมูลเลย = ไม่อนุญาต
  if (!firstname && !lastname && !email && !phone && !username && !password && !profile_image) {
    return res.status(400).json({
      success: false,
      message: "No fields provided for update"
    });
  }

  // สร้าง Dynamic SQL
  let sql = "UPDATE users SET ";
  const fields = [];
  const params = [];

  if (firstname) { fields.push("firstname = ?"); params.push(firstname); }
  if (lastname)  { fields.push("lastname = ?"); params.push(lastname); }
  if (email)     { fields.push("email = ?"); params.push(email); }
  if (phone)     { fields.push("phone = ?"); params.push(phone); }
  if (username)  { fields.push("username = ?"); params.push(username); }
  if (password)  { fields.push("password = ?"); params.push(password); }
  if (profile_image) { fields.push("profile_image = ?"); params.push(profile_image); }

  sql += fields.join(", ") + " WHERE id = ?";
  params.push(id);

  console.log("===== UPDATE PROFILE QUERY =====");
  console.log("SQL:", sql);
  console.log("Params:", params);
  console.log("================================");

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(`[${new Date().toISOString()}] FATAL DB UPDATE ERROR`, err);
      return res.status(500).json({
        success: false,
        message: "Update Failed: Internal Server Error",
        error_code: err.code || "UNKNOWN_DB_ERROR",
        error_message: err.sqlMessage
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User Not Found"
      });
    }

    return res.json({
      success: true,
      message: "Profile Updated Successfully"
    });
  });
});
//=======get all user=========
app.get("/api/all-user", (req, res) => {

  const sql = "SELECT * FROM users ";

  db.query(sql,(err, results) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.json({ message: "Search Failed", error: err });
    }else {
      return res.json({ message: results });
    }
  });
});
app.delete("/api/delete/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM users WHERE id = ?";
  
  // db.query(sql, [id], ... ) <--- อย่าลืมส่งค่า id เข้าไปใน Query!
  
  db.query(sql, [id], (err, results) => {
    // 1. ตรวจสอบ 'err' ซึ่งเป็นตัวแปรแรกที่รับมาจาก Callback
    if(err){ 
      console.log("DB ERROR:", err);
      // ควรส่ง Status Code 500 กลับไปด้วย
      return res.status(500).json({ error: "Database error during deletion" }); 
    }
    
    // 2. ตรวจสอบว่ามีการลบข้อมูลจริงหรือไม่ (Optional แต่แนะนำ)
    if (results.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
    }
    
    // 3. ถ้าลบสำเร็จ
    return res.json({ message: "Delete Success", id: id });
  });
});

app.get("/userby/:id", (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM users WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.json({ message: "Search Failed", error: err });
    }
  else {
      return res.json({ message: results });
    }
  });
});
app.put("/admin/user/:id", (req, res) => {
    const { id } = req.params;
    const { firstname, lastname, email, phone, username, password, profile_image } = req.body;

    // 1. Validate: At least one field is required
    if (!firstname && !lastname && !email && !phone && !username && !password && !profile_image) {
        return res.status(400).json({
            success: false,
            message: "No fields provided for update"
        });
    }

    // 2. Prepare Dynamic SQL
    let sql = "UPDATE users SET ";
    const fields = [];
    const params = [];

    // ⚠️ WARNING: Password is handled here as Plain Text if provided
    if (password && password.trim() !== '') { 
        fields.push("password = ?"); 
        params.push(password);
    }
    
    // Non-password fields
    if (firstname) { fields.push("firstname = ?"); params.push(firstname); }
    if (lastname)  { fields.push("lastname = ?"); params.push(lastname); }
    if (email)     { fields.push("email = ?"); params.push(email); }
    if (phone)     { fields.push("phone = ?"); params.push(phone); }
    if (username)  { fields.push("username = ?"); params.push(username); }
    if (profile_image) { fields.push("profile_image = ?"); params.push(profile_image); }

    // Final check to ensure there is something to update (after checking password)
    if (fields.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No fields provided for update (after trimming password)"
        });
    }
    
    sql += fields.join(", ") + " WHERE id = ?";
    params.push(id);

    console.log("===== UPDATE PROFILE QUERY =====");
    console.log("SQL:", sql);
    console.log("Params:", params);
    console.log("================================");

    // 3. Execute DB Query
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] DB UPDATE ERROR:`, err);
            
            // Check for specific DB errors (e.g., Unique Constraint violation)
            let errorMessage = "Database Error";
            let statusCode = 500;
            if (err.code === 'ER_DUP_ENTRY') {
                errorMessage = "Email or Username already exists.";
                statusCode = 409; // Conflict
            } else if (err.sqlMessage) {
                errorMessage = `SQL Error: ${err.sqlMessage}`;
            }

            return res.status(statusCode).json({ success: false, message: errorMessage, error_code: err.code });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User Not Found" });
        }
        
        return res.json({ success: true, message: "Profile Updated Successfully" });
    });
});
app.delete("/university/delete/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM un_data WHERE id = ?";
  
  // db.query(sql, [id], ... ) <--- อย่าลืมส่งค่า id เข้าไปใน Query!
  
  db.query(sql, [id], (err, results) => {
    // 1. ตรวจสอบ 'err' ซึ่งเป็นตัวแปรแรกที่รับมาจาก Callback
    if(err){ 
      console.log("DB ERROR:", err);
      // ควรส่ง Status Code 500 กลับไปด้วย
      return res.status(500).json({ error: "Database error during deletion" }); 
    }
    
    // 2. ตรวจสอบว่ามีการลบข้อมูลจริงหรือไม่ (Optional แต่แนะนำ)
    if (results.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
    }
    
    // 3. ถ้าลบสำเร็จ
    return res.json({ message: "Delete Success", id: id });
  });
});

// ========== GET UNIVERSITY BY ID ==========
app.get("/university/view/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM un_data WHERE id = ?";

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("DB ERROR:", err);
            return res.status(500).json({ success: false, message: "Database Error", error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "University not found" });
        }

        return res.json({ success: true, data: results[0] });
    });
});

// ========== EDIT UNIVERSITY ==========
app.put("/university/edit/:id", (req, res) => {
    const { id } = req.params;
    const {
        university_th,
        university_en,
        university_shortname,
        university_type,
        province,
        website,
        logo,
        campuses,
        faculties,
        majors
    } = req.body;

    let sql = "UPDATE un_data SET ";
    const fields = [];
    const params = [];

    if (university_th) { fields.push("university_th = ?"); params.push(university_th); }
    if (university_en) { fields.push("university_en = ?"); params.push(university_en); }
    if (university_shortname) { fields.push("university_shortname = ?"); params.push(university_shortname); }
    if (university_type) { fields.push("university_type = ?"); params.push(university_type); }
    if (province) { fields.push("province = ?"); params.push(province); }
    if (website) { fields.push("website = ?"); params.push(website); }
    if (logo) { fields.push("logo = ?"); params.push(logo); }
    
    // Handle JSON fields (assuming they might be passed as objects or strings)
    if (campuses) { 
        fields.push("campuses = ?"); 
        params.push(typeof campuses === 'object' ? JSON.stringify(campuses) : campuses); 
    }
    if (faculties) { 
        fields.push("faculties = ?"); 
        params.push(typeof faculties === 'object' ? JSON.stringify(faculties) : faculties); 
    }
    if (majors) { 
        fields.push("majors = ?"); 
        params.push(typeof majors === 'object' ? JSON.stringify(majors) : majors); 
    }

    if (fields.length === 0) {
        return res.status(400).json({ success: false, message: "No fields provided for update" });
    }

    sql += fields.join(", ") + " WHERE id = ?";
    params.push(id);

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("DB UPDATE ERROR:", err);
            return res.status(500).json({ success: false, message: "Update Failed", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "University not found" });
        }

        return res.json({ success: true, message: "University Updated Successfully" });
    });
});

app.get("/event/get", (req, res) => {
    // ดึงข้อมูลจากตาราง event
    const sql = `
        SELECT organizer_id, organizer_name, activity_id, title, description, location, 
               open_date, close_date, status, image
        FROM event
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("✗ Error fetching events:", err);
            return res.status(500).json({ message: "Failed to fetch events", error: err });
        }

        // รวมกิจกรรมตามผู้จัด
        const organizersMap = {};
        results.forEach(row => {
            if (!organizersMap[row.organizer_id]) {
                organizersMap[row.organizer_id] = {
                    organizer_id: row.organizer_id,
                    organizer_name: row.organizer_name,
                    activities: []
                };
            }
            organizersMap[row.organizer_id].activities.push({
                activity_id: row.activity_id,
                title: row.title,
                description: row.description,
                location: row.location,
                open_date: row.open_date,
                close_date: row.close_date,
                status: row.status,
                image: row.image
            });
        });

        // แปลงจาก object เป็น array
        const data = Object.values(organizersMap);

        res.json({ success: true, data });
    });
});

// ========== START SERVER ==========
app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
