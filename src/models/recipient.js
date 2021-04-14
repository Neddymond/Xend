/** Libraries */
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/** Recipient Schema */
const recipientSchema = new mongoose.Schema({
    type: { type: String },
    name: { type: String },
    acc_num: { type: String, required: true },
    recipient_code: { type: String, unique: true },
    bank_code: { type: String, required: true },
    bank_name: { type: String },
    currency: { type: String },
    tokens: [{
        token: { type: String, required: true }
    }]

}, {
    timestamps: true
});

/** Filter out sensitive data */
recipientSchema.methods.toJSON = function(){
    const recipent = this;
    const recipientObj = recipent.toObject();

    delete recipientObj.tokens;

    return recipientObj;
};

/** Generate and save recipent token */
recipientSchema.methods.GenerateAuthToken = async function(){
    const recipient = this;
    const token = await jwt.sign({id: recipient._id.toString()}, process.env.JWT_SECRET_KEY);
    recipient.tokens = recipient.tokens.concat({token});
    await recipient.save();
    return token;
};

const Recipient = mongoose.model("Recipient", recipientSchema);

module.exports = Recipient;