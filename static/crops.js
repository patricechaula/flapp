const addCropForm = document.querySelector('.crop-add form');
addCropForm.addEventListener('submit', saveCrop);
var saveCrop = new Event('savecrop');

var requirementsSavedflags = [false, false, false];
var editFlag = false;
var progressText = "Adding ";
var cropBeingAdded = "";
var dots = "";
var counter = 0;
//save crop

const BAD_CSV_FORMAT = "Bad csv format";



function createNitrogenReqs(csvNitro, cropName, delim, callback, retry) {
    //create read stream
    let csvNitroData = [];
    fs.createReadStream(csvNitro['0'].path)
        .pipe(
            parse({
                delimiter: delim
            }, function (err) {
                if (err) {
                    errors.push(timeError("Error reading nitrogen csv file."));
                    dialog.showErrorBox("Error reading nitrogen csv file.", err.toString());
                }
            })
        ).on('data', function (dataRow) {
            csvNitroData.push(dataRow);
        }).on('end', function () {
            statusReport.innerText = 'Status: Ok';
            console.log(csvNitroData);
            //use the data to enter values into the database
            let headings = csvNitroData[0];
            try {
                //Check if all the required fields to insert data in the table are available.
                if ((headings[0] !== "ppm" || headings[1] !== "min" || headings[2] !== "max")
                    && (headings[0] !== "min_ppm" || headings[1] !== "max_ppm" || headings[2] !== "min"
                        || headings[3] !== "max")
                )
                    throw BAD_CSV_FORMAT;
                let sql;
                if (headings[0] == 'ppm') {
                    //create sql for ppm table structure

                    sql = `CREATE TABLE ${cropName}_n_map (
                    id INT NOT NULL AUTO_INCREMENT,
                    ppm INT NOT NULL,
                    min INT NOT NULL,
                    max INT NOT NULL,
                    PRIMARY KEY (id)
                )`
                    //fire
                    connection.query(sql, function (err, results, fields) {
                        if (err) {
                            dialog.showErrorBox('Could not create nitrogen requirements table',
                                err.toString())
                            errors.push(timeError('Could not create nitrogen requirements table'));
                            throw err;
                        } else {
                            //else insert the data
                            for (let i = 1; i < csvNitroData.length; i++) {
                                data = csvNitroData[i];
                                let ppm = data[0];
                                let min = data[1];
                                let max = data[2];
                                let package = {
                                    ppm: ppm,
                                    min: min,
                                    max: max
                                }
                                //fire!
                                connection.query(`INSERT INTO ${cropName}_n_map SET ?`, package,
                                    function (err, bresult, fields) {
                                        if (err) {
                                            dialog.showErrorBox('Could not insert data into the requirements table.',
                                                err.toString())
                                            errors.push(timeError('Could not insert data into the requirements table.'));
                                            throw err;
                                        } else {
                                            console.log("Success");
                                            if (i == csvNitroData.length - 1) {
                                                requirementsSavedflags[0] = true;
                                                callback();
                                            }
                                        }
                                    })
                            }



                        }
                    })
                } else {
                    //now it's ppm_min and ppm_max
                    sql = `CREATE TABLE ${cropName}_n_map(
                     id INT NOT NULL AUTO_INCREMENT,
                     min_ppm INT NOT NULL,
                     max_ppm INT NOT NULL,
                     min_kg INT NOT NULL,
                     max_kg INT NOT NULL,
                     PRIMARY KEY(id)
                 ) `
                    connection.query(sql, function (err, results, fields) {
                        if (err) {
                            dialog.showErrorBox('Could not create nitrogen requirements table.',
                                err.toString())
                            errors.push(timeError("Could not create nitrogen requirements table."));
                            throw err;
                        } else {
                            console.log("Table creation successful", results);
                            //now insert the data into the table
                            for (let i = 1; i < csvNitroData.length; i++) {
                                data = csvNitroData[i];
                                let min_ppm = data[0];
                                let max_ppm = data[1]
                                let min_kg = data[2];
                                let max_kg = data[3];
                                let package = {
                                    min_ppm: min_ppm,
                                    max_ppm: max_ppm,
                                    min_kg: min_kg,
                                    max_kg: max_kg
                                }
                                //fire!
                                connection.query(`INSERT INTO ${cropName}_n_map SET ?`, package,
                                    function (err, bresult, fields) {
                                        if (err) {
                                            dialog.showErrorBox('Could not save data into nitrogen requirements table.',
                                                err.toString());
                                            errors.push("Could not save nitrogen requirements, incompatible csv format.");
                                            throw err;
                                        } else {
                                            console.log("Success");
                                            if (i == csvNitroData.length - 1) {
                                                requirementsSavedflags[0] = true;
                                                callback();
                                            }
                                        }
                                    })
                            }

                        }
                    })
                }
            } catch (err) {
                if (err === BAD_CSV_FORMAT)
                    if (retry)
                        createNitrogenReqs(csvNitro, cropName, ',', insertCrop, false);
                    else {
                        errors.push(timeError("Could not save nitrogen requirements, incompatible csv format."));
                        let processing = document.querySelector('.processing');
                        let processorText = document.querySelector('#processor-text');
                        processorText.innerText = "";
                        processing.style.display = "none";
                        dialog.showErrorBox("Error", "Could not save nitrogen requirements, incompatible csv format.");
                    }
                else {
                    errors.push(timeError("Could not save nitrogen requirements, incompatible csv format."));
                }
            }



        })
}

