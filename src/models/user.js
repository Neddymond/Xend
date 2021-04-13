/** Libraries */
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/** User Schema */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Email is invalid");
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error("Invalid password. Password cannot 'password'.")
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});


/** Filter out sensitive data */
userSchema.methods.toJSON = function(){
    const user = this;
    const userObj = user.toObject();

    delete userObj.password;
    delete userObj.tokens;

    return userObj;
};

/** Generate and save user token */
userSchema.methods.GenerateAuthToken = async function(){
    const user = this;
    const token = await jwt.sign({id: user._id.toString()}, process.env.JWT_SECRET_KEY);
    user.tokens = user.tokens.concat({token});
    await user.save();
    return token;
};

/** Find a user if the password provided matches with the stored one */
userSchema.statics.FindByCredentials = async (email, password) => {
    const user = await User.findOne({email}); 
    if(!user) throw new Error("unable to login");
    console.log(user);

    const isMatched = await bcrypt.compare(password, user.password);
    console.log(isMatched);
    if(!isMatched) throw new Error("unable to login");

    return user;
};

/** Secure user's password on creation/modification */
userSchema.pre("save", async function(next){
    const user = this;

    if(user.isModified("password")){
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

/** Create a User model */
const User = mongoose.model("User", userSchema);

/** Export User module */
module.exports = User;