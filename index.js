const express = require('express');

const app = express();

const boxes = [

    {boxID:1},
    {boxID:2},
    {boxID:3},

];

app.get('/', (req, res) => {
    res.send(boxes)
  })
  
app.listen(3000)

console.log("Hello World");
