const express = require('express')
const path = require('path')
const mysql = require('mysql')
const dotenv = require('dotenv').config()
const crypto = require('crypto')
const luxon = require('luxon')
const bodyParser = require('body-parser')

const passport = require('passport')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const MySQLStore = require('express-mysql-session')(session)

const auth = require('./coreModules/auth')
const func = require('./coreModules/coreFunctions')
const db = require('./coreModules/dbConnection')
const valid = require('./coreModules/validation')

// Load external modules "InstallStep1"
// This passes in the auth, func and db objects to the module so that it is able to perform database access and make use of preexisting core systems.
// Copy the demo module layout below, modifying it for your needs.

// const demoModule = require('mcms_demo_module')({auth, func, db, valid}) 
const mcms_events_module = require('mcms_events_module')({auth, func, db, valid})
const mcms_docs_module = require('mcms_docs_module')({auth, func, db, valid})


const app = express()
const port = process.env.PORT || 8080


// Set EJS as the templating engine,
app.set('view engine', 'ejs')
app.set('trust proxy', 1)

// Create database connection
const con = require('./coreModules/dbConnection')

function loadPermissionData(cb) {
    con.query('SELECT bitPos, permissionName, permissionDescription FROM perms ORDER BY bitPos ASC', (err, results) => {
        if (err) {
            cb(err)
        } else {
            global.permData = results
            global.permDataMapped = Object.fromEntries(
                global.permData.map(perm => [perm.bitPos, perm]).reverse()
            )
            cb(null)
        }
    })
}

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

    // Add the modules view path here to allow the renderer access to it "InstallStep2"

    // mcms_demo_module.viewsPath,
    mcms_events_module.viewsPath,
    mcms_docs_module.viewsPath,
])

// Defines static file folder locations
app.use('/public', express.static(path.join(__dirname, 'static', 'public')))
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')))

// Place the module static paths here, it should follow a similar format if the module is configured correctly "InstallStep3"

// app.use('/public/demo', express.static(mcms_demo_module.staticPath))
app.use('/public/events', express.static(mcms_events_module.staticPath))
app.use('/public/docs', express.static(mcms_docs_module.staticPath))


// Routes
app.use('/login', require('./routes/login'))
app.use('/admin', auth.isAuthorised, auth.hasPermissions(["MANAGE_USERS", "EDIT_PERMS", "REVIEW_APPLICATIONS", "VIEW_AUDIT_LOGS", "MANAGE_EVENTS"], "OR"), require('./routes/admin'))
app.use('/login', require('./routes/login'))

// Add the module router here, it's path should be unique to avoid any conflict issues
// "InstallStep4"

// app.use('/demo', mcms_demo_module.router)
app.use('/events', mcms_events_module.router)
app.use('/docs', mcms_docs_module.router)


// 
app.get('/', (req, res) => {
    func.getUserData(req.user, (success, userData) => {
        if (!success) {
            console.error('Error fetching user data:', userData)
        } else {
            res.render('default', {
                isAuthenticated: req.isAuthenticated(),
                pagePath: 'core/home',
                userData,
                pageTitle: 'MCMS - Modular Community Management System'
            })
        }
    })
})

loadPermissionData((err) => {
    if (err) {
        console.error('Failed to load permissions from database:', err)
        process.exit(1)
    }

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
    })
})
