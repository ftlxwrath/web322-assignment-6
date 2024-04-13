const mongoose = require('mongoose');
let Schema = mongoose.Schema;
const dotenv = require('dotenv').config();
const MONGODB = process.env.MONGODB;


let userSchema = new Schema({
    userName: String,
    password: String,
    email: String,
    loginHistory: [{
        dateTime: Date,
        userAgent: String
    }]
});

let User;

function initialize() { 
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(`mongodb+srv://mdabus135:Web322@senecaweb.9mo96au.mongodb.net/SenecaWeb?retryWrites=true&w=majority&appName=SenecaWeb`);

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
}

function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // Check if passwords match
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }

        // Assuming User is a mongoose model
        let newUser = new User(userData);
        newUser.save()
            .then(() => {
                resolve();
            })
            .catch(err => {
                // Check if the error is due to duplicate key (11000)
                if (err.code === 11000) {
                    reject("User Name already taken");
                } else {
                    reject(`There was an error creating the user: ${err}`);
                }
            });
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        // Find user by userName
        User.find({ userName: userData.userName })
            .then(users => {
                // Check if user was found
                if (users.length === 0) {
                    reject(`Unable to find user: ${userData.userName}`);
                    return;
                }

                // Check if password matches
                if (users[0].password !== userData.password) {
                    reject(`Incorrect Password for user: ${userData.userName}`);
                    return;
                }

                // Update login history
                if (users[0].loginHistory.length === 8) {
                    users[0].loginHistory.pop();
                }
                users[0].loginHistory.unshift({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });

                // Update login history in the database
                User.updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } })
                    .then(() => {
                        resolve(users[0]);
                    })
                    .catch(err => {
                        reject(`There was an error verifying the user: ${err}`);
                    });
            })
            .catch(() => {
                reject(`Unable to find user: ${userData.userName}`);
            });
    });
}

module.exports = {initialize, registerUser,checkUser};


