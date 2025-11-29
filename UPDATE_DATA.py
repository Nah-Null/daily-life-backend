import csv
import json
import mysql.connector

# ===================== LOGO MAPPING & NEW DATA =====================
# Logo URLs ที่คุณให้มา โดยใช้ชื่อย่อเป็นคีย์ในการจับคู่
logo_map = {
    "AIT": "https://raw.githubusercontent.com/Nah-Null/Gallery/24be533860f04f6a2e663a8559b6b8485cca6b0b/DailyLife/logo%20un/AIT.svg",
    "BU": "https://raw.githubusercontent.com/Nah-Null/Gallery/24be533860f04f6a2e663a8559b6b8485cca6b0b/DailyLife/logo%20un/BU.svg",
    "BUU": "https://raw.githubusercontent.com/Nah-Null/Gallery/24be533860f04f6a2e663a8559b6b8485cca6b0b/DailyLife/logo%20un/BUU.svg",
    "KMITL": "https://raw.githubusercontent.com/Nah-Null/Gallery/24be533860f04f6a2e663a8559b6b68485cca6b0b/DailyLife/logo%20un/KMITL.svg",
    "KMUTNB": "https://raw.githubusercontent.com/Nah-Null/Gallery/24be533860f04f6a2e663a8559b6b8485cca6b0b/DailyLife/logo%20un/KMUTNB.svg",
    "KMUTT": "https://raw.githubusercontent.com/Nah-Null/Gallery/24be533860f04f6a2e663a8559b6b8485cca6b0b/DailyLife/logo%20un/KMUTT.svg",
    "KU": "https://github.com/Nah-Null/Gallery/blob/main/DailyLife/logo%20un/KU.png?raw=true",
    "SWU": "https://github.com/Nah-Null/Gallery/blob/main/DailyLife/logo%20un/Logo_of_Srinakharinwirot_University.svg.png?raw=true",
    "MU": "https://raw.githubusercontent.com/Nah-Null/Gallery/24be533860f04f6a2e663a8559b6b8485cca6b0b/DailyLife/logo%20un/MU.svg",
    "PIM": "https://raw.githubusercontent.com/Nah-Null/Gallery/24be533860f04f6a2e663a8559b6b8485cca6b0b/DailyLife/logo%20un/PIM.svg",
    "RMUTI": "https://github.com/Nah-Null/Gallery/blob/main/DailyLife/logo%20un/RMUTI.png?raw=true",
    "SDU": "https://raw.githubusercontent.com/Nah-Null/Gallery/24be533860f04f6a2e663a8559b6b8485cca6b0b/DailyLife/logo%20un/SDU.svg",
    "TU": "https://raw.githubusercontent.com/Nah-Null/Gallery/24be533860f04f6a2e663a8559b6b8485cca6b0b/DailyLife/logo%20un/TU.svg",
    "CU": "https://github.com/Nah-Null/Gallery/blob/main/DailyLife/logo%20un/%E0%B8%88%E0%B8%B8%E0%B8%AC%E0%B8%B2.png?raw=true",
}

# กำหนดประเภทของมหาวิทยาลัยใหม่ (ถ้าไม่ระบุในข้อมูลเดิม)
def get_university_type(short_name):
    if short_name in ["CU", "TU", "MU", "KU", "CMU", "KKU", "PSU", "SWU", "SU", "NU", "BUU", "MSU", "UBU", "TSU", "MFU", "WU", "STOU", "RU"]:
        return "Public University"
    if short_name in ["KBU", "BU", "ABAC", "SPU", "RSU", "TNI", "PIM"]:
        return "Private University"
    if short_name in ["KMUTT", "KMITL", "KMUTNB", "RMUTT", "RMUTK", "RMUTSV", "RMUTI", "RMUTL", "RMUTP", "RMUTR"]:
        return "Government Technology/Institute"
    if "RU" in short_name or "RRU" in short_name or "CRU" in short_name or "NRRU" in short_name or "PNRU" in short_name or "SSRU" in short_name:
        return "Rajabhat University"
    if short_name in ["MCU", "MBU"]:
        return "Buddhist University"
    return "Other"

# ===================== CONNECT DATABASE =====================
try:
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="Daily_Life_DB"
    )
    cursor = db.cursor()
    print("✓ เชื่อมต่อฐานข้อมูลสำเร็จ")
