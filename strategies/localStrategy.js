const passport = require('passport')
const LocalStrategy = require('passport-local')
const con = require('../coreModules/dbConnection')
const luxon = require('luxon')
const crypto = require('crypto')

// console.log(hashPassword("test"))

function hashPassword(password) {
    // Generate random salt for the user
    const salt = crypto.randomBytes(16).toString('hex')

    // Hash the password with the salt
    const hash = crypto.scryptSync(password, salt, 64).toString('hex')

    // Return the combined result for storage
    return (`${salt}:${hash}`)
}

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser( async (user, done) => {
    if(user) done(null, user)
})

function verifyPassword(password, storedPassword) {
    // Split the stored hashed password into salt and hash, trim any white space to remove chance of errors
    const parts = String(storedPassword).trim().split(':')
    const [salt, hash] = parts.map(p => p.trim())

    // Hash the password with the salt
    const hashedPassword = crypto.scryptSync(password, salt, 64)
    const originalPassword = Buffer.from(hash, 'hex')

    if (hashedPassword.length !== originalPassword.length) return false

    // Compare the hashed password with the stored hash and return true or false if they match or not
    return crypto.timingSafeEqual(hashedPassword, originalPassword)
}

passport.use(new LocalStrategy((username, password, done) => {
    con.query('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) { done(err) }
        if (!user.length) { done(null, false, { message: 'Incorrect username or password' }) }
        

        // Process password through verify function to determine if it is correct
        if(verifyPassword(password, user[0].password)) {
            done(null, user[0].userID)
        } else {
            done(null, false, { message: 'Incorrect username or password' })
        }
    })
}))