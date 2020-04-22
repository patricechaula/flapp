const electron = require('electron');
const url = require('url');
const path = require('path');
const { Document, Packer,Paragraph, AlignmentType, TextRun, Media } = require('docx');
const { app, BrowserWindow, Menu, MenuItem } = electron;
const utils = require("./static/util");
const exec = require('child_process').exec;
const dialog = electron.dialog;
const util = require("util");
const fs = require('fs');
const os = require('os');
const ipc = electron.ipcMain;
const shell = electron.shell;
var menu;
const template1 = [
    {
        label:'File',
        submenu:[
            {
                role:'close'
            }
        ]
    },
]
const menu1 = Menu.buildFromTemplate(template1)
let mainWindow;
let pdfPrepWindow;
let configurationWindow;
let aboutWindow;
let manualWindow;
let accountsWindow, passwordsWindow;
//the farmer data
let pack = null;
let mysqlServerRunning = true;

//Print file to pdf
ipc.on('print-to-pdf', function (event, filePath) {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.webContents.printToPDF({}).then(data => {
        fs.writeFile(filePath, data, function (error) {
            if (error) event.sender.send("error", error.toString());
            shell.openExternal('file://' + filePath);
            event.sender.send("successful");
        })
        console.log(error);
    }).catch(error => {
    })
})




function buildDocument(data) {
    let result = {
        properties: {
            size: 12
        },
        children: []
    };

    let emptySpace = new Paragraph(" ");
    result.children.push(emptySpace);
    let date = new Paragraph(
        {
            text: new Date().toDateString(),
            style: "ordinary",
        }
    );
    result.children.push(date);
    result.children.push(emptySpace);
    let attention = new Paragraph({
        style: "ordinary",
        children: [
            new TextRun({
                text: 'Attention: ',
                bold: true
            }),
            new TextRun({
                text: ` ${data.pack.results.name}`
            })
        ]
    })
    result.children.push(attention);
    result.children.push(emptySpace);
    let referenceText = new Paragraph({
        style: "ordinary",
        children: [
            new TextRun({
                text: 'Ref: ',
                bold: true
            }),
            new TextRun({
                text: "Soil analysis results",
                bold: true,
                underline: true
            })
        ]
    })
    result.children.push(referenceText);
    result.children.push(emptySpace);

    result.children.push(utils.createResultsTable(data.pack.results));
    result.children.push(emptySpace);
    //////////////////////////////////////////////////////////////////////////////////////
    //Now create the recommendation text

    //texture description
    let textureDescription = utils.getTextureDescription(utils.textures_map,
        data.pack.results.texture);
    //color description
    let colorDescription = utils.getColorDescription(utils.colors_map,
        data.pack.results.color);
    //soil weight
    let soilWeightDescription = utils.getSoilWeight(data.pack.results.texture);
    //pH description
    let pHDescription = utils.getpHDescription(data.pack.results.pH);
    let description = `The soil is ${soilWeightDescription} soil (${textureDescription}), ${pHDescription}.${data.pack.recommendation.text4}`;
    let resultsDescription = new Paragraph({
        text: description,
        style: "ordinary"
    });
    result.children.push(resultsDescription);
    result.children.push(emptySpace);
    let cropText = new Paragraph({
        style: "ordinary",
        children: [
            new TextRun({
                text: `${data.pack.recommendation.crop} recommendations`,
                bold: true
            })
        ]
    });
    result.children.push(cropText);
    result.children.push(emptySpace);
    //now get to the recommendations table
    result.children.push(utils.createRecommendationTable(data.pack.recommendation));
    result.children.push(emptySpace);
    if (data.pack.results.nutritionist) {
        let nutritionistName = new Paragraph(`${data.pack.results.nutritionist}`);
        result.children.push(nutritionistName);
    }

    return result;
}
//Save as microsoft word document
ipc.on('save-to-docx', function (event, data) {
    console.log(data);
    const doc = new Document({
        creator: "Fertilizer recommendation app",
        title: "Report",
        styles: {
            paragraphStyles: [
                {
                    id: "ordinary",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 24,

                    },
                    paragraph: {
                        spacing: {
                            line: 276
                        }
                    }
                }
            ]
        }
    });
    const logo = Media.addImage(doc, fs.readFileSync(__dirname + "/static/logo.png"));
    console.log(logo);




    section = buildDocument(data);
    section.children.unshift(utils.buildHeader(logo));
    section.children.unshift(new Paragraph({
        style: "ordinary",
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({
                text: "MINISTRY OF AGRICULTURE, MECHANIZATION AND IRRIGATION DEVELOPMENT DEPARTMENT OF RESEARCH & SPECIALIST SERVICES (DR&SS)",
                bold: true,
            })
        ]
    }))
    section.children.unshift(new Paragraph({
        style: "ordinary",
        text: "  "
    }))
    doc.addSection(section);

    //Used to export the file into a .docx file
    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFile(data.filePath, buffer, function (error) {
            if (error) event.sender.send("error", error);
            console.log("I/////////////////////////////////////////");
            shell.openExternal('file://' + data.filePath);
            event.sender.send("successful");
        });
    })
})
//Save as raw text file
ipc.on('save-to-text', function (event, data) {
    let text = utils.createFormattedText(data);
    console.log(text);
    fs.writeFile(data.filePath, text, "utf-8", (err) => {
        if (err) event.sender.send("error", err);
        console.log("Were here did it");
        shell.openExternal('file://' + data.filePath);
        event.sender.send("successful");
    });
})
//On receive farmer data, open a new window that prepares farmer data for printing
ipc.on('open-pdf-prep', function (event, data) {
    //create new window for pdf
    pdfPrepWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
        }
    });
    //Load html into window
    pdfPrepWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'pdf.html'),
        protocol: 'file:',
        slashes: true
    }))
    pdfPrepWindow.setMenu(menu1);
    pack = data;
})
//Receive message requesting farmer data from the preparation window.
ipc.on('get-package', function (event) {
    event.sender.send('o-package', pack);
})
//Load configuration data from a json file. For connecting to the database server.
ipc.on('load-config', function (event) {
    fs.readFile(path.join(__dirname, 'static/config.json'), 'utf8', (err, source) => {
        if (err) {
            console.error(err)
        } else {
            let config = JSON.parse(source);
                ///open a new config window. 
                configurationWindow = new BrowserWindow({
                    webPreferences: {
                        nodeIntegration: true,
                    },
                    width:400,
                    height:600,
                    resizable:false

                });
                //Load html into window
                configurationWindow.loadURL(url.format({
                    pathname: path.join(__dirname, 'config.html'),
                    protocol: 'file:',
                    slashes: true
                }));
                configurationWindow.on('closed', (event) => {
                    configurationWindow = null;
                })
                configurationWindow.setMenu(menu1);
            
        }

    });
})
//Used by the configuration window when initiating a connection to database. 
//To load preconfigured data.
ipc.on('get-defaults', (event)=>{
    fs.readFile(path.join(__dirname, 'static/config.json'), 'utf8', (err, source) =>{
        if(err){
            console.error(err);
        } else{
            let data = JSON.parse(source)
            console.log(source);
            event.sender.send('receive-defaults', data);
        }
    })
})
//Sent by the configuration data to save configuration data.
//Sends a message to mainWindow with data for connection to happen.
ipc.on('save-config', (event, data) => {
    //save the configuration information and send it to the main window
    let configData = {
        config: {
            host: data.config.host,
            user: data.config.user,
            password: "",
            port: data.config.port
        },
        configured: true
    }
    const json = JSON.stringify(configData);
    fs.writeFile(path.join(__dirname, 'static/config.json'), json, (err) => {
        if (err) {
            console.error(err);
            throw err;
        } else {
            console.log("File successfully written");
            mainWindow.webContents.send('config-data-received', data);
            //event.sender.send('done');
        }
    })
});
ipc.on('connect-error', (event, errno) =>{
    configurationWindow.webContents.send('connect-error', errno);
    
})
ipc.on('connected', (event) =>{
    configurationWindow.webContents.send('connected');
})

