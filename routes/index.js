var express = require('express');
const { render } = require('express/lib/response');
var router = express.Router();
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(path.join(__dirname, '..', '..','express','db', 'todo.db'));


/* GET home page. */
router.get('/', function(req, res,) {
  db.all('select * from todo', (err, rows) => {
    if (err) return res.send(err)
    res.render('list', { data: rows });
  })
  })

  router.get('/add', function(req, res){
    res.render('add')
  })

  router.post('/add', function(req, res){
    let task = req.body.task
    //Quary Binding
    db.run('insert into todo(task) values (?)', [task], (err) => {
      if (err) return res.send(err)
      res.redirect('/')
    })
  })

  router.get('/edit/:id', function(req, res){
    const id = req.params.id
    db.run('delete from todo where id = ?', [Number(id)], (err) => {
      if (err) return res.send(err)
      res.redirect('/')
    })
  })

  router.get('/edit/:id', function(req, res) {
    const id = req.params.id
    db.get('select * from todo where id = ?', [Number(id), (err, row) => {
      if (err) return res.send(err)
      res.render('edit', { data: item })
    }])
  })

  router.post('/edit/:id', function(req, res) {
    const id = Number(req.params.id)
    const task = req.body.task
    const complete = JSON.parse(req.body.complete)
    db.run('update todo set task = ?, complete = ? where id = ?', [task, complete, id], (err, row) =>{
      if (err) return res.send(err)
      res.redirect('/')
    })
  })

module.exports = router;
