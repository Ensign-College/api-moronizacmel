const express = require('express');

const app = express();

const boxes = [

    {boxID:1},
    {boxID:2},
    {boxID:3},
    {boxID:4},

];

app.get('/boxes', (req, res) => {
    res.send(boxes)
  })
  
app.listen(3000)

console.log("Hello World");
