const electron = require('electron');
const { dialog } = require('electron').remote;
const remote = electron.remote;
const parse = require('csv-parse');
const mysql = require('mysql');
const fs = require('fs');
const ipc = electron.ipcRenderer;
const statusReport = document.querySelector('.status-bar-2');
const errors = [];
var connectionStatus = false;
var mysqlConn = new Event('mysql', { 'bubbles': true, 'cancellable': false });
var mysqlConnFail = new Event('mysqlfail', { 'bubbles': true, 'cancellable': false });
var mysqlConnClosed = new Event('mysqlclose', { 'bubbles': true, 'cancellable': false });
var connection;
//for ensuring that all requirements are ready before  recommending.
var nitrogenChecked = phosphorusChecked = potasiumChecked = false;




//Update error panel as errors are accumulating.
updateNotifs = window.setInterval(function () {
    let count = errors.length;
    let notifsCount = document.querySelector('#notifs-count');
    //Update the number of errors.
    notifsCount.innerText = count;
    let errorMessages = document.querySelectorAll('.error-msg');
    for (const errorMsg of errorMessages) {
        errorMsg.remove();
    }
    let errorPanel = document.querySelector('#error-pane');
    for (let i = errors.length - 1; i >= 0; i--) {
        error = errors[i];
        let errorMessage = document.createElement('p');
        errorMessage.innerText = error;
        errorMessage.className = 'error-msg';
        errorMessage.style.color = 'black';
        errorMessage.style.borderBottom = '1px solid #ddd';
        errorPanel.appendChild(errorMessage);
    }
}, 1000)