function createPhosphorusReqs(csvPhos, cropName, delim, callback, retry) {
    //Phosphorus
    let csvPhosData = [];
    fs.createReadStream(csvPhos['0'].path)
        .pipe(
            parse({
                delimiter: delim
            }, function (err) {
                if (err) {
                    errors.push(timerror("Error reading phosphorus csv file."));
                    dialog.showErrorBox("Error reading phosphorus csv file.", err.toString());
                }
            })
        ).on('data', function (dataRow) {
            csvPhosData.push(dataRow);
        }).on('end', function () {
            console.log(csvPhosData);
            //now use the data to enter values to the database
            let headings = csvPhosData[0];
            try {
                //Check if all the required fields to insert data in the table are available.
                if ((headings[0] !== "ppm" || headings[1] !== "min" || headings[2] !== "max")
                    && (headings[0] !== "min_ppm" || headings[1] !== "max_ppm" || headings[2] !== "min"
                        || headings[3] !== "max")
                )
                    throw BAD_CSV_FORMAT;
                let sql;
                if (headings[0] == 'ppm') {
                    //create sql for ppm table structure
                    sql = `CREATE TABLE ${cropName}_p_map (
                    id INT NOT NULL AUTO_INCREMENT,
                    ppm INT NOT NULL,
                    min INT NOT NULL,
                    max INT NOT NULL,
                    PRIMARY KEY (id)
                )`
                    //fire
                    connection.query(sql, function (err, results, fields) {
                        if (err) {
                            dialog.showErrorBox('Could not create phosphorus requirements table.',
                                err.toString())
                            errors.push(timeError(err.code + 'Could not create phosphorus requirements table.'));
                            throw err;
                        } else {
                            //else insert the data
                            for (let i = 1; i < csvPhosData.length; i++) {
                                data = csvPhosData[i];
                                let ppm = parseInt(data[0]);
                                let min = parseInt(data[1]);
                                let max = parseInt(data[2]);
                                let package = {
                                    ppm: ppm,
                                    min: min,
                                    max: max
                                }
                                //fire!
                                connection.query(`INSERT INTO ${cropName}_p_map SET ?`, package,
                                    function (err, bresult, fields) {
                                        if (err) {
                                            dialog.showErrorBox('Could not insert data into phosphorus requirements table.',
                                                err.toString())
                                            errors.push(timeError(err.code + ': Could not insert data into phosphorus requirements table.'));
                                            throw err;
                                        } else {
                                            console.log("Success");
                                            if (i == csvPhosData.length - 1) {
                                                requirementsSavedflags[1] = true;
                                                callback();
                                            }
                                        }
                                    })
                            }

                        }
                    })
                } else {
                    //now it's ppm_min and ppm_max
                    sql = `CREATE TABLE ${cropName}_p_map(
                    id INT NOT NULL AUTO_INCREMENT,
                    min_ppm INT NOT NULL,
                    max_ppm INT NOT NULL,
                    min_kg INT NOT NULL,
                    max_kg INT NOT NULL,
                    PRIMARY KEY(id)
                ) `
                    connection.query(sql, function (err, results, fields) {
                        if (err) {
                            dialog.showErrorBox('Could not create phosphorus requirements table.',
                                err.toString())
                            errors.push(timeError('Could not create phosphorus requirements table.'));
                            throw err;
                        } else {
                            console.log("Table creation successful", results);
                            //now insert the data into the table
                            for (let i = 1; i < csvPhosData.length; i++) {
                                data = csvPhosData[i];
                                let min_ppm = parseInt(data[0]);
                                let max_ppm = parseInt(data[1]);
                                let min_kg = parseInt(data[2]);
                                let max_kg = parseInt(data[3]);
                                let package = {
                                    min_ppm: min_ppm,
                                    max_ppm: max_ppm,
                                    min_kg: min_kg,
                                    max_kg: max_kg
                                }
                                //fire!
                                connection.query(`INSERT INTO ${cropName}_p_map SET ?`, package,
                                    function (err, bresult, fields) {
                                        if (err) {
                                            dialog.showErrorBox('Could not save data into phosphorus requirements table.',
                                                err.toString())
                                            errors.push("Could not save data into phosphorus requirements table.");
                                            throw err;
                                        } else {
                                            console.log("Success");
                                            if (i == csvPhosData.length - 1) {
                                                requirementsSavedflags[1] = true;
                                                callback();
                                            }
                                        }
                                    })
                            }

                        }
                    })
                }
            } catch (err) {
                if (err === BAD_CSV_FORMAT)
                    if (retry)
                        createPhosphorusReqs(csvPhos, cropName, ',', insertCrop, false);
                    else {
                        errors.push(timeError("Could not save phosphorus requirements, incompatible csv format."));
                        let processing = document.querySelector('.processing');
                        let processorText = document.querySelector('#processor-text');
                        processorText.innerText = "";
                        processing.style.display = "none";
                        dialog.showErrorBox("Error", "Could not save phosphorus requirements, incompatible csv format.");
                    }
                else {
                    errors.push(timeError(err.code + ": " + err.toString()));
                }
            }
        })
}

