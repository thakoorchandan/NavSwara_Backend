import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
    try {
        const { token } = req.headers;
        if (!token) {
            return res.status(401).json({ success: false, message: "Not Authorized. Login Again." });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.admin || decoded.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ success: false, message: "Not Authorized. Login Again." });
        }
        req.admin = { email: decoded.email }; // Attach admin info if needed
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, message: error.message });
    }
};
export default adminAuth;
