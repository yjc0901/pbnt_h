var path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;


app.use('/resources', express.static(path.join(__dirname, '/resources')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const mysql2 = require('mysql2/promise');
/*
const _pool = mysql2.createPool({
    host: '182.229.224.143',
    port: '3306',
    user: 'root',
    password: '9999',
    database: 'jmt',
    timezone: '+09:00'
    dateStrings: 'date',
    connectionLimit: 10,
});
*/
const _pool = mysql2.createPool({
    host: '115.138.223.131',
    user: 'root',
    password: '153426',
    database: 'mes_v1',
    port: '3306',
    dateStrings: 'date',
    connectionLimit: 10,
    timezone: '+09:00'
});




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



// app.listen(PORT, "0.0.0.0", () => {
//     console.log(`server started on PORT ${PORT} // ${new Date()}`);
//   });
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



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


app.get('/sub1', async (req, res) => {
    try {
        // const row = await asyncQuery(`SELECT * FROM `, []);
        // res.render('데이터등록', { row: row });

        res.render('sub1');
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

