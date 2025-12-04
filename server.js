const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// ========== DATABASE CONNECTION ==========
const db = mysql.createConnection({
  host: "daily-life-demo-1.cfwiseyse6is.ap-southeast-2.rds.amazonaws.com",
  user: "admin",
  password: "awd486S5!qq",
  database: "Daily_Life_DB",
  port: "3306",
  ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
  if (err) {
    console.log("❌ Database Error:", err);
  } else {
    console.log("✅ MySQL Connected!");
  }
});

// ========== AUTHENTICATION ENDPOINTS ==========

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ?";

  db.query(sql, [username], (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({ success: false, message: "Login Failed", error: err });
    }

    const user = results[0];
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ⚠️ TODO: ใช้ bcrypt.compare() แทนการเทียบรหัสผ่านแบบ Plain Text
    if (password === user.password) {
      return res.json({ success: true, message: "Login Success", user });
    } else {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }
  });
});

// Register
app.post("/api/register", (req, res) => {
  const { firstname, lastname, email, phone, username, password } = req.body;
  const sql = `
    INSERT INTO users 
    (firstname, lastname, email, phone, username, password) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [firstname, lastname, email, phone, username, password], (err, result) => {
    if (err) {
      console.error("=======================================");
      console.error(`[${new Date().toISOString()}] FATAL DB INSERT ERROR`);
      console.error("SQL Query:", sql.trim());
      console.error("Parameters:", [firstname, lastname, email, phone, username, password]);
      console.error("Error Details:", err);
      console.error("=======================================");

      return res.status(500).json({ 
        success: false,
        message: "Register Failed: Internal Server Error", 
        error_code: err.code || "UNKNOWN_DB_ERROR" 
      });
    }

    return res.json({ success: true, message: "Register Success", id: result.insertId });
  });
});

// ========== USER ENDPOINTS ==========

// Get all users
app.get("/user/get-all", (req, res) => {
  const sql = "SELECT * FROM users";

  db.query(sql, (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch users", error: err });
    }
    return res.json({ success: true, data: results });
  });
});

// Get user by ID
app.get("/user/get/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM users WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({ success: false, message: "Search Failed", error: err });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    return res.json({ success: true, data: results[0] });
  });
});

// Update user profile
app.put("/user/update/:id", (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, email, phone, username, password, profile_image } = req.body;

  if (!firstname && !lastname && !email && !phone && !username && !password && !profile_image) {
    return res.status(400).json({
      success: false,
      message: "No fields provided for update"
    });
  }

  let sql = "UPDATE users SET ";
  const fields = [];
  const params = [];

  if (firstname) { fields.push("firstname = ?"); params.push(firstname); }
  if (lastname) { fields.push("lastname = ?"); params.push(lastname); }
  if (email) { fields.push("email = ?"); params.push(email); }
  if (phone) { fields.push("phone = ?"); params.push(phone); }
  if (username) { fields.push("username = ?"); params.push(username); }
  if (password) { fields.push("password = ?"); params.push(password); }
  if (profile_image) { fields.push("profile_image = ?"); params.push(profile_image); }

  sql += fields.join(", ") + " WHERE id = ?";
  params.push(id);

  console.log("UPDATE PROFILE:", sql, params);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(`[${new Date().toISOString()}] DB UPDATE ERROR:`, err);
      return res.status(500).json({
        success: false,
        message: "Update Failed: Internal Server Error",
        error_code: err.code || "UNKNOWN_DB_ERROR"
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

// Admin update user profile
app.put("/admin/user/:id", (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, email, phone, username, password, profile_image } = req.body;

  if (!firstname && !lastname && !email && !phone && !username && !password && !profile_image) {
    return res.status(400).json({
      success: false,
      message: "No fields provided for update"
    });
  }

  let sql = "UPDATE users SET ";
  const fields = [];
  const params = [];

  // ⚠️ WARNING: Password is handled as Plain Text - TODO: use bcrypt hash
  if (password && password.trim() !== '') { 
    fields.push("password = ?"); 
    params.push(password);
  }

  if (firstname) { fields.push("firstname = ?"); params.push(firstname); }
  if (lastname) { fields.push("lastname = ?"); params.push(lastname); }
  if (email) { fields.push("email = ?"); params.push(email); }
  if (phone) { fields.push("phone = ?"); params.push(phone); }
  if (username) { fields.push("username = ?"); params.push(username); }
  if (profile_image) { fields.push("profile_image = ?"); params.push(profile_image); }

  if (fields.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No fields provided for update"
    });
  }

  sql += fields.join(", ") + " WHERE id = ?";
  params.push(id);

  console.log("ADMIN UPDATE:", sql, params);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(`[${new Date().toISOString()}] DB UPDATE ERROR:`, err);
      
      let errorMessage = "Database Error";
      let statusCode = 500;
      if (err.code === 'ER_DUP_ENTRY') {
        errorMessage = "Email or Username already exists.";
        statusCode = 409;
      }

      return res.status(statusCode).json({ 
        success: false, 
        message: errorMessage, 
        error_code: err.code 
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User Not Found" });
    }

    return res.json({ success: true, message: "Profile Updated Successfully" });
  });
});

// Delete user
app.delete("/user/delete/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM users WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({ success: false, error: "Database error during deletion" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "User Deleted Successfully", id });
  });
});

// ========== UNIVERSITY ENDPOINTS ==========

// Get all universities
app.get("/university/get-all", (req, res) => {
  const sql = "SELECT * FROM un_data";

  db.query(sql, (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({ success: false, message: "Search Failed", error: err });
    }
    return res.json({ success: true, data: results });
  });
});

// Search universities
app.post("/university/search", (req, res) => {
  const { university_th, university_en, shortName, faculty, major, province } = req.body;

  let sql = "SELECT * FROM un_data WHERE 1=1";
  const params = [];

  if (university_th && university_th.trim()) {
    sql += " AND university_th LIKE ?";
    params.push(`%${university_th}%`);
  }

  if (university_en && university_en.trim()) {
    sql += " AND university_en LIKE ?";
    params.push(`%${university_en}%`);
  }

  if (shortName && shortName.trim()) {
    sql += " AND university_shortname LIKE ?";
    params.push(`%${shortName}%`);
  }

  if (province && province.trim()) {
    sql += " AND province LIKE ?";
    params.push(`%${province}%`);
  }

  if (faculty && faculty.trim()) {
    sql += " AND JSON_SEARCH(faculties, 'one', ?) IS NOT NULL";
    params.push(faculty);
  }

  if (major && major.trim()) {
    sql += " AND JSON_SEARCH(majors, 'one', ?) IS NOT NULL";
    params.push(major);
  }

  console.log("SEARCH QUERY:", sql, params);

  db.query(sql, params, (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
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

// Get university by ID
app.get("/university/view/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM un_data WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ DB ERROR:", err);
      return res.status(500).json({ success: false, message: "Database Error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "University not found" });
    }

    return res.json({ success: true, data: results[0] });
  });
});

// Update university
app.put("/university/edit/:id", (req, res) => {
  const { id } = req.params;
  const body = req.body;

  console.log("📌 Incoming Edit Request:", body);

  const allowedFields = [
    "university_th",
    "university_en",
    "university_shortname",
    "university_type",
    "province",
    "website",
    "logo",
    "campuses",
    "faculties",
    "majors"
  ];

  let sqlParts = [];
  let params = [];

  // Loop ฟิลด์ที่อนุญาตให้แก้ไข
  allowedFields.forEach(field => {
    if (body.hasOwnProperty(field)) {
      let value = body[field];

      // ถ้าเป็น object หรือ array → แปลง JSON
      if (typeof value === "object" && value !== null) {
        value = JSON.stringify(value);
      }

      sqlParts.push(`${field} = ?`);
      params.push(value);
    }
  });

  // ถ้าไม่มีฟิลด์จะอัปเดตเลย
  if (sqlParts.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid fields provided for update"
    });
  }

  const sql = `UPDATE un_data SET ${sqlParts.join(", ")} WHERE id = ?`;
  params.push(id);

  console.log("📝 SQL:", sql);
  console.log("🧩 Params:", params);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ DB UPDATE ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Update Failed",
        error: err,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "University not found",
      });
    }

    return res.json({
      success: true,
      message: "University Updated Successfully",
    });
  });
});

// Delete university
app.delete("/university/delete/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM un_data WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({ success: false, error: "Database error during deletion" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "University not found" });
    }

    return res.json({ success: true, message: "University Deleted Successfully", id });
  });
});

// ========== EVENT ENDPOINTS ==========

app.get("/event/get", (req, res) => {
  const sql = `
    SELECT organizer_id, organizer_name, activity_id, title, description, location, 
           open_date, close_date, status, image
    FROM event
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching events:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch events", error: err });
    }

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

    const data = Object.values(organizersMap);
    res.json({ success: true, data });
  });
});

