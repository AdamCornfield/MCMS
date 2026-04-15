# Modular Community Management System - MCMS
MCMS is a system designed to be fully modular and extensible, at it's core is the module system which allows different developers to create various tools and sections that can be picked to integrate into one solution, thus creating an easily customisable website for any type of community.

## How to integrate a module?
In this guide there are install steps in quotes, if you search for this in the code it will take you straight to them.

1. Download a module from npm, i.e.  `npm install mcms_demo_module`
2. In your server.js look for the section titled "InstallStep1"
   - Copy the example there, and rename for the module, i.e. `const demoModule = require('mcms_demo_module')({auth, func, db, valid}) `
3. Next find the static events injection, titled "InstallStep2"
   - Modify the example code alrady there to align with your chosen module: `app.use('/public/demo', express.static(mcms_demo_module.staticPath))`
4. Next go to the router injection titled "InstallStep3"
   - As before copy what's there and modify to be the name of your module `app.use('/demo', mcms_demo_module.router)`
5. Your module is now fully integrated! Ensure that it's name is unique and not overlapping any other modules.

## How to develop my own module?
1. Using the template [mcms_demo_module](https://github.com/AdamCornfield/mcms_demo_module), create your own repository, name it whatever you want, however it is suggested to follow the same formatting as is already used, by convention we use exclusively lower case.
2. Clone your new repository onto your local machine and open with your chosen editor.
3. At the top where moduleName is, change that name to match your repository name, for example `mcms_events_module` would be entered as `const moduleName = 'events'`
4. Your module is now ready for development, ensure that naming is consistant across everything to reduce the chance of any errors.
