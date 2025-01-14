// === 필요한 패키지 임포트 ===
const express = require('express');
var path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;
require('dotenv').config(); // 환경 변수 로드
const bcrypt = require('bcryptjs');
const mysql2 = require('mysql2/promise');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const nodemailer = require('nodemailer');

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
app.set('trust proxy', 1); // 프록시를 신뢰하도록 설정

app.use(session({
    key: 'pbnt_session',
    secret: process.env.SESSION_SECRET, // .env 파일에 저장된 키
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
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


// 메일 전송 설정
const transporter = nodemailer.createTransport({
    host: 'smtp.naver.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER, // 발신자 이메일
        pass: process.env.EMAIL_PASS  // 발신자 이메일 비밀번호
    },
    logger: true, // 로그 활성화
    debug: true   // 디버그 활성화
});


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


// ===== 공지사항 관련 라우터 =====
// 공지사항 목록 조회
app.get('/notice', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 10;
        const offset = (page - 1) * itemsPerPage;

        // 검색 파라미터
        const searchType = req.query.searchType;
        const keyword = req.query.keyword;
        
        // 검색 조건 설정
        let whereClause = 'WHERE is_deleted = false';
        let params = [];
        
        if (keyword) {
            if (searchType === 'title') {
                whereClause += ' AND title LIKE ?';
                params.push(`%${keyword}%`);
            } else if (searchType === 'content') {
                whereClause += ' AND content LIKE ?';
                params.push(`%${keyword}%`);
            } else if (searchType === 'author') {
                whereClause += ' AND author LIKE ?';
                params.push(`%${keyword}%`);
            }
        }

        // 전체 게시글 수 먼저 조회
        const totalCount = await asyncQuery(
            `SELECT COUNT(*) as count FROM notice ${whereClause}`, 
            params
        );

        // 게시글 목록 조회
        const notices = await asyncQuery(`
            SELECT 
                id,
                @rownum:=@rownum-1 AS num,
                title,
                author,
                DATE_FORMAT(created_at, '%Y-%m-%d') as created_at,
                views 
            FROM (
                SELECT * FROM notice 
                ${whereClause}
                ORDER BY id DESC 
                LIMIT ? OFFSET ?
            ) sub,
            (SELECT @rownum:=${totalCount[0].count} + 1) AS r
        `, [...params, itemsPerPage, offset]);

        // 페이지네이션 정보 계산
        const totalItems = totalCount[0].count;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const pageGroup = Math.ceil(page / 5);
        const lastPage = pageGroup * 5;
        const firstPage = lastPage - 4;

        const pageNumbers = [];
        for (let i = firstPage; i <= Math.min(lastPage, totalPages); i++) {
            pageNumbers.push(i);
        }

        res.render('notice', {
            notices,
            currentPage: page,
            totalPages,
            pageNumbers,
            firstPage,
            lastPage,
            hasNextGroup: lastPage < totalPages,
            hasPrevGroup: firstPage > 1,
            searchType: searchType || 'title',
            keyword: keyword || ''      
        });

    } catch (err) {
        console.error('공지사항 목록 조회 오류:', err);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

// 공지사항 상세 조회
app.get('/notice/:id', async (req, res) => {
    try {
        const noticeId = req.params.id;

        // 게시글 조회 및 조회수 증가를 트랜잭션으로 처리
        const conn = await _getConn();
        try {
            await conn.beginTransaction();

            // 조회수 증가
            await conn.query(
                'UPDATE notice SET views = views + 1 WHERE id = ? AND is_deleted = false',
                [noticeId]
            );

            // 게시글 조회
            const [notice] = await conn.query(`
                SELECT 
                    id,
                    title,
                    content,
                    author,
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at,
                    views
                FROM notice 
                WHERE id = ? AND is_deleted = false
            `, [noticeId]);

            await conn.commit();

            if (notice.length === 0) {
                return res.status(404).render('error', { 
                    message: '존재하지 않는 게시글입니다.' 
                });
            }

            // 이전글, 다음글 조회
            const [neighbors] = await conn.query(`
                (SELECT id, title FROM notice WHERE id < ? AND is_deleted = false ORDER BY id DESC LIMIT 1)
                UNION ALL
                (SELECT id, title FROM notice WHERE id > ? AND is_deleted = false ORDER BY id ASC LIMIT 1)
            `, [noticeId, noticeId]);

            res.render('notice_detail', { 
                notice: notice[0],
                prev: neighbors[0] || null,
                next: neighbors[1] || null
            });

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

    } catch (err) {
        console.error('공지사항 상세 조회 오류:', err);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

// 공지사항 글쓰기 페이지 렌더링
app.get('/notice_write', checkLogin, async (req, res) => {
    try {
        res.render('notice_write');
    } catch (err) {
        console.error('공지사항 작성 페이지 오류:', err);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

// 공지사항 등록 처리
app.post('/notice', checkLogin, async (req, res) => {
    try {
        const { title, content, author } = req.body;
        
        const result = await asyncQuery(
            'INSERT INTO notice (title, content, author) VALUES (?, ?, ?)',
            [title, content, author]
        );

        // 등록 성공 시 성공 메시지와 함께 리다이렉트
        res.send(`
            <script>
                alert('게시글이 등록되었습니다.');
                location.href = '/notice';
            </script>
        `);

    } catch (err) {
        console.error('공지사항 등록 오류:', err);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

// 공지사항 수정 페이지 렌더링
app.get('/notice/edit/:id', checkLogin, async (req, res) => {
    try {
        const [notice] = await asyncQuery(
            'SELECT * FROM notice WHERE id = ? AND is_deleted = false',
            [req.params.id]
        );

        if (!notice) {
            return res.status(404).send('게시글을 찾을 수 없습니다.');
        }

        res.render('notice_edit', { notice });
    } catch (err) {
        console.error('공지사항 수정 페이지 오류:', err);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

// 공지사항 수정 처리
app.post('/notice/edit/:id', checkLogin, async (req, res) => {
    try {
        const { title, content } = req.body;
        
        await asyncQuery(
            'UPDATE notice SET title = ?, content = ? WHERE id = ?',
            [title, content, req.params.id]
        );

        // 수정 성공 시 성공 메시지와 함께 리다이렉트
        res.send(`
            <script>
                alert('게시글이 수정되었습니다.');
                location.href = '/notice/${req.params.id}';
            </script>
        `);
    } catch (err) {
        console.error('공지사항 수정 오류:', err);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

// 공지사항 삭제 처리
app.post('/notice/delete/:id', checkLogin, async (req, res) => {
    try {
        await asyncQuery(
            'UPDATE notice SET is_deleted = true WHERE id = ?',
            [req.params.id]
        );

        res.send(`
            <script>
                alert('게시글이 삭제되었습니다.');
                location.href = '/notice';
            </script>
        `);

    } catch (err) {
        console.error('공지사항 삭제 오류:', err);
        res.status(500).send('서버 오류가 발생했습니다.');
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


// 폼 제출 처리
app.post('/inquiry', (req, res) => {
    const { name, company, email, phone, inquiry_type, message } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject: `New Inquiry from ${name}`,
        text: `
        <문의 내용>
            - 성함: ${name}
            - 회사명: ${company}
            - E-mail: ${email}
            - 연락처: ${phone}
            - 관심 솔루션: ${inquiry_type}
            - 문의사항: ${message}
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Error sending email');
        }
        console.log('Email sent:', info.response);
        res.send(`
            <script>
                alert('메일이 성공적으로 전송되었습니다.');
                window.location.href = '/customerCenter';
            </script>
        `);
    });
});