// ========== ADD NEW UNIVERSITY ==========
app.post("/university/add", (req, res) => {
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

  if (!university_th || !university_en || !university_shortname) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  // Extract names and auto-generate IDs
  const processField = (data, type) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const processed = data
      .filter(item => {
        const nameField = type === "campuses" ? "campus_name" : type === "faculties" ? "faculty_name" : "major_name";
        return item[nameField] && item[nameField].trim();
      })
      .map((item, index) => {
        const nameField = type === "campuses" ? "campus_name" : type === "faculties" ? "faculty_name" : "major_name";
        return {
          id: index + 1,
          [nameField]: item[nameField].trim()
        };
      });

    return processed.length > 0 ? JSON.stringify(processed) : null;
  };

  const sql = `
    INSERT INTO un_data (
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
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    university_th,
    university_en,
    university_shortname,
    university_type || null,
    province || null,
    website || null,
    logo || null,
    processField(campuses, "campuses"),
    processField(faculties, "faculties"),
    processField(majors, "majors")
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ UNIVERSITY INSERT ERROR:", err);
      return res.status(500).json({
        success: false,
        message: err.code === "ER_DUP_ENTRY" ? "University short name already exists" : "Insert failed",
        error: err.message
      });
    }

    return res.json({
      success: true,
      message: "University added successfully",
      id: result.insertId
    });
  });
});

app.get("/event/get", (req, res) => {
  const sql = "SELECT * FROM event";

  db.query(sql, (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({ success: false, message: "Search Failed", error: err });
    }
    return res.json({ success: true, data: results });
  });
});

// ✅ GET Event by ID
app.get("/event/get/:id", (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required"
    });
  }

  const sql = "SELECT * FROM event WHERE activity_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Search Failed",
        error: err
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    return res.json({
      success: true,
      data: results[0]
    });
  });
});

// ✅ GET ALL Events
app.get("/event/get", (req, res) => {
  const sql = "SELECT * FROM event";

  db.query(sql, (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Search Failed",
        error: err
      });
    }

    return res.json({
      success: true,
      data: results
    });
  });
});

// ✅ GET Events by Organizer ID
app.get("/event/organizer/:organizerId", (req, res) => {
  const { organizerId } = req.params;

  if (!organizerId) {
    return res.status(400).json({
      success: false,
      message: "Organizer ID is required"
    });
  }

  const sql = "SELECT * FROM event WHERE organizer_id = ?";

  db.query(sql, [organizerId], (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Search Failed",
        error: err
      });
    }

    return res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});

// ✅ GET Event by ID
app.get("/event/get/:id", (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required"
    });
  }

  const sql = "SELECT * FROM event WHERE activity_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Search Failed",
        error: err
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    return res.json({
      success: true,
      data: results[0]
    });
  });
});
// ✅ EDIT Event by ID
app.put("/event/edit/:id", (req, res) => {
  const { id } = req.params;
  const {
    activity_id,
    title,
    description,
    location,
    open_date,
    close_date,
    status,
    image,
    organizer_id,
    organizer_name
  } = req.body;

  if (!id || !activity_id || !title) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: id, activity_id, title"
    });
  }

  const sql = `
    UPDATE event 
    SET 
      activity_id = ?,
      title = ?,
      description = ?,
      location = ?,
      open_date = ?,
      close_date = ?,
      status = ?,
      image = ?,
      organizer_id = ?,
      organizer_name = ?
    WHERE id = ?
  `;

  const params = [
    activity_id,
    title,
    description || null,
    location || null,
    open_date || null,
    close_date || null,
    status || null,
    image || null,
    organizer_id || null,
    organizer_name || null,
    id
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ UPDATE EVENT ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Update failed",
        error: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    return res.json({
      success: true,
      message: "Event updated successfully",
      id: id
    });
  });
});
// ✅ DELETE Event by ID
app.delete("/event/delete/:id", (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required"
    });
  }

  const sql = "DELETE FROM event WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ DELETE EVENT ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Delete failed",
        error: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    return res.json({
      success: true,
      message: "Event deleted successfully",
      deletedRows: result.affectedRows
    });
  });
});
// ✅ GET ALL TABLES INFO
app.get("/table/get", (req, res) => {
  const sql = `
    SELECT 
      TABLE_CATALOG,
      TABLE_SCHEMA,
      TABLE_NAME,
      TABLE_TYPE,
      ENGINE,
      VERSION,
      ROW_FORMAT,
      TABLE_ROWS,
      AVG_ROW_LENGTH,
      DATA_LENGTH,
      MAX_DATA_LENGTH,
      INDEX_LENGTH,
      DATA_FREE,
      AUTO_INCREMENT,
      CREATE_TIME,
      UPDATE_TIME,
      CHECK_TIME,
      TABLE_COLLATION,
      CHECKSUM,
      CREATE_OPTIONS,
      TABLE_COMMENT
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ GET TABLES ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch tables",
        error: err.message
      });
    }

    return res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});

