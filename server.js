import express from 'express'
import cors from 'cors'
import 'dotenv/config' 
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userroute.js'
import productRouter from './routes/productroute.js'
import cartRouter from './routes/cartroute.js'
import orderRouter from './routes/orderroute.js'

//App Config

const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

//middlewares

app.use(express.json())
app.use(cors())

//api endpoints
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)

app.get('/',(req,res)=>{
    res.send("API working")

})

app.listen(port,()=>console.log('Server started on PORT :' + port))