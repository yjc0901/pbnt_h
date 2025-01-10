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

// 세션 스토어 설정
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4',
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
});

// 세션 설정
app.use(session({
    key: 'pbnt_session',
    secret: process.env.SESSION_SECRET, // .env 파일에 저장된 키
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // HTTPS 사용 시 true로 설정
        httpOnly: true, // 클라이언트에서 쿠키 접근 차단
        sameSite: 'strict', // CSRF 방지
        maxAge: 1000 * 60 * 60 // 1시간
    }
}));


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


// === 로그인 관련 설정 ===
// 로그인 상태를 모든 뷰에서 사용할 수 있도록 설정
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn || false;
    res.locals.user = req.session.user || null;
    next();
});

// 로그인 페이지 렌더링
app.get('/login', (req, res) => {
    const message = req.query.message || req.session.message;
    req.session.message = null;  // 메시지 사용 후 삭제
    res.render('login', { message });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('로그인 시도:', { username }); // 비밀번호는 로그에 남기지 않음
    
    try {
        // 사용자 조회 (비밀번호는 따로 검증)
        const rows = await asyncQuery(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        console.log('조회 결과:', rows); // 쿼리 결과 확인

        if (rows && rows.length > 0) {
            // 비밀번호 검증
            const match = await bcrypt.compare(password, rows[0].password);
            
            if (match) {
                req.session.isLoggedIn = true;
                req.session.user = rows[0];
                console.log('세션 설정:', req.session); // 세션 설정 확인
                req.session.message = '로그인되었습니다.';
                res.redirect('/');
            } else {
                req.session.message = '아이디 또는 비밀번호가 일치하지 않습니다.';
                res.redirect('/login');
            }
        } else {
            req.session.message = '아이디 또는 비밀번호가 일치하지 않습니다.';
            res.redirect('/login');
        }
    } catch (err) {
        console.error('로그인 오류:', err);
        req.session.message = '로그인 처리 중 오류가 발생했습니다.';
        res.redirect('/login');
    }
});

// 로그아웃
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.send(`
            <script>
                alert('로그아웃되었습니다.');
                window.location.href = '/';
            </script>
        `);
    });
});

// 로그인 체크 미들웨어
const checkLogin = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.send(`
            <script>
                alert('로그인이 필요한 서비스입니다.');
                location.href = '/login';
            </script>
        `);
    }
    next();
};


// 메인
app.get('/', async (req, res) => {
    try {
        const message = req.query.message || req.session.message;
        req.session.message = null;  // 메시지 사용 후 삭제

        res.render('index', { message });
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

app.get('/index', async (req, res) => {
    try {
        const message = req.query.message || req.session.message;
        req.session.message = null;  // 메시지 사용 후 삭제

        res.render('index', { message });
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

// 사업안내 - PORTFOLIO
app.get('/portfolio', async (req, res) => {
    try {
        // const row = await asyncQuery(`SELECT * FROM `, []);
        // res.render('데이터등록', { row: row });

        res.render('portfolio');
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

// 회사소개 - 연혁
app.get('/companyHistory', async (req, res) => {
    try {
        res.render('companyHistory');
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

// 고객지원 - 고객센터
app.get('/customerCenter', async (req, res) => {
    try {
        res.render('customerCenter');
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});


// 고객지원 - 문의하기
app.get('/inquiry', async (req, res) => {
    try {
        res.render('inquiry');
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