except mysql.connector.Error as err:
    print(f"✗ เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: {err}")
    exit()

# ===================== CREATE TABLE =====================
cursor.execute("""
CREATE TABLE IF NOT EXISTS un_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uni_id VARCHAR(255),
    university_th VARCHAR(255),
    university_en VARCHAR(255),
    university_shortname VARCHAR(255),
    university_type VARCHAR(255),
    province VARCHAR(255),
    website TEXT,
    logo TEXT,
    campuses JSON,
    faculties JSON,
    majors JSON,
    raw_json JSON
) CHARACTER SET utf8mb4;
""")
print("✓ ตาราง 'un_data' ถูกสร้าง/ตรวจสอบแล้ว")

# ===================== SAMPLE DATA (รวมข้อมูลเดิมและที่แก้ไข/เพิ่มเติม) =====================
# *** ข้อมูลที่แก้ไข/เพิ่มเติม:
# 1. แก้ไข KMUTNB (index 9) ให้ชื่อไทยถูกต้อง
# 2. แก้ไข BUU (index 10) ให้ short name เป็น 'BUU' เพื่อให้สอดคล้องกับ logo_map
# 3. แก้ไข RMUTR (index 34) แก้ไข KeyError
# 4. เพิ่ม PIM (index 49)
universities = [
    {"name_th":"จุฬาลงกรณ์มหาวิทยาลัย","name_en":"Chulalongkorn University","short":"CU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยเกษตรศาสตร์","name_en":"Kasetsart University","short":"KU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยธรรมศาสตร์","name_en":"Thammasat University","short":"TU","province":"ปทุมธานี"},
    {"name_th":"มหาวิทยาลัยมหิดล","name_en":"Mahidol University","short":"MU","province":"นครปฐม"},
    {"name_th":"มหาวิทยาลัยเชียงใหม่","name_en":"Chiang Mai University","short":"CMU","province":"เชียงใหม่"},
    {"name_th":"มหาวิทยาลัยขอนแก่น","name_en":"Khon Kaen University","short":"KKU","province":"ขอนแก่น"},
    {"name_th":"มหาวิทยาลัยสงขลานครินทร์","name_en":"Prince of Songkla University","short":"PSU","province":"สงขลา"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี","name_en":"King Mongkut's University of Technology Thonburi","short":"KMUTT","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าลาดกระบัง","name_en":"King Mongkut's Institute of Technology Ladkrabang","short":"KMITL","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ","name_en":"King Mongkut's University of Technology North Bangkok","short":"KMUTNB","province":"กรุงเทพมหานคร"}, # แก้ไขชื่อไทย
    {"name_th":"มหาวิทยาลัยบูรพา","name_en":"Burapha University","short":"BUU","province":"ชลบุรี"}, # เปลี่ยน short name เป็น BUU
    {"name_th":"มหาวิทยาลัยศรีนครินทรวิโรฒ","name_en":"Srinakharinwirot University","short":"SWU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยแม่ฟ้าหลวง","name_en":"Mae Fah Luang University","short":"MFU","province":"เชียงราย"},
    {"name_th":"มหาวิทยาลัยนเรศวร","name_en":"Naresuan University","short":"NU","province":"พิษณุโลก"},
    {"name_th":"มหาวิทยาลัยราชภัฏเชียงราย","name_en":"Chiang Rai Rajabhat University","short":"CRRU","province":"เชียงราย"},
    {"name_th":"มหาวิทยาลัยอุบลราชธานี","name_en":"Ubon Ratchathani University","short":"UBU","province":"อุบลราชธานี"},
    {"name_th":"มหาวิทยาลัยมหาสารคาม","name_en":"Mahasarakham University","short":"MSU","province":"มหาสารคาม"},
    {"name_th":"มหาวิทยาลัยศิลปากร","name_en":"Silpakorn University","short":"SU","province":"นครปฐม"},
    {"name_th":"มหาวิทยาลัยราชภัฏพระนคร","name_en":"Phranakhon Rajabhat University","short":"PRU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยรามคำแหง","name_en":"Ramkhamhaeng University","short":"RU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยวลัยลักษณ์","name_en":"Valaya Alongkorn Rajabhat University","short":"VRU","province":"ปทุมธานี"},
    {"name_th":"มหาวิทยาลัยเกษม บัณฑิต","name_en":"Kasem Bundit University","short":"KBU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยกรุงเทพ","name_en":"Bangkok University","short":"BU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยอัสสัมชัญ","name_en":"Assumption University","short":"ABAC","province":"สมุทรปราการ"},
    {"name_th":"มหาวิทยาลัยศรีปทุม","name_en":"Sripatum University","short":"SPU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยรังสิต","name_en":"Rangsit University","short":"RSU","province":"ปทุมธานี"},
    {"name_th":"สถาบันพระปกเกล้า","name_en":"King Prajadhipok's Institute","short":"KPI","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยสุโขทัยธรรมาธิราช","name_en":"Sukhothai Thammathirat Open University","short":"STOU","province":"นนทบุรี"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีราชมงคล ธัญบุรี","name_en":"Rajamangala University of Technology Thanyaburi","short":"RMUTT","province":"ปทุมธานี"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีราชมงคล กรุงเทพ","name_en":"Rajamangala University of Technology Krungthep","short":"RMUTK","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีราชมงคล ศรีวิชัย","name_en":"Rajamangala University of Technology Srivijaya","short":"RMUTSV","province":"สงขลา"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีราชมงคล อีสาน","name_en":"Rajamangala University of Technology Isan","short":"RMUTI","province":"ขอนแก่น"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีราชมงคล ล้านนา","name_en":"Rajamangala University of Technology Lanna","short":"RMUTL","province":"เชียงใหม่"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีราชมงคล พระนคร","name_en":"Rajamangala University of Technology Phra Nakhon","short":"RMUTP","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีราชมงคล รัตนโกสินทร์","name_en":"Rajamangala University of Technology Rattanakosin","short":"RMUTR","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยมหาจุฬาลงกรณ์ราชวิทยาลัย","name_en":"Mahachulalongkornrajavidyalaya University","short":"MCU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยมหามกุฏ พุทธศาสตร์","name_en":"Mahamakut Buddhist University","short":"MBU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยเทคโนโลยีพระจอมเกล้า","name_en":"King Mongkut's University of Technology","short":"KMUT","province":"กรุงเทพมหานคร"},
    {"name_th":"สถาบันเทคโนโลยีไทย-นิชิ","name_en":"Thai-Nichi Institute of Technology","short":"TNI","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยราชภัฏพระนคร","name_en":"Rajabhat Phranakhon","short":"PRU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยราชภัฏสวนสุนันทา","name_en":"Rajabhat Suan Sunandha","short":"SSRU","province":"กรุงเทพมหานคร"},
    {"name_th":"มหาวิทยาลัยราชภัฏราชนครินทร์","name_en":"Rajabhat Rajanagarindra","short":"RRU","province":"ฉะเชิงเทรา"},
    {"name_th":"มหาวิทยาลัยราชภัฏเชียงใหม่","name_en":"Rajabhat Chiang Mai","short":"CMRU","province":"เชียงใหม่"},
    {"name_th":"มหาวิทยาลัยราชภัฏขอนแก่น","name_en":"Rajabhat Khon Kaen","short":"KKRU","province":"ขอนแก่น"},
    {"name_th":"มหาวิทยาลัยทักษิณ","name_en":"Thaksin University","short":"TSU","province":"สงขลา"},
    {"name_th":"มหาวิทยาลัยราชภัฏยะลา","name_en":"Yala Rajabhat University","short":"YRU","province":"ยะลา"},
    {"name_th":"มหาวิทยาลัยราชภัฏชุมพร","name_en":"Prince of Chumphon University","short":"PCU","province":"ชุมพร"},
    {"name_th":"มหาวิทยาลัยวไลยลักษณ์","name_en":"Walailak University","short":"WU","province":"นครศรีธรรมราช"},
    {"name_th":"มหาวิทยาลัยราชภัฏเพชรบูรณ์","name_en":"Phetchaburi Rajabhat University","short":"PRU","province":"เพชรบูรณ์"},
    # *** ข้อมูล PIM ที่เพิ่มเข้ามา ***
    {"name_th":"สถาบันการจัดการปัญญาภิวัฒน์","name_en":"Panyapiwat Institute of Management","short":"PIM","province":"นนทบุรี"},
]

faculty_list = ["วิศวกรรมศาสตร์","วิทยาศาสตร์","แพทยศาสตร์","กฎหมาย","อักษรศาสตร์","เกษตรศาสตร์","บริหารธุรกิจ","สถาปัตยกรรม"]
major_list = ["วิศวกรรมคอมพิวเตอร์","ชีววิทยา","เศรษฐศาสตร์","กฎหมายมหาชน","วิทยาศาสตร์เกษตร","การบัญชี","สถาปัตยกรรมสถานที่","การแพทย์"]

# ===================== CREATE CSV (สร้างไฟล์ชั่วคราวตามโครงสร้าง DB) =====================
csv_file = "universities_for_db.csv"
db_columns = ["id","uni_id","university_th","university_en","university_shortname","university_type","province","website","logo","campuses","faculties","majors","raw_json"] 

data_for_csv = []
for i, uni in enumerate(universities):
    uni_id = str(1000 + i + 1)
    short_name = uni["short"]

    # กำหนด Logo URL: ใช้จาก logo_map ถ้ามี, ถ้าไม่มีให้ใช้ URL Generic
    logo_url = logo_map.get(short_name, f"https://example.com/logo/university{i+1}.png")
    
    # กำหนด University Type
    uni_type = get_university_type(short_name)

    # สร้างข้อมูล JSON
    campuses_data = [{"campus_id": i + 1, "campus_name": f"Campus {i + 1}"}]
    faculties_data = [{"faculty_id": (i + 1) * 10 + j, "faculty_name": faculty_list[j % len(faculty_list)]} for j in range(3)]
    majors_data = [{"major_id": (i + 1) * 100 + j, "major_name": major_list[j % len(major_list)]} for j in range(3)]
    
    # สร้าง raw_json
    raw_json_data = {
        "uni_id": uni_id,
        "university_th": uni["name_th"],
        "university_en": uni["name_en"],
        "university_shortname": short_name,
        "university_type": uni_type,
        "province": uni["province"],
        "website": f"https://www.university{i+1}.ac.th",
        "logo": logo_url,
        "campuses": campuses_data,
        "faculties": faculties_data,
        "majors": majors_data
    }
    
    # ข้อมูลสำหรับบันทึกใน CSV (JSON fields must be strings)
    row_data = {
        "id": i + 1, 
        "uni_id": uni_id,
        "university_th": uni["name_th"],
        "university_en": uni["name_en"],
        "university_shortname": short_name,
        "university_type": uni_type,
        "province": uni["province"],
        "website": f"https://www.university{i+1}.ac.th",
        "logo": logo_url, # ใช้ logo URL ที่กำหนดเอง
        "campuses": json.dumps(campuses_data, ensure_ascii=False), 
        "faculties": json.dumps(faculties_data, ensure_ascii=False),
        "majors": json.dumps(majors_data, ensure_ascii=False),
        "raw_json": json.dumps(raw_json_data, ensure_ascii=False) 
    }
    data_for_csv.append(row_data)

# เขียนไฟล์ CSV
with open(csv_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=db_columns)
    writer.writeheader()
    writer.writerows(data_for_csv)

print("✓ CSV file created:", csv_file)

# ===================== INSERT CSV INTO DB =====================
with open(csv_file, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    insert_count = 0
    
    # เตรียมคำสั่ง SQL (ไม่รวม 'id' เพราะเป็น AUTO_INCREMENT)
    target_columns = [col for col in db_columns if col != 'id'] 
    column_names = ", ".join(target_columns)
    placeholders = ", ".join(["%s"] * len(target_columns))
    
    sql_insert = f"INSERT INTO un_data ({column_names}) VALUES ({placeholders})"
    
    for row in reader:
        # เตรียมค่าสำหรับ INSERT โดยเรียงตาม target_columns
        values = [row[col] for col in target_columns]
        
        try:
            cursor.execute(sql_insert, values)
            insert_count += 1
        except mysql.connector.Error as err:
            print(f"✗ เกิดข้อผิดพลาดในการ INSERT ข้อมูล: {err}")
            print(f"  ข้อมูลที่ล้มเหลว: {row['university_th']}")

db.commit()
db.close()
print(f"✓ Inserted {insert_count} universities into DB successfully!")