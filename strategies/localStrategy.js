const passport = require('passport')
const LocalStrategy = require('passport-local')
const luxon = require('luxon')
const crypto = require('crypto')

const con = require('../coreModules/dbConnection')
const func = require('../coreModules/coreFunctions')

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser( async (user, done) => {
    if(user) done(null, user)
})

passport.use(new LocalStrategy((username, password, done) => {
    con.query('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) { done(err) }

        //Check if any entries have been returned, if so process password through verify function to determine if it is correct
        if (user.length > 0) {
            if(user && func.verifyPassword(password, user[0].password)) {
                done(null, user[0].userID)
            } else {
                done(null, false, { message: 'Incorrect username or password' })
            }
        } else {
            done(null, false, { message: 'Incorrect username or password' })
        }
    })
}))