//Just let the main window handle every query to the database
ipc.on('change-password', function(event, newPassword){
        mainWindow.webContents.send('change-password', newPassword);
});
//receive feedback on the changing of password
ipc.on('change-password-feedback', (event, data) =>{
    passwordsWindow.webContents.send('change-password-feedback', data);
})
/*
ipc.on('get-connection', (event) =>{
    mainWindow.webContents.send('get-connnection');
})

ipc.on('connection', (event, connection) =>{
   accountsWindow.webContents.send('connection', connection);
});
*/
//The menu template for our windows.

const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                click() {
                    app.quit();
                }
            },
        ]
    },
    {
        label: 'User',
        submenu:[
            {
                label: 'Change Password',
                click(){
                    //open passwords window. 
                   passwordsWindow = new BrowserWindow({
                    webPreferences: {
                        nodeIntegration: true,
                    },
                    width:400,
                    height:500,
                    resizable:false

                });
                //Load html into window
                passwordsWindow.loadURL(url.format({
                    pathname: path.join(__dirname, 'passwords.html'),
                    protocol: 'file:',
                    slashes: true
                }));
                passwordsWindow.setMenu(menu1);
                passwordsWindow.on('closed', (event) => {
                    passwordsWindow = null;
                })
                }
            }, 
        ]
    },
    {
        label: 'View',
        submenu:[
           
            {
                label: 'Recommend lab data',
                accelerator: 'Ctrl+Shift+R',
                click(){
                   mainWindow.webContents.send('open-view', 'recommend');
                }
            },
            {
                label: 'View historical data',
                accelerator: 'Ctrl+Shift+V',
                click(){
                    mainWindow.webContents.send('open-view', 'history');
                }
            },
            {
                label: 'Add new crop',
                accelerator: 'Ctrl+Shift+A',
                click(){
                    mainWindow.webContents.send('open-view', 'addcrop');
                }
            },
            {
                label: 'View crops',
                accelerator: 'Ctrl+Shift+C',
                click(){
                    mainWindow.webContents.send('open-view', 'viewcrops');
                }
            },
        ]
    },
    {
        label: 'Help',
        submenu:[
            {
                label: 'About',
                click(){
                   //open about window. 
                   for(const menuItem of menu.items){
                       menuItem.enabled = false;
                   }
                   aboutWindow = new BrowserWindow({
                    webPreferences: {
                        nodeIntegration: true,
                    },
                    width:400,
                    height:300,
                    resizable:false

                });
                //Load html into window
                aboutWindow.loadURL(url.format({
                    pathname: path.join(__dirname, 'about.html'),
                    protocol: 'file:',
                    slashes: true
                }));
                aboutWindow.setMenu(menu1);
                aboutWindow.on('closed', (event) => {
                    aboutWindow = null;
                    for(const menuItem of menu.items){
                        menuItem.enabled = true;
                    }
                })
                }
            },
        ]
    }
]



menu = Menu.buildFromTemplate(template)
//Menu.setApplicationMenu(menu)
//Listen for app to be ready


app.on('ready', function () {
   
    //Create new main window
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
        },

    });
    //Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'main.html'),
        protocol: 'file:',
        slashes: true
    }));
    mainWindow.setMenu(menu);
    mainWindow.on("closed", function (event) {
        
        app.quit();
    });
});

ipc.on('get-menu', (event) =>{
    event.sender.send('menu-items', menu.items);
})




