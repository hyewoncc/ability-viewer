const { User } = require("../models/User");

let auth = (req, res, next) => {

    let token = req.cookies.ability_auth;
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
