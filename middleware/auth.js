const { User } = require("../models/User");

let auth = (req, res, next) => {
    let headerAuto = req.headers.authorization;
    if (!headerAuto) {
        return res.status(401).json({
            auth: "fail",
            message: "Token not found"
        })
    }
    let token = headerAuto.split(" ")[1];
    User.findByToken(token, (err, user) => {
        if(err) {
            throw err;
        }
        if(!user) {
            return res.status(404).json({
                auth: "fail",
                message: "Invalid token"
            })
        }

        req.token = token;
        req.user = user;
        next();
    })

}

module.exports = { auth };
