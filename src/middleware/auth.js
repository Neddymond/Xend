const jwt = require("jsonwebtoken");
const Recipient = require("../models/recipient");

/** Express Auth middleware */
const Auth = async (req, res, next) => {
    try{
        const token = req.header("Authorization").replace("Bearer ", "");
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const recipient = await Recipient.findOne({ _id: decodedToken.id, "tokens.token": token });
        // console.log(recipient);
        
        if(!recipient) throw new Error("Recipient not found");
        
        req.token = token;
        req.recipient = recipient;
        req.recipient_code = recipient.recipient_code;
        next();
    }catch (e) {
        res.status(401).send({ error: "please authenticate."});
    }
}

module.exports = Auth;