// === 필요한 패키지 임포트 ===
const express = require('express');
var path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config(); // 환경 변수 로드
const bcrypt = require('bcryptjs');
const mysql2 = require('mysql2/promise');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// === 미들웨어 설정 ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/resources', express.static(path.join(__dirname, '/resources')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// === MySQL 연결 설정 ===
const _pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    dateStrings: 'date',
    connectionLimit: 10,
    timezone: '+09:00',
    charset: 'utf8mb4',
});


// === 유틸 함수 ===
async function _getConn() {
    return await _pool.getConnection(async (conn) => conn);
}

async function asyncQuery(sql, params = []) {
    const conn = await _getConn();
    try {
        const [rows, _] = await conn.query(sql, params);
        conn.release();
        return rows;
    } catch (err) {
        console.log(`!! asyncQuery Error \n::${err}\n[sql]::${sql}\n[Param]::${params}`);
    } finally {
        conn.release();
    }
    return false;
}


// === 서버 실행 ===
app.listen(PORT, "0.0.0.0", () => {
    console.log(`server started on PORT ${PORT} // ${new Date()}`);
});


// 메인
app.get('/', async (req, res) => {
    try {
        // const row = await asyncQuery(`SELECT * FROM `, []);
        // res.render('데이터등록', { row: row });

        res.render('index');
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

app.get('/index', async (req, res) => {
    try {
        // const row = await asyncQuery(`SELECT * FROM `, []);
        // res.render('데이터등록', { row: row });

        res.render('index');
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

// 가격안내
app.get('/pricingInfo', async (req, res) => {
    try {
        // const row = await asyncQuery(`SELECT * FROM `, []);
        // res.render('데이터등록', { row: row });

        res.render('pricingInfo');
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

// 회사소개 - 회사소개
app.get('/aboutCompany', async (req, res) => {
    try {
        // const row = await asyncQuery(`SELECT * FROM `, []);
        // res.render('데이터등록', { row: row });

        res.render('aboutCompany');
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

