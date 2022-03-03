var express = require('express');
const { render } = require('express/lib/response');
var router = express.Router();
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(path.join(__dirname, '..', '..', 'express', 'db', 'todo.db'));
const bcrypt = require('bcrypt');
const saltRounds = 10;


function isLoggedIn(req, res, next) {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}

router.get('/login', function (req, res) {
  res.render('login', { loginMessage: req.flash('loginMessage') })
})

router.post("/login", function (req, res) {
  const email = req.body.email
  const password = req.body.password

  db.get("select * from user where email = ?", [email], (err, user) => {
    if (err) {
      req.flash('loginMessage', 'Gagal Login')
      return res.redirect("/login")
    }
    if (!user) {
      req.flash('loginMessage', 'User Tidak DiTemukan')
      return res.redirect("/login")
    }
    bcrypt.compare(password, user.password, function (err, result) {
      if (result) {
        req.session.user = user
        res.redirect("/")
      } else {
        req.flash('loginMessage', 'Password salah')
        return res.redirect("/login")
      }
    });
  });

})


router.get('/register', function (req, res) {
  res.render('register')
})


router.post("/register", function (req, res) {
  const email = req.body.email
  const fullname = req.body.fullname
  const password = req.body.password


  bcrypt.hash(password, saltRounds, function (err, hash) {
    db.run("insert into user (email, password, fullname)values(?, ?, ?)", [email, hash, fullname], (err) => {
      if (err) return res.send("register failed")
      res.redirect("/login")
    });
  })
})


router.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    res.redirect('/login')
  })
})




router.get('/', isLoggedIn, function (req, res,) {


  const url = req.url == "/" ? "/?page=1" : req.url

  const params = []


  if (req.query.task) {
    params.push(`task like '%${req.query.task}%'`)
  }
  if (req.query.complete) {
    params.push(`complete = ${req.query.complete}`)
  }

  const page = req.query.page || 1
  const limit = 3
  const offset = (page - 1) * limit
  let sql = `select count(*) as total from todo`;
  if (params.length > 0) {
    sql += ` where ${params.join(' and ')}`
  }
  db.get(sql, (err, row) => {
    const pages = Math.ceil(row.total / limit)
    sql = "select * from todo"
    if (params.length > 0) {
      sql += ` where ${params.join(' and ')}`
    }
    sql += ` limit ? offset ? `
    db.all(sql, [limit, offset], (err, rows) => {
      if (err) return res.send(err)
      res.render('list', { data: rows, page, pages, query: req.query, url, user: req.session.user });
    })
  })
})

router.get('/add', isLoggedIn, function (req, res) {
  res.render('add')
})

router.post('/add', function (req, res) {
  let task = req.body.task
  //Quary Binding
  db.run('insert into todo(task) values (?)', [task], (err) => {
    if (err) return res.send(err)
    res.redirect('/')
  })
})

router.get('/delete/:id', isLoggedIn, function (req, res) {
  const id = req.params.id
  db.run('delete from todo where id = ?', [Number(id)], (err) => {
    if (err) return res.send(err)
    res.redirect('/')
  })
})

router.get('/edit/:id', isLoggedIn, function (req, res) {
  const id = req.params.id
  db.get('select * from todo where id = ?', [Number(id)], (err, item) => {
    if (err) return res.send(err)
    res.render('edit', { data: item })
  })
})

router.post('/edit/:id', isLoggedIn, function (req, res) {
  const id = Number(req.params.id)
  const task = req.body.task
  const complete = JSON.parse(req.body.complete)
  if (!req.files || Object.keys(req.files).length === 0) {
    db.run('update todo set task = ?, complete = ? where id = ?', [task, complete, id], (err, row) => {
      if (err) return res.send(err)
      res.redirect('/')
    })
  } else {
    const file = req.files.picture;
    const fileName = `${Date.now()}-${file.name}`
    uploadPath = path.join(__dirname, "..", "public", 'images', fileName)

    // Use the mv() method to place the file somewhere on your server
    file.mv(uploadPath, function (err) {
      if (err)
        return res.status(500).send(err);
      db.run('update todo set task = ?, complete = ?, picture = ? where id = ?', [task, complete, fileName, id], (err, row) => {
        res.redirect('/');
      })
    });
  }
})

router.get('/upload', function (req, res) {
  res.render('upload')
})

router.post('/upload', function (req, res) {
  let file;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  file = req.files.sampleFile;
  uploadPath = path.join(__dirname, "..", "public", 'images', "avatar.jpg")

  // Use the mv() method to place the file somewhere on your server
  file.mv(uploadPath, function (err) {
    if (err)
      return res.status(500).send(err);

    res.redirect('/upload');
  });
});

module.exports = router;
