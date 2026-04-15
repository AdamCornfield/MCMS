# Modular Community Management System - MCMS
MCMS is a system designed to be fully modular and extensible, at it's core is the module system which allows different developers to create various tools and sections that can be picked to integrate into one solution, thus creating an easily customisable website for any type of community.

## How to integrate a module?
In this guide there are install steps in quotes, if you search for this in the code it will take you straight to them.

1. Download a module from npm, i.e.  `npm install mcms_demo_module`
2. In your server.js look for the section titled "InstallStep1"
   - Copy the example there, and rename for the module, i.e. `const demoModule = require('mcms_demo_module')({auth, func, db, valid}) `
2. Next find the views importing section titled "InstallStep2"
   - Copy the example there renaming to your module's name: `mcms_docs_module.viewsPath,`
3. Next find the static events injection, titled "InstallStep3"
   - Modify the example code alrady there to align with your chosen module: `app.use('/public/demo', express.static(mcms_demo_module.staticPath))`
4. Next go to the router injection titled "InstallStep4"
   - As before copy what's there and modify to be the name of your module `app.use('/demo', mcms_demo_module.router)`
5. Your module is now fully integrated! Ensure that it's name is unique and not overlapping any other modules.

## How to develop my own module?
1. Using the template [mcms_demo_module](https://github.com/AdamCornfield/mcms_demo_module), create your own repository, name it whatever you want, however it is suggested to follow the same formatting as is already used, by convention we use exclusively lower case.
2. Clone your new repository onto your local machine and open with your chosen editor.
3. In the directory run `npm i` to pull all dependencies.
4. At the top where moduleName is, change that name to match your repository name, for example `mcms_events_module` would be entered as `const moduleName = 'events'`
5. In the `/views` folder, rename the `module-demo` folder to whatever your module name is that you used above, so in the example of the events module, it will read `module-events`, such that the full file path is `/mcms_events_module/views/module-events`
6. In your package.json, ensure all fields where it says `mcms_demo_module` are modified to align with your repository name.
7. To link it into your MCMS core for testing, in the terminal directory for your new module run the command `npm link`
   - Then in your MCMS core terminal, run `npm link mcms_demo_module` (replace with your module name)
   - This will allow you to make changes to your module without having to completley install it from npm for every little change.
   - If you are using nodemon, to speed up development you can also add the following line to your nodemon.json file: `"../MCMS_demo_module",`
   - Then restart nodemon completley, now whenever you make changes in your module, it will restart the main server.
9. Once your module is completed, in the terminal for that module, run `npm publish --access public`, if you would like the module to be private, you can set it as such here.
10. Your module is now downloadable from npm, you may need to follow the npm instructions to set up your account.


If you do create any further routes, it important to ensure that the pagePath when rending ejs pages is maintained across all routes.