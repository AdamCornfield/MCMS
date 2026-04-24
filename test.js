const auth = require('./coreModules/auth')
const func = require('./coreModules/coreFunctions')
const db = require('./coreModules/dbConnection')
const valid = require('./coreModules/validation')

const { DateTime } = require('luxon')

// Provides a copy of the permissions table for testing purposes.
global.permData = [
    { bitPos: 0, permissionName: 'ADMINISTRATOR' },
    { bitPos: 1, permissionName: 'REVIEW_APPLICATIONS' },
    { bitPos: 2, permissionName: 'MANAGE_USERS' },
    { bitPos: 3, permissionName: 'MANAGE_EVENTS' },
    { bitPos: 4, permissionName: 'VIEW_AUDIT_LOGS' },
    { bitPos: 5, permissionName: 'EDIT_AUDIT_LOGS' },
    { bitPos: 6, permissionName: 'MANAGE_SETTINGS' },
    { bitPos: 7, permissionName: 'MANAGE_FILES' }
]

global.permDataMapped = Object.fromEntries(
    global.permData.map(permission => [permission.bitPos, permission])
)

const unitTests = [
    {
        moduleName: "validation.js",
        functionName: "sanitiseInput",
        testCases: [
            {
                label: 'Correct Input',
                actual: valid.sanitiseInput("<b>Test</b>"),
                expected: "bTestb"
            }
        ]
    },
    {
        moduleName: "validation.js",
        functionName: "isValidEmail",
        testCases: [
            {
                label: 'Correct Input',
                actual: valid.isValidEmail("test@test.com"),
                expected: true
            },
            {
                label: 'Incorrect Input',
                actual: valid.isValidEmail("testATtest.com"),
                expected: false
            },
            {
                label: 'Incorrect Input',
                actual: valid.isValidEmail("test@test"),
                expected: false
            }
        ]
    },
    {
        moduleName: "validation.js",
        functionName: "isValidUsername",
        testCases: [
            {
                label: 'Correct Input',
                actual: valid.isValidUsername("testUser2000"),
                expected: true
            },
            {
                label: 'Incorrect Input',
                actual: valid.isValidUsername("te"),
                expected: false
            },
            {
                label: 'Incorrect Input',
                actual: valid.isValidUsername("testuser$$?!!"),
                expected: false
            }
        ]
    },
    {
        moduleName: "validation.js",
        functionName: "isValidPassword",
        testCases: [
            {
                label: 'Correct Input',
                actual: valid.isValidPassword("TestPassword123"),
                expected: true
            },
            {
                label: 'Incorrect Input',
                actual: valid.isValidPassword("testPassword"),
                expected: false
            },
            {
                label: 'Incorrect Input',
                actual: valid.isValidPassword("testpassword1"),
                expected: false
            }
        ]
    },
    {
        moduleName: "validation.js",
        functionName: "isValidDateTime",
        testCases: [
            {
                label: 'Correct Input',
                actual: valid.isValidDateTime("2024-12-04T12:30:14"),
                expected: true
            },
            {
                label: 'Incorrect Input',
                actual: valid.isValidDateTime("November fith"),
                expected: false
            },
            {
                label: 'Incorrect Input',
                actual: valid.isValidDateTime("2024-16-04"),
                expected: false
            }
        ]
    },
    {
        moduleName: "validation.js",
        functionName: "isFutureDateTime",
        testCases: [
            {
                label: 'Correct Input',
                actual: valid.isFutureDateTime(DateTime.utc().plus({days: 5})), // Generates a luxon date time object 5 days in the future, so it should always be true
                expected: true
            },
            {
                label: 'Incorrect Input',
                actual: valid.isFutureDateTime(DateTime.utc().minus({days: 5})),
                expected: false
            }
        ]
    },
    {
        moduleName: "coreFunctions.js",
        functionName: "decimalToBinary",
        testCases: [
            {
                label: 'Correct Input',
                actual: JSON.stringify(func.decimalToBinary(10)),
                expected: JSON.stringify(['0', '1', '0', '1'])
            }
        ]
    },
    {
        moduleName: "coreFunctions.js",
        functionName: "encodePermissionBitmask",
        testCases: [
            {
                label: 'Correct Input',
                actual: func.encodePermissionBitmask(["MANAGE_USERS", "MANAGE_EVENTS"]),
                expected: 12
            },
            {
                label: 'Correct Input',
                actual: func.encodePermissionBitmask(["ADMINISTRATOR"]),
                expected: 1
            },
            {
                label: 'Correct Input',
                actual: func.encodePermissionBitmask([]),
                expected: 0
            }
        ]
    },
    {
        moduleName: "coreFunctions.js",
        functionName: "decodePermissionBitmask",
        testCases: [
            {
                label: 'Correct Input',
                actual: JSON.stringify(func.decodePermissionBitmask(12)),
                expected: JSON.stringify({
                    "ADMINISTRATOR":false,
                    "REVIEW_APPLICATIONS":false,
                    "MANAGE_USERS": true,
                    "MANAGE_EVENTS": true
                })
            },
            {
                label: 'Incorrect Input',
                actual: JSON.stringify(func.decodePermissionBitmask(1)),
                expected: JSON.stringify({
                    "ADMINISTRATOR": true
                })
            }
        ]
    },
    {
        moduleName: "coreFunctions.js",
        functionName: "hasPermissions",
        testCases: [
            {
                label: 'Correct Input',
                actual: func.hasPermissions(["MANAGE_USERS"], { MANAGE_USERS: true, ADMINISTRATOR: false }),
                expected: true
            },
            {
                label: 'Incorrect Input',
                actual: func.hasPermissions(["MANAGE_EVENTS"], { MANAGE_USERS: true, ADMINISTRATOR: false }),
                expected: false
            }
        ]
    },
    {
        moduleName: "coreFunctions.js",
        functionName: "hashPassword",
        testCases: [
            {
                label: 'Correct Input',
                actual: func.hashPassword("TestPassword").includes(":"),//Because the hashed password would be unique every time, we can't actually do a static test for this, by checking for the colon, we can at least be sure the format is correct.
                expected: true
            }
        ]
    },
    {
        moduleName: "coreFunctions.js",
        functionName: "verifyPassword",
        testCases: [
            {
                label: 'Correct Input',
                actual: func.verifyPassword("TestPassword", "c8c87bd2136991084562eb5a66b72adf:178c7dc3e8e82a8ce38249ea2f2e5bd1b1192465986b6d94e0c9f05fe050e0358e1cb73da0da51538ae3460b7bc17693396581618e1008693c03ddb9e2d26fb3"),
                expected: true
            },
            {
                label: 'Incorrect Input',
                actual: func.verifyPassword("TestPassword", "376082dee6957c2fe2e944f9c31c9091:c41580466018a16221f0a8da66e768f2c8aa8ac3e578a54f59db6265b9fabd5e83e11feaefae07f860d73c2cf4b2ffd8d23a291c531ef1e35e4b71af7ef8fdee"),
                expected: false
            }
        ]
    },
    {
        moduleName: "coreFunctions.js",
        functionName: "filterColumns",
        testCases: [
            {
                label: 'Correct Input',
                actual: JSON.stringify(func.filterColumns([{ username: "testUser", password: "password123", email: "test@test.com" }], ["password"])),
                expected: JSON.stringify([{ username: "testUser", email: "test@test.com" }])
            },
            {
                label: 'Incorrect Input',
                actual: JSON.stringify(func.filterColumns([{ username: "testUser", password: "password123", email: "test@test.com" }], ["password", "email"])),
                expected: JSON.stringify([{ username: "testUser" }])
            }
        ]
    }
]


let promiseArray = []

unitTests.forEach(test => {
    promiseArray.push(new Promise((resolve, reject) => {
        console.log(`\x1b[43m\x1b[30mTesting ${test.moduleName}.${test.functionName}()\x1b[0m`)
        test.testCases.forEach((testCase, index) => {
            console.log(`   ${test.moduleName}.${test.functionName}() test ${index + 1}`)
            console.log(`   Expected result: ${testCase.expected}`)
            console.log(`   Actual result: ${testCase.actual}`)
            console.log(`   Outcome: `, testCase.expected === testCase.actual ? `\x1b[32mPass\x1b[0m` : `\x1b[31mFail\x1b[0m`)
        })
        console.log(`\x1b[43m\x1b[30m${test.moduleName}.${test.functionName}() Completed Tests\x1b[0m`)
    }))
})

Promise.allSettled(promiseArray)
.then((values) => {
    console.log("All testing completed")
})
