import ordermodel from "../models/ordermodel.js";
import usermodel from "../models/usermodel.js";
import Stripe from 'stripe'
// import razorpay from 'razorpay'

//global variables 
const currency = 'inr'
const deliveryCharge = 10

//gateway initialize

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// const razorpayInstance = new razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret : process.env.RAZORPAY_KEY_SECRET,
// })

//placing ordrs using cod

const placeOrder = async (req,res) => {

    try {
        const {userId, items, amount, address} = req.body;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"COD",
            payment:false,
            date: Date.now()
        }

        const newOrder = new ordermodel(orderData)
        await newOrder.save()

        await usermodel.findByIdAndUpdate(userId,{cartData:{}})

        res.json({success:true, message:"Order Placed"})


    } catch (error) {

        console.log(error)
        res.json({success:false, message:error.message})
        
    }

}

//placing orders using stripe

const placeOrderStripe = async (req,res) => {
   try {
    
     const {userId, items, amount, address} = req.body
     const {origin} = req.headers;

     const orderData = {
        userId,
        items,
        address,
        amount,
        paymentMethod:"Stripe",
        payment:false,
        date: Date.now()
    }

    const newOrder = new ordermodel(orderData)
    await newOrder.save()

    const line_items = items.map((item)=>({
        price_data:{
            currency:currency,
            product_data: {
                name:item.name
            },
            unit_amount: item.price * 100
        },
        quantity: item.quantity
    }))
    line_items.push({
        price_data:{
            currency:currency,
            product_data: {
                name:'Delivery Charges '
            },
            unit_amount: item.price * 100
        },
        quantity:1

    })

    const session = await stripe.checkout.sessions.create({
        success_url: `${origin}/verify?success=true&orderId=${newOrder._Id}`,
        cancel_url:`${origin}/verify?success=false&orderId=${newOrder._Id}`,
        line_items,
        mode: 'payment' ,
        
    })

    res.json({success:true, session_url:session.url})


   } catch (error) {
    
    console.log(error)
    res.json({success:false, message:error.message})
    

   }
}

//verify stripe 
const verifyStripe = async(req,res)=>{

    const {orderId,success,userId} = req.body
      

    try {
        if (success === "true") {

            await ordermodel.findByIdAndUpdate(orderId,{payment:true});
            await usermodel.findByIdAndUpdate(userId, {cartData:{}})
            res.json({success: true});
            
        }else{
            await ordermodel.findbyIdAndDelete(orderId)
            res.json({success:false})
        }
    } catch (error) {

        console.log(error)
    res.json({success:false, message:error.message})
        
    }

}

//placing order using razorpay Method

// const placeOrderRazorpay = async (req,res) => {
//    try {

//     const {userId, items, amount, address} = req.body
   

//     const orderData = {
//        userId,
//        items,
//        address,
//        amount,
//        paymentMethod:"Razorpay",
//        payment:false,
//        date: Date.now()
//    }

//    const newOrder = new ordermodel(orderData)
//    await newOrder.save()

//    const options = {
//     amount: amount*100,
//     currency: currency.toUpperCase(),
//     receipt : newOrder._id.toString()
//    }

//    await razorpayInstance.orders.create(options,(error,order)=>{

//     if (error) {
//         console.log(error)
//         return res.json({success:false,message:error})
//     }

//     res.json({success:true,order})

//    })
    
//    } catch (error) {
      
//     console.log(error)
//         return res.json({success:false,message:error})

    
//    }
// }

// const verifyRazorpay = async (req,res) =>{
//    try {
//     const {userId, razorpay_order_id} = req.body

//     const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
//     if (orderInfo.status ==='paid') {
//         await ordermodel.findByIdAndUpdate(orderInfo.receipt, {payment:true});
//         await usermodel.findByIdAndUpdate(userId,{cartData:{}})
//         res.json({success: true, message:"Payment Successful" })
//     }else{
//    res.json({success:false, message:'Payment failed'})
//     }
//    } catch (error) {
//     console.log(error)
//         return res.json({success:false,message:error})
//    }
// }


// all the orders data for admin panel

const allOrders = async(req,res) => {

    try {

        const orders = await ordermodel.find({})
        res.json({success:true,orders}) 
        
    } catch (error) {

        console.log(error)
        res.json({success:false,message:error.message})
        
    }

}

//user order data for frontend
const userOrders = async(req,res) => {

    try {
       const {userId} = req.body
       const orders = await ordermodel.find({userId})

       res.json({success:true,orders})
        
    } catch (error) {

        console.log(error)
        res.json({success:false, message:error.message})
        
    }

}

//update order status from admin panel

const updateStatus = async(req,res) => {
  try {
    const {orderId, status} = req.body

    await ordermodel.findByIdAndUpdate(orderId, {status})
    res.json({success:true,message:"Status Updated"})
  } catch (error) {
    console.log(error)
        res.json({success:false, message:error.message})
  }
}

export {verifyStripe,placeOrder, placeOrderStripe, allOrders, userOrders, updateStatus}
// export {verifyRazorpay,verifyStripe,placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus}