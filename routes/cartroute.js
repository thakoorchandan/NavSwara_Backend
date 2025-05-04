import express from 'express'
import { addToCart, getUserCart, updateCart } from '../controllers/cartcontroller.js'
import authUser from '../middleware/auth.js'

const cartroute = express.Router()

cartroute.post('/get', authUser, getUserCart)
cartroute.post('/add', authUser, addToCart)
cartroute.post('/update', authUser, updateCart)

export default cartroute