function createPotasiumReqs(csvPot, cropName, delim, callback, retry) {
    //Potasium
    let csvPotData = [];
    fs.createReadStream(csvPot['0'].path)
        .pipe(
            parse({
                delimiter: delim
            }, function (err) {
                if (err) {
                    errors.push(timeError("Error reading potasium csv file."));
                    dialog.showErrorBox("Error reading potasium csv file.", err.toString());
                }

            })
        ).on('data', function (dataRow) {
            csvPotData.push(dataRow);
        }).on('end', function () {
            console.log(csvPotData);

            //now use the data to enter values to the database
            let headings = csvPotData[0];
            try {
                //Check if all the required fields to insert data in the table are available.
                if ((headings[0] !== "texture" || headings[1] !== "percentage" ||
                    headings[2] !== "min" || headings[3] !== "max")
                    && (headings[0] !== "texture" || headings[1] !== "min_percentage"
                        || headings[2] !== "max_percentage" || headings[3] !== "min"
                        || headings[4] !== "max")
                )
                    throw BAD_CSV_FORMAT;
                let sql;
                if (headings[1] == 'percentage') {
                    //create sql for ppm table structure
                    sql = `CREATE TABLE ${cropName}_k_map (
                  id INT NOT NULL AUTO_INCREMENT,
                  texture VARCHAR(5) NOT NULL,
                  percentage DECIMAL(3,2) NOT NULL,
                  min INT NOT NULL,
                  max INT NOT NULL,
                  PRIMARY KEY (id)
              )`
                    //fire
                    connection.query(sql, function (err, results, fields) {
                        if (err) {
                            dialog.showErrorBox('Could not create potasium requirements table.',
                                err.toString())
                            errors.push(timeError('Could not create potasium requirements table.'));
                            throw err;

                        } else {
                            //else insert the data
                            for (let i = 1; i < csvPotData.length; i++) {
                                data = csvPotData[i];
                                let texture = data[0]
                                let ppm = parseFloat(data[1]);
                                let min = parseInt(data[2]);
                                let max = parseInt(data[3]);
                                let package = {
                                    texture: texture,
                                    percentage: ppm,
                                    min: min,
                                    max: max
                                }
                                //fire!
                                connection.query(`INSERT INTO ${cropName}_k_map SET ?`, package,
                                    function (err, bresult, fields) {
                                        if (err) {
                                            dialog.showErrorBox('Could not save data into potasium requirements table.',
                                                err.toString())
                                            errors.push(timeError('Could not save data into potasium requirements table.'));
                                            throw err;
                                        } else {
                                            console.log("Success");
                                            if (i == csvPotData.length - 1) {
                                                requirementsSavedflags[2] = true;
                                                callback();
                                            }
                                        }
                                    })
                            }

                        }
                    })
                } else {
                    //or else it's ppm_min and ppm_max
                    sql = `CREATE TABLE ${cropName}_k_map(
                  id INT NOT NULL AUTO_INCREMENT,
                  texture VARCHAR(5) NOT NULL,
                  min_percentage DECIMAL(3,2) NOT NULL,
                  max_percentage DECIMAL(3,2) NOT NULL,
                  min_kg INT NOT NULL,
                  max_kg INT NOT NULL,
                  PRIMARY KEY(id)
              ) `
                    connection.query(sql, function (err, results, fields) {
                        if (err) {
                            dialog.showErrorBox('Could not create potasium requirements table.',
                                err.toString())
                            errors.push(timeError("Could not create potasium requirements table."));
                            throw err;
                        } else {
                            console.log("Table creation successful", results);
                            //now insert the data into the table
                            for (let i = 1; i < csvPotData.length; i++) {
                                data = csvPotData[i];
                                let texture = data[0];
                                let min_ppm = parseFloat(data[1]);
                                let max_ppm = parseFloat(data[2]);
                                let min_kg = parseInt(data[3]);
                                let max_kg = parseInt(data[4]);
                                let package = {
                                    texture: texture,
                                    min_percentage: min_ppm,
                                    max_percentage: max_ppm,
                                    min_kg: min_kg,
                                    max_kg: max_kg
                                }
                                //fire!
                                connection.query(`INSERT INTO ${cropName}_k_map SET ?`, package,
                                    function (err, bresult, fields) {
                                        if (err) {
                                            dialog.showErrorBox('Could not save data into potasium requirements table',
                                                err.toString());
                                            errors.push(timeError("Could not save data into potasium requirements table."));
                                            throw err;
                                        } else {
                                            console.log("Success");
                                            if (i == csvPotData.length - 1) {
                                                requirementsSavedflags[2] = true;
                                                callback();
                                            }

                                        }
                                    })

                            }

                        }
                    })
                }
            } catch (err) {
                if (err === BAD_CSV_FORMAT)
                    if (retry)
                        createPotasiumReqs(csvPot, cropName, ',', insertCrop, false);
                    else {
                        errors.push(timeError("Could not save potasium requirements, bad csv format."));
                        let processing = document.querySelector('.processing');
                        let processorText = document.querySelector('#processor-text');
                        processorText.innerText = "";
                        processing.style.display = "none";
                        dialog.showErrorBox("Could not save requirements, incompatible csv format.", err.toString());
                    }
                else {
                    errors.push(timeError("Could not save requirements."));
                }
            }

        })

}
//This function is called based on the fact that all nutrients have been loaded into the database.
function insertCrop() {

    let flags = requirementsSavedflags;
    if (flags[0] && flags[1] && flags[2]) {

        //To prevent repeating of insertion
        flags[0] = false;
        flags[1] = false;
        flags[2] = false;

        let cropName = document.querySelector('#cropname').value;
        let minimalSoilpH = parseFloat(document.querySelector('#pH1').value);
        let maximumSoilpH = parseFloat(document.querySelector('#pH2').value);

        //save crop to the database
        let cropPackage = {
            name: cropName,
            regular_top_dressing: 0,
            special_top_dressing: 0,
            lowest_pH: minimalSoilpH,
            highest_pH: maximumSoilpH
        }

        connection.query('INSERT INTO crop SET ?', cropPackage, function (err, results, fields) {
            if (err) {
                dialog.showErrorBox('Could not save crop.', err.toString());
                errors.push(timeError("Could not save crop."));
                throw err;
            } else {
                let processing = document.querySelector('.processing');
                let processorText = document.querySelector('#processor-text');
                processorText.innerText = "";
                processing.style.display = "none";
                counter = 0;
            }
        })


        let cropsSelect = document.getElementById('crops');
        cropsSelect.innerHTML = '';

        connection.query('SELECT * FROM crop', function (err, results, fields) {
            if (err) {
                dialog.showErrorBox('Could not load crops.', err.toString());
                errors.push(timeError("Could not load crops."));
                throw err;
            }
            else {

                for (const result of results) {
                    var option = document.createElement('option');
                    option.innerText = result.name;
                    option.value = result.id;
                    cropsSelect.appendChild(option);
                }
                cropsSelect.dispatchEvent(updateCrops);
            }
        })

    } else {
        console.log("Not yet ready");
        //while not yet ready, display a nice animatio
        let processing = document.querySelector('.processing');
        if (counter == 0)
            processing.style.display = "block";
        let processorText = document.querySelector('#processor-text');
        processorText.innerText = `Adding ${cropBeingAdded}`;
        counter += 1;
        if ((counter % 3) == 0) dots = "";


    }


}