function createDatabaseTables() {
    let sql_create_db = "CREATE SCHEMA IF NOT EXISTS `fertapp` DEFAULT CHARACTER SET utf8 ;"
    let sql_create_lab_results = "CREATE TABLE IF NOT EXISTS `fertapp`.`lab_results` ("
        + "`id` INT NOT NULL AUTO_INCREMENT,"
        + "`name` VARCHAR(90) NOT NULL,"
        + "`lab_number` VARCHAR(45) NOT NULL,"
        + "`ref` VARCHAR(255) NOT NULL,"
        + "`color` VARCHAR(3) NOT NULL,"
        + "`texture` VARCHAR(4) NOT NULL,"
        + "`pH` DECIMAL(3,2) NOT NULL,"
        + "`free_carbonate` VARCHAR(1) NOT NULL,"
        + "`conductivity` INT NOT NULL,"
        + "`nitrogen` INT NOT NULL,"
        + "`m_nitrogen_init` INT NOT NULL,"
        + "`m_nitrogen_after` INT NOT NULL,"
        + "`phosphorus` INT NOT NULL,"
        + "`potasium` DECIMAL(5,2) NOT NULL,"
        + "`calcium` DECIMAL(5,2) NOT NULL,"
        + "`magnesium` DECIMAL(5,2) NOT NULL,"
        + "`total_bases` DECIMAL(5,2) NOT NULL,"
        + "PRIMARY KEY (`id`))"
        + "ENGINE = InnoDB;";
    let sql_create_crop = "CREATE TABLE IF NOT EXISTS `fertapp`.`crop` ("
        + "`id` INT NOT NULL AUTO_INCREMENT,"
        + "`name` VARCHAR(50) NOT NULL,"
        + "`regular_top_dressing` TINYINT(1) NOT NULL,"
        + "`special_top_dressing` TINYINT(1) NOT NULL,"
        + "`lowest_pH` DECIMAL(2,1) NOT NULL,"
        + "`highest_pH` DECIMAL(2,1) NOT NULL,"
        + "PRIMARY KEY (`id`))"
        + "ENGINE = InnoDB;";

    let sql_create_recommendation = "CREATE TABLE IF NOT EXISTS `fertapp`.`recommendation` ("
        + "`id` INT NOT NULL AUTO_INCREMENT,"
        + "`lab_number` VARCHAR(45) NOT NULL,"
        + "`ref` VARCHAR(45) NOT NULL,"
        + "`nitrogen` VARCHAR(255) NOT NULL,"
        + "`phosphorus` VARCHAR(255) NOT NULL,"
        + "`potasium` VARCHAR(255) NOT NULL,"
        + "`lime` VARCHAR(255) NOT NULL,"
        + "`text1` VARCHAR(500),"
        + "`text2` VARCHAR(500),"
        + "`text3` VARCHAR(500),"
        + "`text4` VARCHAR(500),"
        + "`min_nitrogen` INT NOT NULL,"
        + "`max_nitrogen` INT NOT NULL,"
        + "`min_phosphorus` INT NOT NULL,"
        + "`max_phosphorus` INT NOT NULL,"
        + "`min_potasium` INT NOT NULL,"
        + "`max_potasium` INT NOT NULL,"
        + "`crop` VARCHAR(90) NOT NULL,"
        + "`nitrogen_fertilizer` VARCHAR(90) NOT NULL,"
        + "`phosphorus_fertilizer` VARCHAR(90) NOT NULL,"
        + "`potasium_fertilizer` VARCHAR(90) NOT NULL,"
        + "PRIMARY KEY (`id`))"
        + "ENGINE = InnoDB;";

    let sql_create_fertilizer = "CREATE TABLE IF NOT EXISTS `fertapp`.`fertilizer` ("
        + "`id` INT NOT NULL AUTO_INCREMENT,"
        + "`name` VARCHAR(45) NOT NULL,"
        + "`nitrogen` DECIMAL(5,2) NOT NULL,"
        + "`phosphorus` DECIMAL(5,2) NOT NULL,"
        + "`potasium` DECIMAL(5,2) NOT NULL,"
        + "PRIMARY KEY (`id`))"
        + "ENGINE = InnoDB;";

    let sql_create_crop_has_recommendation = "CREATE TABLE IF NOT EXISTS `fertapp`.`crop_has_recommendation` ("
        + "`crop_id` INT NOT NULL,"
        + "`recommendation_id` INT NOT NULL,"
        + "PRIMARY KEY (`crop_id`, `recommendation_id`),"
        + "INDEX `fk_crop_has_recommendation_recommendation1_idx` (`recommendation_id` ASC),"
        + "INDEX `fk_crop_has_recommendation_crop1_idx` (`crop_id` ASC),"
        + "CONSTRAINT `fk_crop_has_recommendation_crop1`"
        + " FOREIGN KEY (`crop_id`)"
        + " REFERENCES `fertapp`.`crop` (`id`)"
        + " ON DELETE NO ACTION"
        + " ON UPDATE NO ACTION,"
        + "CONSTRAINT `fk_crop_has_recommendation_recommendation1`"
        + " FOREIGN KEY (`recommendation_id`)"
        + " REFERENCES `fertapp`.`recommendation` (`id`)"
        + " ON DELETE NO ACTION"
        + " ON UPDATE NO ACTION)"
        + " ENGINE = InnoDB;";

    let sql_create_lab_results_has_recommendation = "CREATE TABLE IF NOT EXISTS `fertapp`.`lab_results_has_recommendation` ("
        + "`lab_results_id` INT NOT NULL,"
        + "`recommendation_id` INT NOT NULL,"
        + "PRIMARY KEY (`lab_results_id`, `recommendation_id`),"
        + "INDEX `fk_lab_results_has_recommendation_recommendation1_idx` (`recommendation_id` ASC),"
        + "INDEX `fk_lab_results_has_recommendation_lab_results1_idx` (`lab_results_id` ASC),"
        + "CONSTRAINT `fk_lab_results_has_recommendation_lab_results1`"
        + " FOREIGN KEY (`lab_results_id`)"
        + " REFERENCES `fertapp`.`lab_results` (`id`)"
        + " ON DELETE NO ACTION"
        + " ON UPDATE NO ACTION,"
        + "CONSTRAINT `fk_lab_results_has_recommendation_recommendation1`"
        + " FOREIGN KEY (`recommendation_id`)"
        + " REFERENCES `fertapp`.`recommendation` (`id`)"
        + " ON DELETE NO ACTION"
        + " ON UPDATE NO ACTION)"
        + " ENGINE = InnoDB;";

    let sql_create_crop_has_lab_results = "CREATE TABLE IF NOT EXISTS `fertapp`.`crop_has_lab_results` ("
        + "`crop_id` INT NOT NULL,"
        + "`lab_results_id` INT NOT NULL,"
        + "PRIMARY KEY (`crop_id`, `lab_results_id`),"
        + "INDEX `fk_crop_has_lab_results_lab_results1_idx` (`lab_results_id` ASC),"
        + "INDEX `fk_crop_has_lab_results_crop1_idx` (`crop_id` ASC),"
        + "CONSTRAINT `fk_crop_has_lab_results_crop1`"
        + " FOREIGN KEY (`crop_id`)"
        + " REFERENCES `fertapp`.`crop` (`id`)"
        + " ON DELETE NO ACTION"
        + " ON UPDATE NO ACTION,"
        + "CONSTRAINT `fk_crop_has_lab_results_lab_results1`"
        + " FOREIGN KEY (`lab_results_id`)"
        + " REFERENCES `fertapp`.`lab_results` (`id`)"
        + " ON DELETE NO ACTION"
        + " ON UPDATE NO ACTION)"
        + " ENGINE = InnoDB;";
    setTimeout(function () {
        let processing = document.querySelector('.processing');
        let processorText = document.querySelector('#processor-text');
        processorText.innerText = "Initializing...";
        processing.style.display = "block";
    }, 2000);

    connection.query(sql_create_db, function (err, results) {
        if (err) {
            dialog.showErrorBox("Error", "Could not create database.");
        } else {
            // alert("Database has been created");
            connection.query(sql_create_lab_results, function (err, results) {
                if (err) {
                    dialog.showErrorBox("Error", "Could not create lab results table." + err.toString());
                } else {
                    connection.query(sql_create_crop, function (err, results) {
                        if (err) {
                            dialog.showErrorBox("Error", "Could not create crop table.");
                        } else {
                            connection.query(sql_create_recommendation, function (err, results) {
                                if (err) {
                                    dialog.showErrorBox("Error", "Could not create recommendation table.");
                                } else {
                                    connection.query(sql_create_fertilizer, function (err, results) {
                                        if (err) {
                                            dialog.showErrorBox("Error", "Could not create fertilizer table.");
                                        } else {
                                            connection.query(sql_create_crop_has_recommendation, function (err, results) {
                                                if (err) {
                                                    dialog.showErrorBox("Error", "Could not create crop recommendation relatioship." + err.toString());
                                                } else {
                                                    connection.query(sql_create_lab_results_has_recommendation, function (err, results) {
                                                        if (err) {
                                                            dialog.showErrorBox("Error", "Lab results recommendation relationship.");
                                                        } else {
                                                            connection.query(sql_create_crop_has_lab_results, function (err, results) {
                                                                if (err) {
                                                                    dialog.showErrorBox("Error", "Could not lab results crop relationship table.");
                                                                } else {
                                                                    console.log("Done");
                                                                    //select the Database
                                                                    let sql_select_database = "USE `fertapp` ;";
                                                                    connection.query(sql_select_database, function (err, result) {
                                                                        if (err) {
                                                                            dialog.showErrorBox("Fertilzer application database is missing.");
                                                                        } else {
                                                                            console.log("Let's role");
                                                                            setTimeout(function () {
                                                                                let processing = document.querySelector('.processing');
                                                                                let processorText = document.querySelector('#processor-text');
                                                                                processorText.innerText = "";
                                                                                processing.style.display = "none";

                                                                            }, 3000);
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    })

}







function connectToDatabase(config) {
    if (!connectionStatus) {
        document.querySelector("#connection-status-text").innerText = "connecting...";
        let processing = document.querySelector('.processing');
        let processorText = document.querySelector('#processor-text');
        processorText.innerText = "Connecting to database";
        processing.style.display = "block";
        connection = mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            port: config.port
        });
        connection.on('error', function (err) {
            if (err.code == 'ECONNRESET') {
                statusReport.innerText = `Status: ${ERR_LOST_CONNECTION}`;
                let connectionButton = document.querySelector('#connection-btn');
                let connectionStatus = document.querySelector('#connection-status');
                let connectionStatusText = document.querySelector('#connection-status-text');
                connectionButton.innerText = 'Reconnect';
                connectionStatusText.innerText = 'disconnected';
                connectionStatus.style.background = '#ddd';
                errors.push(timeError(ERR_LOST_CONNECTION));
                connectionStatus = false;
            } else {
                statusReport.innerText = 'Status: ' + err.toString();
                errors.push(new Date().toString() + ": " + err.code + " : " + err.toString());
                
            }
        });
        connection.connect(function (err) {
            if (err) {
                let statusBar = document.querySelector('.status-bar');
                 
                        statusReport.innerText = `Status: ${ERR_CONNECTING}`;
                        errors.push(timeError(ERR_CONNECTING));
                        statusBar.dispatchEvent(mysqlConnFail);
                        //success;
                        let processing = document.querySelector('.processing');
                        let processorText = document.querySelector('#processor-text');
                        processorText.innerText = "";
                        processing.style.display = "none";
                        ipc.send('connect-error', err.errno);
                        
                        
                
            } else {
                connectionStatus = true;
                let statusBar = document.querySelector('.status-bar');
                statusReport.innerText = 'Status: ok';
                connection.query("USE fertapp", function (err, results) {
                    if (err) {
                        if (err.code == "ER_BAD_DB_ERROR") {
                            //database does not exist create one and use that
                            createDatabaseTables();
                        }
                    } else {
                        //success;
                        let processing = document.querySelector('.processing');
                        let processorText = document.querySelector('#processor-text');
                        processorText.innerText = "";
                        processing.style.display = "none";
                        ipc.send('connected');
                    }
                })
                statusBar.dispatchEvent(mysqlConn);

            }
        });

    } else {
        //terminate connection
       /* connection.end();
        connectionStatus = false;
        let statusBar = document.querySelector('.status-bar');
        statusBar.dispatchEvent(mysqlConnClosed);
        */
    }
}


let connectButton = document.querySelector('#connection-btn');
let mysqlServerRunning = true;
function loadFromJSON(){
    //read a file with the values
    if(!connectionStatus)
    ipc.send('load-config');
    else {
        //terminate connection
        connection.end();
        connectionStatus = false;
        let statusBar = document.querySelector('.status-bar');
        statusBar.dispatchEvent(mysqlConnClosed);
    }
    //alert("Sent message to fetch data");
    
}
connectButton.onclick = loadFromJSON;
ipc.on('config-data-received', (event, config) =>{
    //this just recieves configured data.
    connectToDatabase(config.config);
});



let statusBar = document.querySelector('.status-bar');
statusBar.addEventListener('mysql', function (e) {
    let connectionStatus = document.querySelector('#connection-status');
    let connectionStatusText = document.querySelector('#connection-status-text');
    let connectionButton = document.querySelector('#connection-btn');
    connectionButton.innerText = 'Disconnect';
    connectionStatusText.innerText = 'connected';
    connectionStatus.style.background = 'teal';
}, false);

statusBar.addEventListener('mysqlfail', function (e) {
    let connectionStatus = document.querySelector('#connection-status');
    let connectionStatusText = document.querySelector('#connection-status-text');
    let connectionButton = document.querySelector('#connection-btn');
    connectionButton.innerText = 'Retry';
    connectionStatusText.innerText = 'failed';
    connectionStatus.style.background = 'rgb(216, 75, 117)';
}, false);


statusBar.addEventListener('mysqlclose', function (e) {
    let connectionStatus = document.querySelector('#connection-status');
    let connectionStatusText = document.querySelector('#connection-status-text');
    let connectionButton = document.querySelector('#connection-btn');
    connectionButton.innerText = 'Reconnect';
    connectionStatusText.innerText = 'disconnected';
    connectionStatus.style.background = '#ddd';
}, false);


var updateCrops = new Event('updateSelect');
document.addEventListener('DOMContentLoaded', function () {

    var selectCrops = document.querySelector('#crops');
    selectCrops.addEventListener('updateSelect', function () {
        var elems = document.querySelectorAll('select');
        var instances = M.FormSelect.init(elems);
    })

    let notificationsButton = document.querySelector('#notify');
    notificationsButton.addEventListener('click', function (e) {
        let errorMessages = document.querySelectorAll('.error-msg');
        for (const errorMsg of errorMessages) {
            errorMsg.remove();
        }
        let errorPanel = document.querySelector('#error-pane');
        for (let i = errors.length - 1; i >= 0; i--) {
            error = errors[i];
            let errorMessage = document.createElement('p');
            errorMessage.innerText = error;
            errorMessage.className = 'error-msg';
            errorMessage.style.color = 'black';
            errorMessage.style.borderBottom = '1px solid #ddd';
            errorPanel.appendChild(errorMessage);
        }
        errorPanel.style.display = 'block';

    })

    let clearBtn = document.querySelector('#clear');
    let closeBtn = document.querySelector('#close');

    clearBtn.addEventListener('click', function (e) {
        let errorMessages = document.querySelectorAll('.error-msg');
        for (const errorMsg of errorMessages) {
            errorMsg.remove();
        }
        while (errors.length != 0) {
            errors.pop();
        }
    })

    closeBtn.addEventListener('click', function (e) {
        let errorPanel = document.querySelector('#error-pane');
        let errorMessages = document.querySelectorAll('.error-msg');
        for (const errorMsg of errorMessages) {
            errorMsg.remove();
        }
        errorPanel.style.display = 'none';
    })



    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems);
    window.views = new Stack();
    window.views.push(document.querySelector('#dashboard'));
    let home = document.querySelector("#dashboard");
    //The back button is responsible for navigating back and cleanup of content that has been added to tables.
    document.querySelector("#back").addEventListener('click', function () {
        target = window.views.pop();
        target.style.display = 'none';
        //Clean up.
        if (target == document.querySelector('.historical-data')) {
            let records = document.querySelectorAll('.table-container table .record');
            for (let i = 0; i < records.length; i++)
                records[i].remove();
            let reloadButton = document.querySelector('#reload');
            if (reloadButton)
                reloadButton.remove();
        } else if (target == document.querySelector('.crops-view')) {
            let records = document.querySelectorAll('.crops-view table .record');
            for (let i = 0; i < records.length; i++)
                records[i].remove();
            //this is if an error has occured during loading of data.

        }
        window.views.peek().style.display = 'block';
        if (window.views.peek() == home) {
            document.querySelector("#back").style.display = 'none';
        }
    })



}
)
class Data {
    constructor(data, crop) {
        this.name = data.name;
        this.id = data.id;
        this.lab_number = data.lab_number;
        this.ref = data.ref;
        this.color = data.color;
        this.texture = data.texture;
        this.pH = data.pH;
        this.freeCarbonate = data.free_carbonate;
        this.conductivity = data.conductivity;
        this.nitrogen = data.nitrogen;
        this.mineralNitrogenInit = 0;
        this.nitrogenAfterIncubation = data.m_nitrogen_init;
        this.phosphorus = data.phosphorus;
        this.potasium = data.potasium;
        this.calcium = data.calcium;
        this.magnesium = data.magnesium;
        this.totalBases = data.total_bases;
        this.crop = crop;
        this.requirements = {};
        //display that data is being processed.
        let processing = document.querySelector('.processing');
        let processorText = document.querySelector('#processor-text');
        processorText.innerText = "Working";
        processing.style.display = "block";
        processing.scrollIntoView();
        //check nutrients amounts needed and recommend after that.
        this.checkNutrients(this.crop);


    }
    selectFromResultsRanges = (results, key, type) => {
        let answer;
        switch (type) {
            case "potasium":
                if (key < results[0].min_percentage) {
                    answer = results[0];
                    break;
                }
                if (key > results[results.length - 1].min_percentage) {
                    answer = results[results.length - 1];
                    break;
                }
                for (let i = 0; i < results.length; i++) {
                    if ((key >= results[i].min_percentage) && (key <= results[i].max_percentage)) {
                        answer = results[i];
                        break;
                    }
                }
                break;
            case "nitrogen":
                if (key < results[0].min_ppm) {
                    answer = results[0];
                    break;
                }
                if (key > results[results.length - 1].min_ppm) {
                    answer = results[results.length - 1];
                    break;
                }
                for (let i = 0; i < results.length; i++) {
                    if ((key >= results[i].min_ppm) && (key <= results[i].max_ppm)) {
                        answer = results[i];
                        break;
                    }
                }
                break;
            case "phosphorus":
                if (key < results[0].min_ppm) {
                    answer = results[0];
                    break;
                }
                if (key > results[results.length - 1].min_ppm) {
                    answer = results[results.length - 1];
                    break;
                }
                for (let i = 0; i < results.length; i++) {
                    if ((key >= results[i].min_ppm) && (key <= results[i].max_ppm)) {
                        answer = results[i];
                        break;
                    }
                }
                break;
        }
        return answer;
    }
    //find the appropriate requirements based on the value entered by the user.
    selectFromResults = (theResults, key, type) => {
        //check if the results queried from the database differ by one
        let differByOne = true;
        let diff = 1;
        let answer;
        let results = theResults;
        for (let i = 0; i < results.length - 1; i++) {
            switch (type) {
                case "phosphorus":
                case "nitrogen":
                    if ((results[i + 1].ppm - results[i].ppm) != diff) {
                        differByOne = false;
                    }
                    break;
                case "potasium":
                    if ((results[i + 1].percentage - results[i].percentage) != diff) {
                        differByOne = false;
                    }
                    break;
            }
        }
        if (differByOne) {
            //just find the answer from the array
            switch (type) {
                case "potasium":
                    if (key <= results[0].percentage) {
                        answer = results[0];
                        break;
                    }
                    if (key >= results[results.length - 1].percentage) {
                        answer = results[results.length - 1];
                        break;
                    }
                    for (let i = 0; i < results.length; i++) {
                        if (results[i].percentage == key) {
                            answer = results[i];
                            break;
                        }
                    }
                    break;
                case "nitrogen":
                    if (key <= results[0].ppm) {
                        answer = results[0];
                        break;
                    }
                    if (key >= results[results.length - 1].ppm) {
                        answer = results[results.length - 1];
                        break;
                    }
                    for (let i = 0; i < results.length; i++) {
                        if (results[i].ppm == key) {
                            answer = results[i];
                            break;
                        }
                    }
                    break;
                case "phosphorus":
                    if (key <= results[0].ppm) {
                        answer = results[0];
                        break;
                    }
                    if (key >= results[results.length - 1].ppm) {
                        answer = results[results.length - 1];
                        break;
                    }
                    for (let i = 0; i < results.length; i++) {
                        if (results[i].ppm == key) {
                            answer = results[i];
                            break;
                        }
                    }
                    break;
            }

        } else {
            //find the closest answer from the array.
            let left, right, leanLeft, leanRight;
            switch (type) {
                case 'nitrogen':
                case 'phosphorus':
                    if (key <= results[0].ppm) {
                        answer = results[0];
                        break;
                    }
                    if (key >= results[results.length - 1].ppm) {
                        answer = results[results.length - 1];
                        break;
                    }
                    //otherwise find the closest requirement.
                    for (let i = 0; i < results.length - 1; i++) {
                        if (results[i].ppm <= key && key <= results[i + 1].ppm) {
                            left = results[i];
                            right = results[i + 1];
                        }
                    }
                    //find where the key is leaning
                    leanLeft = key - left.ppm;
                    leanRight = right.ppm - key;
                    if (leanRight < leanLeft) {
                        answer = right;
                    } else if (leanRight == leanLeft) {
                        answer = right;
                    } else {
                        answer = left;
                    }
                    break;
                case 'potasium':
                    if (key <= results[0].percentage) {
                        answer = results[0];
                        break;
                    }
                    if (key >= results[results.length - 1].percentage) {
                        answer = results[results.length - 1];
                        break;
                    }
                    for (let i = 0; i < results.length - 1; i++) {
                        if (results[i].percentage <= key && key <= results[i + 1].percentage) {
                            left = results[i];
                            right = results[i + 1];
                        }
                    }
                    //find where the key is leaning
                    leanLeft = key - left.percentage;
                    leanRight = right.percentage - key;
                    if (leanRight < leanLeft) {
                        answer = right;
                    } else if (leanRight == leanLeft) {
                        answer = right;
                    } else {
                        answer = left;
                    }
                    break;
            }

        }
        return answer;
    }
    //check the amounts of nutrients needed.
    //takes in crop details, nitrogen, phosphorus & potasium values entered.
    //takes a callback that will be called when all nutrients have been fetched.
    checkNutrients = (crop) => {
        //First get the table structure.

        //get the tables that contain requirements, based on the crop's name.
        //These tables were created when the crop was added.
        let tableNamePrefix = crop.name.replace(" ", "_");
        this.checkNitrogenRequirements(tableNamePrefix);

    }
    checkNitrogenRequirements = (tableNamePrefix) => {
        //get the Nitrogen table structure then make a query based on that.
        let that = this;
        let table_nitro = tableNamePrefix + '_n_map';
        let sql_nitro = `DESC ${table_nitro}`;
        connection.query(sql_nitro, function (err, results, fields) {
            if (err) {
                errors.push(timeError(err.code + ": Could not define nitrogen table's structure."));
                statusReport.innerText = 'Status: Could not define nitrogen table\'s structure';
                throw err;
            }
            else {
                statusReport.innerText = 'Status: Ok';
                //console.log("Nitrogen table structure", results);
                //now we want  to create fields based of the table structure
                let n_table_struct = {};
                for (var i = 0; i < results.length; i++) {

                    n_table_struct[(results[i]).Field] = null;
                }
                // console.log("Yes this table has the ppm value");
                //BUG01
                let sql1 = `SELECT * FROM ${table_nitro} ORDER BY ppm`;
                //fire!
                connection.query(sql1, function (err, results, fields) {
                    if (err) {
                        statusReport.innerText = 'Status: Could not load nitrogen requirements.';
                        errors.push(timeError(err.code + ": Could not load nitrogen requirements."));
                        throw err;
                    }
                    else {
                        statusReport.innerText = 'Status: Ok';
                        console.log('Query executed');
                        console.log(results);
                        let answer;
                        if (n_table_struct.ppm !== undefined) {
                            answer = that.selectFromResults(results, that.nitrogenAfterIncubation, "nitrogen");
                            n_table_struct.ppm = answer.ppm;
                            n_table_struct.max_kg = answer.max;
                            n_table_struct.min_kg = answer.min;
                        }
                        else {
                            answer = that.selectFromResultsRanges(results, that.nitrogenAfterIncubation, "nitrogen");
                            n_table_struct.min_ppm = answer.min_ppm;
                            n_table_struct.max_ppm = answer.max_ppm;
                            n_table_struct.max_kg = answer.max_kg;
                            n_table_struct.min_kg = answer.min_kg;
                        }

                        that.requirements.nitrogen = n_table_struct;
                        nitrogenChecked = true;
                        //proceed forward to get phosphorus requirements.
                        that.checkPhosphorusRequirements(tableNamePrefix);
                    }
                })

            }
        })
    }
    checkPhosphorusRequirements = (tableNamePrefix) => {
        let that = this;
        let table_phos = tableNamePrefix + '_p_map';
        let sql_phos = `DESC ${table_phos}`;
        connection.query(sql_phos, function (err, results, fields) {
            if (err) {
                statusReport.innerText = "Status: Could not define phosphorus table's structure";
                errors.push(timeError(err.code + ": Could not define phosphorus table's structure"));
                throw err;
            }
            else {
                statusReport.innerText = 'Status: Ok';
                console.log("Phosphorus table structure", results);
                let p_table_struct = {};
                for (var i = 0; i < results.length; i++) {
                    p_table_struct[(results[i]).Field] = null;
                }
                console.log("My phosphorus table structure", p_table_struct);
                //BUG03
                let sql1 = `SELECT * FROM ${table_phos} ORDER BY ppm`;
                //fire!
                connection.query(sql1, function (err, results, fields) {
                    if (err) {
                        statusReport.innerText = 'Status: Could not load phosphorus requirements.';
                        errors.push(timeError(err.code + ": Could not load phosphorus requirements."));
                        throw err;
                    }
                    else {
                        statusReport.innerText = 'Status: Ok';
                        console.log('Query executed');
                        console.log(results);
                        let answer;
                        if (p_table_struct.ppm !== undefined) {
                            answer = that.selectFromResults(results, that.phosphorus, "phosphorus");
                            p_table_struct.ppm = answer.ppm;
                            p_table_struct.max_kg = answer.max;
                            p_table_struct.min_kg = answer.min;
                        }
                        else {
                            answer = that.selectFromResultsRanges(results, that.phosphorus, "phosphorus");
                            p_table_struct.min_ppm = answer.min_ppm;
                            p_table_struct.max_ppm = answer.max_ppm;
                            p_table_struct.max_kg = answer.max_kg;
                            p_table_struct.min_kg = answer.min_kg;
                        }
                        that.requirements.phosphorus = p_table_struct;
                        phosphorusChecked = true;
                        //proceed forward to get potasium requirements.
                        that.checkPotasiumRequirements(tableNamePrefix);

                    }
                })

            }
        })
    }
    checkPotasiumRequirements = (tableNamePrefix) => {
        let that = this;
        let table_pot = tableNamePrefix + '_k_map';
        let sql_pot = `DESC ${table_pot}`;
        connection.query(sql_pot, function (err, results, fields) {
            if (err) {
                statusReport.innerText = 'Status: Could nor define potasium\'s table structure.';
                errors.push(timeError(err.code + ": Could not define potasium's table structure."));
                throw err;
            }
            else {
                statusReport.innerText = 'Status: Ok';
                let k_table_struct = {};
                for (var i = 0; i < results.length; i++) {
                    k_table_struct[(results[i]).Field] = null;
                }
                console.log("My Potasium table structure", k_table_struct);
                let finalTexture = that.texture.trim();
                let sql1;
                if (k_table_struct.hasOwnProperty('percentage'))
                    sql1 = `SELECT * FROM ${table_pot} WHERE texture = '${finalTexture}' ORDER BY percentage`;
                else sql1 = `SELECT * FROM ${table_pot} WHERE texture = '${finalTexture}' ORDER BY min_percentage`;
                //fire!
                connection.query(sql1, function (err, results, fields) {
                    if (err) {
                        statusReport.innerText = 'Status: Could not load potasium requirements.';
                        errors.push(timeError(err.code + ": Could not load potasium requirements."));
                        throw err;
                    }
                    else {
                        statusReport.innerText = 'Status: Ok';
                        console.log('Query executed');
                        console.log(results);
                        let answer;
                        if (k_table_struct.percentage !== undefined) {
                            answer = that.selectFromResults(results, that.potasium, "potasium");
                            k_table_struct.texture = answer.texture;
                            k_table_struct.percentage = answer.percentage;
                            k_table_struct.max_kg = answer.max;
                            k_table_struct.min_kg = answer.min;
                        }
                        else {
                            answer = that.selectFromResultsRanges(results, that.potasium, "potasium");
                            k_table_struct.texture = answer.texture;
                            k_table_struct.min_percentage = answer.min_percentage;
                            k_table_struct.max_percentage = answer.max_percentage;
                            k_table_struct.max_kg = answer.max_kg;
                            k_table_struct.min_kg = answer.min_kg;
                        }

                        that.requirements.potasium = k_table_struct;
                        potasiumChecked = true;
                        //proceed forward to recommend fertilizers.
                        that.recommend(that.requirements, that.crop);
                    }
                })

            }
        })
    }
    //Action: recommend fertilizers
    //return: Recommendation Object
    recommend = (requirements, crop) => {

        let recommendationData = {
            lab_number: this.lab_number,
            ref: this.ref,
            nitrogen: "",
            phosphorus: "",
            potasium: "",
            text1: "",
            text2: "",
            text3: "",
            lime: 0,
            crop: crop.name,
            text4: ""
        };
        var that = this;
        //Start with pH
        if (that.pH < crop.lowest_pH) {
            let rate = 0;
            switch (that.texture) {
                case 'L':
                    rate = 1000;
                    break;
                case 'LSa':
                    rate = 1000;
                    break;
                case 'Si':
                    rate = 600;
                    break;
                case 'C':
                    rate = 2000;
                    break;
                case 'SaC':
                    rate = 2000;
                    break;
                case 'SaCL':
                    rate = 1500;
                    break;
                case 'SaL':
                    rate = 1000;
                    break;
                case 'S':
                    rate = 600;
                    break;

            }
            let pHIncrease = that.pH;
            let targetpH = crop.lowest_pH + ((crop.highest_pH - crop.lowest_pH) / 2);
            while (pHIncrease < targetpH) {
                pHIncrease += 0.3;
            }
            recommendationData.lime = Math.round(pHIncrease * rate);
        }

        //check the ratio of calcium to magnesium
        if (that.magnesium > that.calcium) {
            recommendationData.text4 = 'This soil has more magnesium than calcium.';
        }




        //REFACTOR01
        if (nitrogenChecked && phosphorusChecked && potasiumChecked) {
            //now calculate the fertilizers required based on the nutrients requirements.
            //start with phosphorus.
            let nutrientsRequirements = requirements;

            //get the best compounds recommended for a crop.
            let requiredFertilizers = getFertilizers(requirements);

            let fertilizePhosphorus = requiredFertilizers[1];
            let minPhosphorusKilograms = nutrientsRequirements.phosphorus.min_kg / fertilizePhosphorus.phosphorus;
            let maxPhosphorusKilograms = nutrientsRequirements.phosphorus.max_kg / fertilizePhosphorus.phosphorus;
            //Now let's create a new rate.
            let phosphorusRate = {
                fertilizer: fertilizePhosphorus,
                method: 'Top dressing',
                minimum: minPhosphorusKilograms,
                maximum: maxPhosphorusKilograms
            }
            //Now calculate how much potasium and nitrogen has been added.
            //Nitrogen.
            let minNitrogenAdded = minPhosphorusKilograms * fertilizePhosphorus.nitrogen;
            let maxNitrogenAdded = maxPhosphorusKilograms * fertilizePhosphorus.nitrogen;
            //Calculate the remaining nitrogen that needs to be added.
            let minRemainingNitrogen = nutrientsRequirements.nitrogen.min_kg - minNitrogenAdded;
            let maxRemainingNitrogen = nutrientsRequirements.nitrogen.max_kg - maxNitrogenAdded;
            //Potasium.
            let minPotasiumAdded = maxPhosphorusKilograms * fertilizePhosphorus.potasium;
            let maxPotasiumAdded = maxPhosphorusKilograms * fertilizePhosphorus.potasium;
            //Calculate the remaining potasium that needs to be added.
            let minRemainingPotasium = nutrientsRequirements.potasium.min_kg - minPotasiumAdded;
            let maxRemainingPotasium = nutrientsRequirements.potasium.max_kg - maxPotasiumAdded;

            //Get potasium fertlizer.
            let fertilizePotasium = requiredFertilizers[2];
            let minPotasiumKilograms = 0;
            let maxPotasiumKilograms = 0;
            if (minRemainingPotasium > 0) {
                //add more
                minPotasiumKilograms = minRemainingPotasium / fertilizePotasium.potasium;
            }

            if (minRemainingPotasium > 0) {
                //add more
                maxPotasiumKilograms = maxRemainingPotasium / fertilizePotasium.potasium;
            }



            //Now let's potasium application rate.
            let potasiumRate = {
                fertilizer: fertilizePotasium,
                minimum: minPotasiumKilograms,
                maximum: maxPotasiumKilograms
            }

            //Now calculate how much nitrogen is left.

            if (minPotasiumKilograms > 0)
                minNitrogenAdded = minPotasiumKilograms * fertilizePotasium.nitrogen;
            else maxNitrogenAdded = 0;
            if (maxPotasiumKilograms > 0)
                maxNitrogenAdded = maxPotasiumAdded * fertilizePotasium.nitrogen;
            else maxNitrogenAdded = 0;
            //update remaining nitrogen.
            minRemainingNitrogen -= minNitrogenAdded;
            maxRemainingNitrogen -= maxNitrogenAdded;
            console.log('Pending nitrogen', nutrientsRequirements.nitrogen.min_kg);

            //Now let's apply nitrogen fertilizer
            let fertilizeNitrogen = requiredFertilizers[0];
            //Now calculate the kgs required
            let minNitrogenKilograms = 0;
            let maxNitrogenKilograms = 0;
            if (minRemainingNitrogen > 0)
                minNitrogenKilograms = minRemainingNitrogen / fertilizeNitrogen.nitrogen;
            if (maxRemainingNitrogen > 0)
                maxNitrogenKilograms = maxRemainingNitrogen / fertilizeNitrogen.nitrogen;

            //Now let's create Nitrogen rate
            let nitrogenRate = {
                fertilizer: fertilizeNitrogen,
                minimum: minNitrogenKilograms,
                maximum: maxNitrogenKilograms
            }

            let rates = {
                phosphorus: phosphorusRate,
                nitrogen: nitrogenRate,
                potasium: potasiumRate
            }






            //save the recommendation into the database
            recommendationData.nitrogen = `${requirements.nitrogen.min_kg}kg - ${requirements.nitrogen.max_kg}kg`;
            recommendationData.phosphorus = `${requirements.phosphorus.min_kg}kg - ${requirements.phosphorus.max_kg}kg`;
            recommendationData.potasium = `${requirements.potasium.min_kg}kg - ${requirements.potasium.max_kg}kg`;


            console.log("My application rates", rates);
            console.log("My nutrients requirements", requirements);
            let displayRecommendation = document.createElement('table');
            let recommendationContainer = document.querySelector('.display-recommendation');
            recommendationContainer.appendChild(displayRecommendation);
            displayRecommendation.innerHTML = '';
            let addNewData = document.querySelector('.add-new-data');



            let phosphorusFertilizer = phosphorusRate.fertilizer.name;
            let nitrogenFertilizer = nitrogenRate.fertilizer.name;
            let potasiumFertilizer = potasiumRate.fertilizer.name;
            //set our values for database
            recommendationData.min_nitrogen = nitrogenRate.minimum.toFixed(2);
            recommendationData.max_nitrogen = nitrogenRate.maximum.toFixed(2);
            recommendationData.min_phosphorus = phosphorusRate.minimum.toFixed(2);
            recommendationData.max_phosphorus = phosphorusRate.maximum.toFixed(2);
            recommendationData.min_potasium = potasiumRate.minimum.toFixed(2);
            recommendationData.max_potasium = potasiumRate.maximum.toFixed(2);
            let phosphorusRange = `${phosphorusFertilizer}: ranging from ${phosphorusRate.minimum.toFixed(2)}kg to  ${phosphorusRate.maximum.toFixed(2)}kg`;
            let nitrogenRange = ` ${nitrogenFertilizer}: ranging from ${nitrogenRate.minimum.toFixed(2)}kg to ${nitrogenRate.maximum.toFixed(2)}kg`;
            let potasiumRange = `${potasiumFertilizer}: ranging from ${potasiumRate.minimum.toFixed(2)}kg to ${potasiumRate.maximum.toFixed(2)}kg`
            recommendationData.text1 = phosphorusRange;
            recommendationData.text2 = nitrogenRange;
            recommendationData.text3 = potasiumRange;
            recommendationData.nitrogen_fertilizer = nitrogenFertilizer;
            recommendationData.phosphorus_fertilizer = phosphorusFertilizer;
            recommendationData.potasium_fertilizer = potasiumFertilizer;

            //Save the information to the database
            let mysql = `INSERT INTO recommendation SET ?`;
            let processorText = document.querySelector('#processor-text');
            processorText.innerText = "Saving";
            connection.query(mysql, recommendationData, function (err, xresults, fields) {
                if (err) {
                    statusReport.innerText = 'Status: Could not save recommendation.';
                    errors.push(timeError("Could not save recommendation."));
                    throw err;
                }
                else {
                    //make a query using ref
                    statusReport.innerText = 'Status: Ok';


                    let lab_results_has_rec = {
                        recommendation_id: xresults.insertId,
                        lab_results_id: that.id,
                    }
                    //fire!
                    connection.query(`INSERT INTO lab_results_has_recommendation SET ?`,
                        lab_results_has_rec, function (err, zresult, fields) {
                            if (err) {
                                statusReport.innerText = 'Status: Could not save recommendation.';
                                errors.push(new Date().toString() + ": " + err.code + ": " + err.toString());
                                throw err;
                            }
                            else {
                                statusReport.innerText = 'Status: Ok';
                                console.log("Successfully", zresult);
                                phosphorusChecked = false;
                                potasiumChecked = false;
                                nitrogenChecked = false;
                                let processing = document.querySelector('.processing');
                                let processorText = document.querySelector('#processor-text');
                                processorText.innerText = "";
                                processing.style.display = "none";


                            }
                        })

                }
            })
            let message = document.createElement('tr');
            message.innerHTML = `<td>Dear <b>${that.name}</b> your soil needs the following amount of nutrients </td><td>${new Date().toDateString()}</td>`;
            let displayNitrogenRequirement = document.createElement('tr');
            displayNitrogenRequirement.innerHTML = `<td>Nitrogen</td><td> ${recommendationData.nitrogen}</td>`;
            let displayPhosphorusRequirement = document.createElement('tr');
            displayPhosphorusRequirement.innerHTML = `<td>Phosphorus</td> <td>${recommendationData.phosphorus}</td>`;
            let displayPotasiumRequirement = document.createElement('tr');
            displayPotasiumRequirement.innerHTML = `<td>Potasium</td> <td>${recommendationData.potasium}</td>`;
            let pHDescription = getpHDescription(that.pH);
            let displayPHValue = document.createElement('tr');
            displayPHValue.innerHTML = `<td>pH</td> <td>${that.pH} : ${pHDescription}.</td>`;

            //lime recommendation text



            //Create UI
            let displayPhosphorusApplications = document.createElement('tr');
            displayPhosphorusApplications.innerHTML = `<td>Apply</td><td>${phosphorusRange}</td>`;
            let displayPotasiumApplications = document.createElement('tr');
            displayPotasiumApplications.innerHTML = `<td>Apply</td><td>${potasiumRange}</td>`;
            let displayNitrogenApplications = document.createElement('tr');
            displayNitrogenApplications.innerHTML = `<td>Apply</td><td> ${nitrogenRange}</td>`;
            displayRecommendation.appendChild(message);
            displayRecommendation.appendChild(displayNitrogenRequirement);
            displayRecommendation.appendChild(displayPhosphorusRequirement);
            if (!(requirements.potasium.min_kg == 0 && requirements.potasium.max_kg == 0))
                displayRecommendation.appendChild(displayPotasiumRequirement);
            displayRecommendation.appendChild(displayPHValue);
            let message2 = document.createElement('tr');
            message2.innerHTML = '<td>therefore you need to apply the following</td><td>&nbsp;</td>';
            let printButton = document.createElement('button');
            printButton.className = 'btn';
            printButton.style.display = "block";
            printButton.innerText = 'Get report';
            

            //Add click event handler for Print button.
            printButton.addEventListener('click', function () {
                //already the result we got it
                let xsql0 = `SELECT * FROM lab_results WHERE id = ${that.id}`;
                connection.query(xsql0, function (err, xresults, fields) {
                    if (err) {
                        statusReport.innerText = 'Status: Could not load lab results';
                        errors.push(timeError(err.code + ": Could not load lab results."));
                        throw err;
                    } else {
                        statusReport.innerText = 'Status: Ok';
                        if (xresults.length > 0) {
                            let result = xresults[0];
                            let xsql = `SELECT * FROM lab_results_has_recommendation WHERE lab_results_id = ${result.id}`;
                            connection.query(xsql, function (err, xresult, fields) {
                                if (err) {
                                    statusReport.innerText = 'Status: Could not establish relationship (lab results -> recommendation).';
                                    errors.push(timeError(err.code + ": Could not establish relationship (lab results -> recommendation)."));
                                    throw err;
                                } else {
                                    statusReport.innerText = 'Status: Ok';
                                    if (xresult.length > 0) {
                                        let recommendation_id = xresult[0].recommendation_id;
                                        //query
                                        let xsql1 = `SELECT * FROM recommendation WHERE id  = ${recommendation_id}`;
                                        connection.query(xsql1, function (err, yresult, fields) {
                                            if (err) {
                                                statusReport.innerText = 'Status: Could not load recommendation.';
                                                errors.push(timeError(err.code + ": Could not load recommendation."));
                                                throw err;
                                            } else {
                                                statusReport.innerText = 'Status: Ok';
                                                if (yresult.length > 0) {
                                                    let recommendationPackage = yresult[0];
                                                    let labresultsPackage = result;
                                                    let pack = {
                                                        results: labresultsPackage,
                                                        recommendation: recommendationPackage
                                                    }
                                                    ipc.send('open-pdf-prep', pack);
                                                }
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    }
                })


            })

            displayRecommendation.appendChild(message2);
            displayRecommendation.appendChild(displayPhosphorusApplications);
            if (!(requirements.potasium.min_kg == 0 && requirements.potasium.max_kg == 0))
                displayRecommendation.appendChild(displayPotasiumApplications);
            displayRecommendation.appendChild(displayNitrogenApplications);
            let displayLimeValue = document.createElement('tr');
            displayLimeValue.innerHTML = `<td>Apply</td><td>${recommendationData.lime}kgs of lime.</td>`;
            displayRecommendation.appendChild(displayLimeValue);
            recommendationContainer.appendChild(printButton);
            document.querySelector('#right').scrollIntoView();
        }




    }

}



class Crop {
    constructor(data) {
        this.name = data.name;
        this.id = data.id;
        this.nitrogen = data.nitrogen;
        this.phosphorus = data.phosphorus;
        this.potasium = data.potasium;
        this.calcium = data.calcium;
        this.magnesium = data.magnesium;
        this.boron = data.boron;
        this.lowest_pH = data.lowest_pH;
        this.highest_pH = data.highest_pH;
        if (data.regular_top_dressing == 1) this.regular_top_dressing = true;
        else this.regular_top_dressing = false;
        if (data.special_top_dressing == 1) this.special_top_dressing = true;
        else this.special_top_dressing = false;

    }


}

let addDataButton = document.querySelector("#add-data");
let viewHistoricalDataButton = document.querySelector("#view-history");
let addNewCropButton = document.querySelector('#add-new-crop')
let viewCropsButton = document.querySelector('#view-crops');


viewCropsButton.addEventListener('click', viewCrops);

function  addNewCrop() {
    let addCropView = document.querySelector('.crop-add');
    window.views.peek().style.display = 'none';
    addCropView.style.display = 'block';
    let backButton = document.querySelector('#back');
    backButton.style.display = 'inline-block';
    let dashboard = document.querySelector('#dashboard');
    window.views.push(dashboard);
    window.views.push(addCropView);
}

addNewCropButton.addEventListener('click', addNewCrop)

function viewHistory() {
    var historicalContent = document.querySelector('.historical-data');
    window.views.peek().style.display = "none";
    historicalContent.style.display = 'block';
    var backButton = document.querySelector('#back');
    backButton.style.display = 'inline-block';
    var dashboard = document.querySelector("#dashboard");
    window.views.push(dashboard);
    window.views.push(historicalContent);
    let sql = `SELECT * FROM lab_results`;
    //Remove previous reload button, this has been appended because
    // an error has occured during the loading of data

    updateTable(sql);


}

viewHistoricalDataButton.addEventListener('click', viewHistory)

let searchForm = document.querySelector('#search-form');
searchForm.addEventListener('submit', doNothing);
function doNothing(e) {
    e.preventDefault();
}
let searchInput = document.querySelector('#search');
searchInput.addEventListener('change', function (e) {
    let sql = `SELECT * FROM lab_results WHERE name LIKE '${e.target.value}%' OR ref LIKE '${e.target.value}%'`;
    updateTable(sql);
})

function addNewLabData () {
    var dashboard = document.querySelector('#dashboard');
    var backButton = document.querySelector('#back');
    window.views.peek().style.display = "none";
    backButton.style.display = 'inline-block';
    dashboard.style.display = 'none';
    var addData = document.querySelector('.add-new-data');
    addData.style.display = 'block';
    window.views.push(dashboard);
    window.views.push(addData);
    let selectCrops = document.querySelector("#crops");
    selectCrops.innerHTML = '';
    let defaultOption = document.createElement('option');
    defaultOption.value = 0;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.innerText = 'Select crop';
    selectCrops.appendChild(defaultOption);

    connection.query('SELECT * FROM crop', function (err, results, fields) {
        if (err) {
            errors.push(new Date().toString() + ": " + err.code + ": " + err.toString() + ":could not load crops from the database");
            statusReport.innerText = 'Status: Could not load crops from the database';

            throw err;
        }
        else {
            statusReport.innerText = 'Status: Ok';

            for (const result of results) {
                var option = document.createElement('option');
                option.innerText = result.name;
                option.value = result.id;
                selectCrops.appendChild(option);
            }
            selectCrops.dispatchEvent(updateCrops);
        }
    })




}


addDataButton.addEventListener('click', addNewLabData );
//Handle menu commands
ipc.on('open-view', function(event, message){
    switch(message){
        case 'recommend':
            addNewLabData();
            break;
        case 'history':
            viewHistory();
            break;
        case 'addcrop':
            addNewCrop();
            break;
        case 'viewcrops':
            viewCrops();
            break;
        
    }
});


//Change password
ipc.on('change-password', (event, newPassword)=>{
    if(connection){
        connection.query(`SET PASSWORD = PASSWORD('${newPassword}')`, (err, result)=>{
            if(err){
                errors.push(timeError(err.code + ": Could not change password"));
                ipc.send('change-password-feedback', {message:err.code + " Could not change password", code:0});
            }  else{
                ipc.send('change-password-feedback', {message:"Successfully changed", code: 1});
            }
        })
    }
})
//Request for connection object
ipc.on('get-connection', (event) =>{
    ipc.send('connection', connection);

})