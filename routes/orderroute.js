import express from 'express'

// import {placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, verifyStripe} from '../controllers/ordercontroller.js'
import {placeOrder, placeOrderStripe, allOrders, userOrders, updateStatus, verifyStripe} from '../controllers/ordercontroller.js'
import adminAuth from '../middleware/adminauth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

//admin features
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus)

//payment features
orderRouter.post('/place',authUser, placeOrder)
orderRouter.post('/stripe',authUser, placeOrderStripe)
// orderRouter.post('/razorpay',authUser, placeOrderRazorpay)

//user feature
orderRouter.post('/userOrders', authUser, userOrders)

//verify payment
orderRouter.post('/verifyStripe', authUser, verifyStripe)
// orderRouter.post('/verifyRazorPay', authUser, verifyRazorPay)


export default orderRouter