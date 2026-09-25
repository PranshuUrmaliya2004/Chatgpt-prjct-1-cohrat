



const UserModel = require('../model/user.model');
const jwt = require('jsonwebtoken');

async function authMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, Please Login First"
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await UserModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        req.user = user;

        next();

    } catch (err) {
        console.log("JWT Error:", err.message);

        return res.status(401).json({
            message: "Invalid token, Please Login Again"
        });
    }
}

module.exports = authMiddleware;