//Function to save crop and it's nutrients requirements
function saveCrop(event) {
    event.preventDefault();
    let cropName = document.querySelector('#cropname').value;
    let minimalSoilpH = parseFloat(document.querySelector('#pH1').value);
    let maximumSoilpH = parseFloat(document.querySelector('#pH2').value);
    let csvNitro = document.querySelector('#csv-nitro').files;
    let csvPhos = document.querySelector('#csv-phos').files;
    let csvPot = document.querySelector('#csv-pot').files;

    //create table name
    cropBeingAdded = cropName;
    let tableName = cropName.replace(" ", "_");
    //create requirements
    createNitrogenReqs(csvNitro, tableName, ';', insertCrop, true);
    createPhosphorusReqs(csvPhos, tableName, ';', insertCrop, true);
    createPotasiumReqs(csvPot, tableName, ';', insertCrop, true);



    //save the crop to the database

}


//view  all the crops in the database
function viewCrops() {
    let viewCropsView = document.querySelector('.crops-view');
    window.views.peek().style.display = 'none';
    viewCropsView.style.display = 'block';
    let backButton = document.querySelector('#back');
    backButton.style.display = 'inline-block';
    let dashboard = document.querySelector('#dashboard');
    window.views.push(dashboard);
    window.views.push(viewCropsView);
    //Remove last load rows
    let records = document.querySelectorAll('.crops-view table .record');
            for (let i = 0; i < records.length; i++)
                records[i].remove();

    let cropTable = document.querySelector('.crops-view table');
    connection.query('SELECT * FROM crop', function (err, results, fields) {
        if (err) {
            statusReport.innerText = 'Status: Could not load crops';
            errors.push(timeError("Could not load crops."));
            throw err;
        }
        else {
            statusReport.innerText = 'Status: Ok';
            for (const crop of results) {
                let record = document.createElement('tr');
                record.className = 'record';
                record.id = `record${crop.id}`;
                let cropName = document.createElement('td');
                cropName.innerText = crop.name;

                let cropId = document.createElement('td');
                cropId.innerText = crop.id;
                let viewCropDetailButton = document.createElement('button');
                viewCropDetailButton.innerText = 'Details';
                viewCropDetailButton.addEventListener('click', function () {
                    viewCropDetails(crop.id);
                })
                let deleteCropButton = document.createElement('button');
                deleteCropButton.innerText = 'Delete';
                deleteCropButton.addEventListener('click', function () {
                    deleteCrop(crop);
                })
                let viewCropControls = document.createElement('td');
                viewCropControls.appendChild(viewCropDetailButton);
                viewCropControls.appendChild(deleteCropButton)

                //record.appendChild(cropId);
                record.appendChild(cropName);
                record.appendChild(viewCropControls);
                cropTable.appendChild(record);

            }
        }
    })
}

//Delete crop from the database
function deleteCrop(crop) {
    let tableName = crop.name.replace(" ", "_");
    let sqlStatement1 = `DELETE FROM crop_has_lab_results WHERE crop_id = ${crop.id}`;
    let sqlStatement2 = `DELETE FROM crop WHERE id = ${crop.id}`;
    let sqlStatement3 = `DROP TABLE ${tableName}_k_map, ${tableName}_p_map, ${tableName}_n_map`;

    connection.query(sqlStatement1, function (err, results) {
        if (err) {
            errors.push(timeError("Could not delete unlink crop from the lab results."));
            statusReport.innerText = 'Status: Could not delete crop.';
            throw err;
        } else {
            connection.query(sqlStatement2, function (err, results) {
                if (err) {
                    errors.push(timeError("Could not delete crop from the database."));
                    statusReport.innerText = "Status: Could not delete crop.";
                    throw err;
                } else {
                    //now delete the crop requirements tables
                    connection.query(sqlStatement3, function (err, results) {
                        if (err) {

                            errors.push(timeError("Could not delete crop requirements tables."));
                            statusReport.innerText = "Status: Could not delete crop requirements tables.";
                            throw err;
                        } else {
                            let deletedRecord = document.querySelector(`#record${crop.id}`);
                            deletedRecord.remove();
                        }
                    })

                }
            });
        }
    });
}
//Edit crop
/*
function editCrop(crop) {
    let cropTablesName = crop.name.replace(" ", "_");
    let nitrogenTable = `${cropTablesName}_n_map`;
    let phosphorusTable = `${cropTablesName}_p_map`;
    let potasiumTable = `${cropTablesName}_k_map`;
    //delete all requirements of the crop and add new.

}
*/