// ✅ GET TABLE INFO BY NAME
app.get("/table/:tableName", (req, res) => {
  const { tableName } = req.params;

  if (!tableName) {
    return res.status(400).json({
      success: false,
      message: "Table name is required"
    });
  }

  const sql = `
    SELECT 
      TABLE_CATALOG,
      TABLE_SCHEMA,
      TABLE_NAME,
      TABLE_TYPE,
      ENGINE,
      VERSION,
      ROW_FORMAT,
      TABLE_ROWS,
      AVG_ROW_LENGTH,
      DATA_LENGTH,
      MAX_DATA_LENGTH,
      INDEX_LENGTH,
      DATA_FREE,
      AUTO_INCREMENT,
      CREATE_TIME,
      UPDATE_TIME,
      CHECK_TIME,
      TABLE_COLLATION,
      CHECKSUM,
      CREATE_OPTIONS,
      TABLE_COMMENT
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
  `;

  db.query(sql, [tableName], (err, results) => {
    if (err) {
      console.error("❌ GET TABLE ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch table",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Table '${tableName}' not found`
      });
    }

    return res.json({
      success: true,
      data: results[0]
    });
  });
});

// ✅ GET TABLE COLUMNS
app.get("/table/:tableName/columns", (req, res) => {
  const { tableName } = req.params;

  if (!tableName) {
    return res.status(400).json({
      success: false,
      message: "Table name is required"
    });
  }

  const sql = `
    SELECT 
      COLUMN_NAME,
      ORDINAL_POSITION,
      COLUMN_DEFAULT,
      IS_NULLABLE,
      DATA_TYPE,
      CHARACTER_MAXIMUM_LENGTH,
      NUMERIC_PRECISION,
      NUMERIC_SCALE,
      COLUMN_KEY,
      EXTRA,
      COLUMN_COMMENT
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
  `;

  db.query(sql, [tableName], (err, results) => {
    if (err) {
      console.error("❌ GET COLUMNS ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch columns",
        error: err.message
      });
    }

    return res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});

// ✅ GET TABLE SIZE
app.get("/table/:tableName/size", (req, res) => {
  const { tableName } = req.params;

  if (!tableName) {
    return res.status(400).json({
      success: false,
      message: "Table name is required"
    });
  }

  const sql = `
    SELECT 
      TABLE_NAME,
      ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
      TABLE_ROWS,
      ROUND((data_length / TABLE_ROWS), 2) AS avg_row_size_bytes
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
  `;

  db.query(sql, [tableName], (err, results) => {
    if (err) {
      console.error("❌ GET TABLE SIZE ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch table size",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Table '${tableName}' not found`
      });
    }

    return res.json({
      success: true,
      data: results[0]
    });
  });
});

// ✅ GET ALL TABLES SIZE
app.get("/tables/size/all", (req, res) => {
  const sql = `
    SELECT 
      TABLE_NAME,
      ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
      TABLE_ROWS,
      ROUND((data_length / TABLE_ROWS), 2) AS avg_row_size_bytes
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY (data_length + index_length) DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ GET ALL TABLES SIZE ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch tables size",
        error: err.message
      });
    }

    return res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});


// ========== START SERVER ==========
app.listen(5000, () => {
  console.log("🚀 Backend running on port 5000");
});