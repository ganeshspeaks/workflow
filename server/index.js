const express = require('express');
require('dotenv').config()
const axios = require('axios');
var bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.listen(PORT,()=>{
    console.log(`server listening on port ${PORT}`);
});



app.post('/access/token',(req,resp)=>{
    // console.log(113332);
    let code = req.body.code;

   
axios.post('https://auth.monday.com/oauth2/token',{
        code:code,
        client_id:process.env.CLIENT_ID,
        client_secret:process.env.CLIENT_SECRET
    }).then((response)=>{
        // console.log("response : ",response?.data?.access_token);
        resp.json(response?.data);
    },(error)=>{
        resp.status(401).json({error:"Authorization failed , Please try again"})
        console.log("error : ",error);
    });


    
})