//Wrapper function for the update function, it's job is to delete the old nutrient requirements.
function updateRequirements(tableName, callback, csvFile, which, delim, id) {
    let sql = `DELETE FROM ${tableName}`;
    connection.query(sql, function (err, results, fields) {
        if (err) {
            errors.push(timeError(ERR_DELETING_REQUIREMENTS));
        } else {
            callback(tableName, csvFile, which, delim, id, true);
        }
    });
}
//Function for updating requirements, it takes in tableName, callback, csvFile, which, delim, id
//tableName: The name of the table we want to insert the requirements loaded from the csv.
//callback: The callback function that is executed after deleting old crop requirements.
//csvFile: The csvFile to load nutrients requirements from.
//which: The nutrient that will be updated with new values.
//delim: The delimiter used in csv file, accepted types are ';' and ','.
//id: The id from the crop that is going to be updated with new requirements, this is for refreshing view after adding the crop.
function update(tableName, csvFile, which, delim, id, retry) {
    let csvData = [];
    fs.createReadStream(csvFile.path)
        .pipe(
            parse({
                delimiter: delim
            }, function (err) {
                if (err) {
                    errors.push(timeError("Error reading potasium csv file."));
                    dialog.showErrorBox("Error reading potasium csv file.", err.toString());
                }

            })
        ).on('data', function (dataRow) {
            csvData.push(dataRow);
        }).on('end', function () {
            switch (which) {
                case "nitrogen":
                    try {
                        let headings = csvData[0];
                        //Check if all the required fields to insert data in the table are available.
                        if ((headings[0] !== "ppm" || headings[1] !== "min" || headings[2] !== "max")
                            && (headings[0] !== "min_ppm" || headings[1] !== "max_ppm" || headings[2] !== "min"
                                || headings[3] !== "max")
                        )
                            throw BAD_CSV_FORMAT;
                        //just go forward and insert the  data
                        let processing = document.querySelector('.processing');
                        let processorText = document.querySelector('#processor-text');
                        processorText.innerText = "Updating nitrogen requirements";
                        processing.style.display = "block";
                        for (let i = 1; i < csvData.length; i++) {
                            //create data based on the headings structures
                            let data = {};
                            if (headings[0] === "ppm") {
                                data.ppm = csvData[i][0];
                                data.min = csvData[i][1];
                                data.max = csvData[i][2];
                            } else {
                                data.min_ppm = csvData[i][0];
                                data.max_ppm = csvData[i][1];
                                data.min_kg = csvData[i][2];
                                data.max_kg = csvData[i][3];
                            }
                            let sqlQuery = `INSERT INTO ${tableName} SET ?`;
                            connection.query(sqlQuery, data, function (err, results, fields) {
                                if (err) {
                                    if (i == csvData.length - 1) {
                                        errors.push(timeError(formatError(F_ERR_SAVING_REQUIREMENTS, "nitrogen")));
                                        let processing = document.querySelector('.processing');
                                        let processorText = document.querySelector('#processor-text');
                                        processorText.innerText = "";
                                        processing.style.display = "none";
                                        dialog.showErrorBox("Error", "The csv file you are using is not of the right format."
                                            + "There must be some missing columns in the csv file you selected.");
                                        viewCropDetails(id);
                                    }

                                } else {
                                    if (i == csvData.length - 1) {
                                        let processing = document.querySelector('.processing');
                                        let processorText = document.querySelector('#processor-text');
                                        processorText.innerText = "";
                                        processing.style.display = "none";
                                        let options = {
                                            type: "info",
                                            title: "Updated successfully.",
                                            message: "Successfully updated nitrogen requirements.",
                                            detail: "Nitrogen requirements have been updated.",
                                        }
                                        dialog.showMessageBox(remote.getCurrentWindow(), options);
                                        viewCropDetails(id);
                                    }
                                }
                            })
                        }
                    } catch (err) {
                        if (err === BAD_CSV_FORMAT) {
                            if (retry)
                                update(tableName, csvFile, "nitrogen", ',', id, false);
                            else {
                                errors.push("Could not update requirements, bad csv format.");
                                let processing = document.querySelector('.processing');
                                let processorText = document.querySelector('#processor-text');
                                processorText.innerText = "";
                                processing.style.display = "none";
                                dialog.showErrorBox("Error", "Could not update requirements, incompatible csv format.");
                                viewCropDetails(id);
                            }
                        } else {
                            errors.push(timeError("Could not read csv file."));
                            dialog.showErrorBox("Error", "Could not update requirements: " + err.toString());
                            viewCropDetails(id);
                        }
                    }
                    break;
                case "phosphorus":
                    try {
                        let headings = csvData[0];
                        //Check if all the required fields to insert data in the table are available.
                        if ((headings[0] !== "ppm" || headings[1] !== "min" || headings[2] !== "max")
                            && (headings[0] !== "min_ppm" || headings[1] !== "max_ppm" || headings[2] !== "min"
                                || headings[3] !== "max")
                        )
                            throw BAD_CSV_FORMAT;
                        let processing = document.querySelector('.processing');
                        let processorText = document.querySelector('#processor-text');
                        processorText.innerText = "Updating phosphorus requirements";
                        processing.style.display = "block";
                        //just go forward and insert the  data
                        for (let i = 1; i < csvData.length; i++) {
                            //create data based on the headings structures
                            let data = {};
                            if (headings[0] === "ppm") {
                                data.ppm = csvData[i][0];
                                data.min = csvData[i][1];
                                data.max = csvData[i][2];
                            } else {
                                data.min_ppm = csvData[i][0];
                                data.max_ppm = csvData[i][1];
                                data.min_kg = csvData[i][2];
                                data.max_kg = csvData[i][3];
                            }
                            let sqlQuery = `INSERT INTO ${tableName} SET ?`;
                            connection.query(sqlQuery, data, function (err, results, fields) {
                                if (err) {
                                    if (i == csvData.length - 1) {
                                        errors.push(timeError(formatError(F_ERR_SAVING_REQUIREMENTS, "phosphorus")));
                                        let processing = document.querySelector('.processing');
                                        let processorText = document.querySelector('#processor-text');
                                        processorText.innerText = "";
                                        processing.style.display = "none";
                                        dialog.showErrorBox("Error", "The csv file you are using is not of the right format."
                                            + "There must be some missing columns in the csv file you selected.");
                                        viewCropDetails(id);
                                    }
                                } else {
                                    console.log("success");
                                    if (i == csvData.length - 1) {
                                        let processing = document.querySelector('.processing');
                                        let processorText = document.querySelector('#processor-text');
                                        processorText.innerText = "";
                                        processing.style.display = "none";
                                        let options = {
                                            type: "info",
                                            title: "Updated successfully.",
                                            message: "Successfully updated phosphorus requirements.",
                                            detail: "Phosphorus requirements have been updated.",
                                        }
                                        dialog.showMessageBox(remote.getCurrentWindow(), options);
                                        viewCropDetails(id);
                                    }
                                }
                            })
                        }

                    } catch (err) {
                        if (err === BAD_CSV_FORMAT) {
                            if (retry)
                                update(tableName, csvFile, "phosphorus", ',', id, false);
                            else {
                                errors.push(timeError("Could not update requirements, bad csv format."));
                                let processing = document.querySelector('.processing');
                                let processorText = document.querySelector('#processor-text');
                                processorText.innerText = "";
                                processing.style.display = "none";
                                dialog.showErrorBox("Error", "Could not update requirements, incompatible csv format");
                                viewCropDetails(id);
                            }
                        } else {
                            errors.push(timeError("Could not read csv file"));
                            dialog.showErrorBox("Error", "Could not update requirements: " + err.toString());
                            viewCropDetails(id);
                        }
                    }
                    break;
                case "potasium":
                    try {
                        let headings = csvData[0];
                        //Check if all the required fields to insert data in the table are available.
                        if ((headings[0] !== "texture" || headings[1] !== "percentage" ||
                            headings[2] !== "min" || headings[3] !== "max")
                            && (headings[0] !== "texture" || headings[1] !== "min_percentage"
                                || headings[2] !== "max_percentage" || headings[3] !== "min"
                                || headings[4] !== "max")
                        )
                            throw BAD_CSV_FORMAT;
                        let processing = document.querySelector('.processing');
                        let processorText = document.querySelector('#processor-text');
                        processorText.innerText = "Updating potasium requirements";
                        processing.style.display = "block";
                        //just go forward and insert the  data
                        for (let i = 1; i < csvData.length; i++) {
                            //create data based on the headings structures
                            let data = {};
                            if (headings[1] === "percentage") {
                                data.texture = csvData[i][0];
                                data.percentage = csvData[i][1];
                                data.min = csvData[i][2];
                                data.max = csvData[i][3];
                            } else {
                                data.texture = csvData[i][0];
                                data.min_percentage = csvData[i][1];
                                data.max_percentage = csvData[i][2];
                                data.min_kg = csvData[i][3];
                                data.max_kg = csvData[i][4];
                            }
                            let sqlQuery = `INSERT INTO ${tableName} SET ?`;
                            connection.query(sqlQuery, data, function (err, results, fields) {
                                if (err) {
                                    if (i == csvData.length - 1) {
                                        errors.push(timeError(formatError(F_ERR_SAVING_REQUIREMENTS, "potasium")));
                                        let processing = document.querySelector('.processing');
                                        let processorText = document.querySelector('#processor-text');
                                        processorText.innerText = "";
                                        processing.style.display = "none";
                                        dialog.showErrorBox("Error", "The csv file you are using is not of the right format."
                                            + "There must be some missing columns in the csv file you selected.");
                                        viewCropDetails(id);
                                    }
                                } else {
                                    if (i == csvData.length - 1) {
                                        let processing = document.querySelector('.processing');
                                        let processorText = document.querySelector('#processor-text');
                                        processorText.innerText = "";
                                        processing.style.display = "none";
                                        let options = {
                                            type: "info",
                                            title: "Updated successfully.",
                                            message: "Successfully updated potasium requirements.",
                                            detail: "Potasium requirements have been updated.",
                                        }
                                        dialog.showMessageBox(remote.getCurrentWindow(), options);
                                        viewCropDetails(id);
                                    }
                                }
                            })
                        }
                    } catch (err) {
                        if (err === BAD_CSV_FORMAT) {
                            if (retry)
                                update(tableName, csvFile, "potasium", ',', id, false);
                            else {
                                errors.push(timeError("Could not update requirements, bad csv format"));
                                let processing = document.querySelector('.processing');
                                let processorText = document.querySelector('#processor-text');
                                processorText.innerText = "";
                                processing.style.display = "none";
                                dialog.showErrorBox("Error", "Could not update requirements, incompatible csv format.");
                                viewCropDetails(id);
                            }
                        } else {
                            errors.push(timeError("Could not update requirments"));
                            dialog.showErrorBox("Error", "Could not update requirements: " + err.toString());
                            viewCropDetails(id);
                        }
                    }
                    break;
            }
        })
}

