import jwt from 'jsonwebtoken'
import cartroute from '../routes/cartroute.js';

const authUser = async (req, res, next) => {

    const { token } = req.headers;

    if (!token) {
        return res.json({ success: false, message: "Not authorized login again" })

    }

    try {
        console.log(token, process.env.JWT_SECRET);
        const token_deocde = jwt.verify(token, process.env.JWT_SECRET)

        req.body.userId = token_deocde.id
        next()

    } catch (error) {

        console.log(error)
        res.json({ success: false, message: error.message })

    }

}

export default authUser;