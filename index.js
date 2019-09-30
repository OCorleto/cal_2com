// -*- mode: js; js-indent-level: 2; -*-
'use strict'
const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors')

var uuid=require('uuid');
var AWS = require('aws-sdk');
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'dbpractica1.copayjq3jxtu.us-east-2.rds.amazonaws.com',
  user     : 'admin',
  password : '12345678',
  database : 'practica1DB'
});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});


const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.json({limit: '100mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}))
app.use(cors())

app.get('/index', (req,res)=>{
  connection.connect(function(err) {
    if (err) {
      console.log("Error en la conexion a la base de datos del GET", err);
    }
    connection.query("SELECT * FROM imagen", function (err, result, fields) {
      if (err) {
        console.log("Error en el select", err);
      }
      res.send({ datos: result})
    });
  });

})

app.post('/index',(req,res)=>{
  var imagen = req.body.file;
  var fs = require("fs");
  var nombrearchivo = req.body.name +'-'+ uuid.v4()+ ".jpg";
  fs.writeFile(nombrearchivo,imagen,'base64',(error)=>{
    if(error) {console.log("su puta madre hay error",error);}
  });

  var uploadParams = {Bucket: 'practica1-so1', Key: '', Body: '', ACL: 'public-read',};
  var file = nombrearchivo;

  var fs = require('fs');
  var fileStream = fs.createReadStream(file);

  fileStream.on('error', function(err) {
    console.log('File Error', err);
  });

  uploadParams.Body = fileStream;
  var path = require('path');
  var dir = "fotografias principales/"+path.basename(file);
  uploadParams.Key = dir;

  var location='https://practica1-so1.s3.amazonaws.com/fotografias+principales/'+nombrearchivo;
  s3.upload (uploadParams, function (err, data) {
    if (err) {
      console.log("Error en el Bucket", err);
    } if (data) {
      console.log("Upload Success", data.Location);
    }
  });

  connection.connect(function(err) {
    if (err) {
      console.log("Error en la conexion a la base de datos", err);
    }
      var sql = `INSERT INTO imagen (nombre, ubicacion, dir) VALUES ('${req.body.name}','${location}', '${dir}')`;
    connection.query(sql, function (err, result) {
      if (err) {
        console.log("Error al insertar en la BD", err);
	conn.destroy();
      }
      
    });
  });
  console.log(req.body.name)
  res.send({'response': 'uploaded'})
})

app.listen(3000,() => {
  console.log(`API REST corriendo en http://localhost:${port}`);
})