//The code for closing the side panel opened when updating crop requirements
let closeSidePanel = document.querySelector('#close-side-panel');

function closeUpdateRequirementsPanel() {
    let updateReqsPanel = document.querySelector("#update-requirements");
    updateReqsPanel.style.display = "none";
    let mainContent = document.querySelector(".content");
    mainContent.style.width = `95%`;
    mainContent.style.margin = 'auto';
}

closeSidePanel.addEventListener('click', closeUpdateRequirementsPanel);
//View individual crop details.
function viewCropDetails(id) {
    let viewCropDetail = document.querySelector('.crop-details');
    window.views.peek().style.display = 'none';
    viewCropDetail.style.display = 'block';
    let backButton = document.querySelector('#back');
    backButton.style.display = 'inline-block';
    window.views.push(viewCropDetail);
    let sql = `SELECT * FROM crop WHERE id = ${id}`;
    connection.query(sql, function (err, results, fields) {
        if (err) {
            statusReport.innerText = 'Status: Could not load crop';
            errors.push(timeError(ERR_LOADING_CROP));
            throw err;
        } else {
            let crop = results[0];
            const crop_id = crop.id;
            let tableName = crop.name.replace(" ", "_");
            let ntablesql = `SELECT * FROM ${tableName}_n_map`;
            let ptablesql = `SELECT * FROM ${tableName}_p_map`;
            let ktablesql = `SELECT * FROM ${tableName}_k_map`;
            let cropNameView = document.querySelector("#cname");
            let lowest_pHText = document.querySelector("#clowest-ph");
            let highest_pHText = document.querySelector('#chighest-ph');
            let nitrogenReqsUpdateButton = document.querySelector("#update-nitro");
            let phosphorusReqsUpdateButton = document.querySelector("#update-phos");
            let potasiumReqsUpdateButton = document.querySelector("#update-pot");
            nitrogenReqsUpdateButton.addEventListener('click', function () {
                //work all the magic in here
                let updateReqsPanel = document.querySelector("#update-requirements");
                updateReqsPanel.style.display = "block";
                document.querySelector("#label-me-heading").innerText = `Update nitrogen requirements for ${crop.name} .`;
                document.querySelector("#label-me").innerText = "CSV file with nitrogen requirements.";

                let mainContent = document.querySelector(".content");
                mainContent.style.width = `70%`;
                mainContent.style.marginLeft = `30%`;
                let ntable = `${tableName}_n_map`;
                //now insert new requirements from the csv using the onclick handler.
                let updateReqsForm = document.querySelector("#update-requirements form");
                updateReqsForm.onsubmit = function (event) {
                    event.preventDefault();
                    //do the dancing
                    let options = {
                        type: "question",
                        title: "Confirm update",
                        buttons: ["Yes", "No"],
                        message: "You are now updating requirements. Changes cannot be reverted."
                    };
                    let response = dialog.showMessageBox(remote.getCurrentWindow(), options);
                    response.then(result =>{
                        switch(result.response){
                            case 0:
                                let files = document.querySelector("#csv-requirement").files;
                                let csvFile = files['0'];
                                updateRequirements(ntable, update, csvFile, "nitrogen", ";", crop_id);
                                break;  
                        }
                    })
                    
                }
            });



            phosphorusReqsUpdateButton.addEventListener('click', function () {
                //work all the magic in here
                let updateReqsPanel = document.querySelector("#update-requirements");
                updateReqsPanel.style.display = "block";
                document.querySelector("#label-me-heading").innerText = `Update phoshorus requirements for ${crop.name}.`;
                document.querySelector("#label-me").innerText = "CSV file with phosphorus requirements.";

                let mainContent = document.querySelector(".content");
                mainContent.style.width = `70%`;
                mainContent.style.marginLeft = `30%`;
                let ptable = `${tableName}_p_map`;
                //now insert new requirements from the csv using the onclick handler.
                let updateReqsForm = document.querySelector("#update-requirements form");
                updateReqsForm.onsubmit = function (event) {
                    event.preventDefault();
                    //do the dancing
                    let options = {
                        type: "question",
                        title: "Confirm update",
                        buttons: ["Yes", "No"],
                        message: "You are now updating requirements. Changes cannot be reverted?"
                    };
                    let response = dialog.showMessageBox(remote.getCurrentWindow(), options);
                    response.then(result =>{
                        switch(result.response){
                            case 0:
                                let files = document.querySelector("#csv-requirement").files;
                                let csvFile = files['0'];
                                updateRequirements(ptable, update, csvFile, "phosphorus", ";", crop_id);
                                break;  
                        }
                    })
                }
            });

            potasiumReqsUpdateButton.addEventListener('click', function () {
                //work all the magic in here
                let updateReqsPanel = document.querySelector("#update-requirements");
                updateReqsPanel.style.display = "block";
                document.querySelector("#label-me-heading").innerText = `Update potasium requirements for ${crop.name}.`;
                document.querySelector("#label-me").innerText = "CSV file with potasium requirements.";

                let mainContent = document.querySelector(".content");
                mainContent.style.width = `70%`;
                mainContent.style.marginLeft = `30%`;
                let ktable = `${tableName}_k_map`;
                let updateReqsForm = document.querySelector("#update-requirements form");

                updateReqsForm.onsubmit = function (event) {
                    event.preventDefault();
                    //do the dancing
                    let options = {
                        type: "question",
                        title: "Confirm update",
                        buttons: ["Yes", "No"],
                        message: "You are now updating requirements. Changes cannot be reverted?"
                    };
                    let response = dialog.showMessageBox(remote.getCurrentWindow(), options);
                    response.then(result =>{
                        
                        switch(result.response){
                            case 0:
                                let files = document.querySelector("#csv-requirement").files;
                                let csvFile = files['0'];
                                updateRequirements(ktable, update, csvFile, "potasium", ";", crop_id);
                                break;  
                        }
                    })
                }
            });

            let nitrogenRequirementsTable = document.querySelector('#nitrogen-reqs table');
            nitrogenRequirementsTable.innerHTML = '';
            let phosphorusRequirementsTable = document.querySelector('#phosphorus-reqs table');
            phosphorusRequirementsTable.innerHTML = '';
            let potasiumRequirementsTable = document.querySelector('#potasium-reqs table');
            potasiumRequirementsTable.innerHTML = '';

            cropNameView.innerText = crop.name;


            lowest_pHText.innerHTML = `<b>Lowest optimum pH</b>: ${crop.lowest_pH}`;
            highest_pHText.innerHTML = `<b>Highest optimum pH</b>: ${crop.highest_pH}`;

            //SQL statements for querying the requirements.

            //fire! 
            connection.query(ntablesql, function (err, results, fields) {
                if (err) {
                    statusReport.innerText = `Status: Could not nitrogen requirements for ${crop.name}.`;
                    errors.push(timeError(`Status: Could not nitrogen requirements for ${crop.name}.`));
                    throw err;
                } else {
                    if (results[0].ppm) {
                        let headRow = document.createElement('tr');
                        let ppm = document.createElement('th');
                        ppm.innerText = 'Parts per million';
                        let min = document.createElement('th');
                        min.innerText = 'Minimum kg(s)';
                        let max = document.createElement('th');
                        max.innerText = 'Maximum kg(s)';
                        headRow.appendChild(ppm);
                        headRow.appendChild(min);
                        headRow.appendChild(max);
                        nitrogenRequirementsTable.appendChild(headRow);
                        //now loop through the results and update
                        for (const req of results) {
                            let row = document.createElement('tr');
                            row.innerHTML = `<td>${req.ppm}</td><td>${req.min}</td><td>${req.max}</td>`;
                            nitrogenRequirementsTable.appendChild(row);
                        }
                    } else {
                        let headRow = document.createElement('tr');
                        let min_ppm = document.createElement('th');
                        min_ppm.innerText = 'Parts per million minimum';
                        let max_ppm = document.createElement('th');
                        max_ppm.innerText = 'Parts per million maximum';
                        let min = document.createElement('th');
                        min.innerText = 'Minimum kg(s)';
                        let max = document.createElement('th');
                        max.innerText = 'Maximum kg(s)';
                        headRow.appendChild(min_ppm)
                        headRow.appendChild(max_ppm);
                        headRow.appendChild(min);
                        headRow.appendChild(max);
                        nitrogenRequirementsTable.appendChild(headRow);
                        //now loop through the results and update
                        for (const req of results) {
                            let row = document.createElement('tr');
                            row.innerHTML = `<td>${req.min_ppm}</td><td>${req.max_ppm}</td><td>${req.min_kg}</td><td>${req.max_kg}</td>`;
                            nitrogenRequirementsTable.appendChild(row);
                        }
                    }
                }
            })
            //fire! 
            connection.query(ptablesql, function (err, results, fields) {
                if (err) {
                    statusReport.innerText = `Status: Could not phosphorus requirements for ${crop.name}`;
                    errors.push(timeError(`Status: Could not phosphorus requirements for ${crop.name}`));
                    throw err;
                } else {
                    if (results[0].ppm) {
                        let headRow = document.createElement('tr');
                        let ppm = document.createElement('th');
                        ppm.innerText = 'Parts per million';
                        let min = document.createElement('th');
                        min.innerText = 'Minimum kg(s)';
                        let max = document.createElement('th');
                        max.innerText = 'Maximum kg(s)';
                        headRow.appendChild(ppm);
                        headRow.appendChild(min);
                        headRow.appendChild(max);
                        phosphorusRequirementsTable.appendChild(headRow);
                        //now loop through the results and update
                        for (const req of results) {
                            let row = document.createElement('tr');
                            row.innerHTML = `<td>${req.ppm}</td><td>${req.min}</td><td>${req.max}</td>`;
                            phosphorusRequirementsTable.appendChild(row);
                        }
                    } else {
                        let headRow = document.createElement('tr');
                        let min_ppm = document.createElement('th');
                        min_ppm.innerText = 'Parts per million minimum';
                        let max_ppm = document.createElement('th');
                        max_ppm.innerText = 'Parts per million maximum';
                        let min = document.createElement('th');
                        min.innerText = 'Minimum kg(s)';
                        let max = document.createElement('th');
                        max.innerText = 'Maximum kg(s)';
                        headRow.appendChild(min_ppm);
                        headRow.appendChild(max_ppm);
                        headRow.appendChild(min);
                        headRow.appendChild(max);
                        phosphorusRequirementsTable.appendChild(headRow);
                        //now loop through the results and update
                        for (const req of results) {
                            let row = document.createElement('tr');
                            row.innerHTML = `<td>${req.min_ppm}</td><td>${req.max_ppm}</td><td>${req.min_kg}</td><td>${req.max_kg}</td>`;
                            phosphorusRequirementsTable.appendChild(row);
                        }
                    }
                }
            })

            //fire! 
            connection.query(ktablesql, function (err, results, fields) {
                if (err) {
                    statusReport.innerText = `Status: Could not potasium requirements for ${crop.name}.`;
                    errors.push(timeError(`Status: Could not potasium requirements for ${crop.name}.`));
                    throw err;
                } else {

                    if (results[0].percentage != undefined) {

                        let headRow = document.createElement('tr');
                        let texture = document.createElement('th');
                        texture.innerText = 'Texture';
                        let ppm = document.createElement('th');
                        ppm.innerText = 'Percentage';
                        let min = document.createElement('th');
                        min.innerText = 'Minimum kg(s)';
                        let max = document.createElement('th');
                        max.innerText = 'Maximum kg(s)';
                        headRow.appendChild(texture);
                        headRow.appendChild(ppm);
                        headRow.appendChild(min);
                        headRow.appendChild(max);
                        potasiumRequirementsTable.appendChild(headRow);
                        //now loop through the results and update
                        for (const req of results) {
                            let row = document.createElement('tr');
                            row.innerHTML = `<td>${req.texture}</td><td>${req.percentage}</td><td>${req.min}</td><td>${req.max}</td>`;
                            potasiumRequirementsTable.appendChild(row);
                        }
                    } else {
                        let headRow = document.createElement('tr');
                        let texture = document.createElement('th');
                        texture.innerText = 'Texture';
                        let min_ppm = document.createElement('th');
                        min_ppm.innerText = 'Percentage minimum';
                        let max_ppm = document.createElement('th');
                        max_ppm.innerText = 'Percentage maximum';
                        let min = document.createElement('th');
                        min.innerText = 'Minimum kg(s)';
                        let max = document.createElement('th');
                        max.innerText = 'Maximum kg(s)';
                        headRow.appendChild(texture);
                        headRow.appendChild(min_ppm);
                        headRow.appendChild(max_ppm);
                        headRow.appendChild(min);
                        headRow.appendChild(max);
                        potasiumRequirementsTable.appendChild(headRow);
                        //now loop through the results and update
                        for (const req of results) {
                            let row = document.createElement('tr');
                            row.innerHTML = `<td>${req.texture}</td><td>${req.min_percentage}</td><td>${req.max_percentage}</td><td>${req.min_kg}</td><td>${req.max_kg}</td>`;
                            potasiumRequirementsTable.appendChild(row);
                        }
                    }
                }
            })
        }
    });
}


