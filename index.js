import express from 'express'
import { DB } from './src/DB/mongo-connection.js'
import router from './src/modules/users/user-route.js'
const app = express()

DB()

app.use(express.json())
app.use("/",router)

app.get("/json",(req,res)=>{
    res.status(200).json({
        message:"hello"
    })
})
const PORT = process.env.PORT || 8080
app.listen(PORT,()=>{
    console.log(`application is running on port: ${PORT}`)
})


