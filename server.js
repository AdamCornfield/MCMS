const express = require('express')
const path = require('path')
const mysql = require('mysql')
const dotenv = require('dotenv').config()
const crypto = require('crypto')
const luxon = require('luxon')
const fs = require('fs')
const bodyParser = require('body-parser')

const passport = require('passport')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const MySQLStore = require('express-mysql-session')(session)

// Load permission data into a global variable to be accessed across the application for encoding and decoding permissions,
// It is mapped to an object to improve efficiency of lookups when encoding and decoding permissions by bit position
global.permData = JSON.parse(fs.readFileSync('./permissions.json'))

global.permDataMapped = Object.fromEntries(
    global.permData.map(perm => [perm.bitPos, perm]).reverse()
)


const auth = require('./coreModules/auth')
const func = require('./coreModules/coreFunctions')
const db = require('./coreModules/dbConnection')
const valid = require('./coreModules/validation')

// Load external modules
// This passes in the auth, func and db objects to the module so that it is able to perform database access and make use of preexisting core systems.
const eventsModule = require('mcms_demo_module')({auth, func, db, valid});


const app = express()
const port = process.env.PORT || 8080


// Set EJS as the templating engine,
app.set('view engine', 'ejs')
app.set('trust proxy', 1)

// Create database connection
const con = require('./coreModules/dbConnection')

const localStrategy = require('./strategies/localStrategy')

// Session Parser
var sessionStore = new MySQLStore({
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}, con)

const sessionParser = session({
    key: process.env.cookie_name,
    secret: process.env.PASSPORT_SECRET,
    cookie: {
        domain: process.env.CURRENT_DOMAIN,
        httpOnly: true,
        secure: process.env.secure_cookie == "true",
        maxAge: 29030400000
    },
    domain: process.env.CURRENT_DOMAIN,
    store: sessionStore,
    resave: process.env.NODE_ENV == "production",
    saveUninitialized: false,
    sameSite: "strict"
})

app.use(sessionParser)
app.use(passport.initialize())
app.use(passport.session())
app.use(cookieParser())

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.set('views', [
    path.join(__dirname, 'views'),
    eventsModule.viewsPath
])

// Defines static file folder locations
app.use('/public',express.static(path.join(__dirname, 'static', 'public')))
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));


// Routes
app.use('/events', eventsModule.router)
app.use('/login', require('./routes/login'))
app.use('/admin', auth.isAuthorised, auth.hasPermissions(["MANAGE_USERS", "REVIEW_APPLICATIONS", "VIEW_AUDIT_LOGS", "MANAGE_EVENTS"], "OR"), require('./routes/admin'))
app.use('/login', require('./routes/login'))



// 
app.get('/', (req, res) => {
    res.render('default', {
        isAuthenticated: req.isAuthenticated(),
        pagePath: 'core/home',
        pageTitle: 'MCMS - Modular Community Management System'
    })
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})
