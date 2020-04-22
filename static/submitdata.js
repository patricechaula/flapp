const form = document.querySelector('.add-new-data form');
form.addEventListener('submit', submitForm);
function submitForm(e) {
    e.preventDefault();
    //get the values
    let name = document.querySelector('#name').value;
    let ref = document.querySelector('#ref').value;
    let lab_number = document.querySelector('#lab_number').value;
    let color = document.querySelector('#color').value;
    let texture = document.querySelector('#texture').value;
    let pH = parseFloat(document.querySelector('#pH').value);
    let free_carbonate = document.querySelector('#free_carbonate').value;
    let conductivity = parseFloat(document.querySelector('#conductivity').value);
    let nitrogen = parseFloat(document.querySelector('#nitrogen').value);
    let mnitrogen = parseFloat(document.querySelector('#mnitrogen').value);
    let phosphorus = parseFloat(document.querySelector('#phosphorus').value);
    let calcium = parseFloat(document.querySelector('#calcium').value);
    let potasium = parseFloat(document.querySelector('#potasium').value);
    let magnesium = parseFloat(document.querySelector('#magnesium').value);

    let cropCode = parseInt(document.querySelector('#crops').value);
    console.log("My calcium", calcium);
    console.log("This is my potasium", potasium);
    let total_bases = magnesium + calcium + potasium;
    //Now save to the database
    var lab_results = {
        name: name,
        ref: ref,
        lab_number: lab_number,
        color: color,
        texture: texture,
        free_carbonate: free_carbonate,
        nitrogen: nitrogen,
        m_nitrogen_after: 0,
        m_nitrogen_init: mnitrogen,
        phosphorus: phosphorus,
        potasium: potasium,
        calcium: calcium,
        magnesium: magnesium,
        pH: pH,
        conductivity: conductivity,
        total_bases: total_bases,
    }

    
        



    let query = connection.query('INSERT INTO lab_results SET ?', lab_results, function (err, results, fields) {
        if (err) {
            statusReport.innerText = 'Status: Could not save lab data.';
            errors.push(timeError(err.code + ": Could not save lab data."));
            throw err;
        }
        else {
            //Now the data has been saved let's proceed
            //Also relate results to crop
            statusReport.innerText = 'Status: Ok';
            console.log(results);
            let id = results.insertId;
            crop_has_lab_results = {
                crop_id: cropCode,
                lab_results_id: results.insertId,
            }
            let query2 = connection.query('INSERT INTO crop_has_lab_results SET ?', crop_has_lab_results,
                function (err, results, fields) {
                    if (err) {
                        statusReport.innerText = 'Status: Could not establish relationship between crop and lab data.';
                        errors.push(timeError(err.code + ": Could not establish relationship between crop and lab data."));
                        throw err;
                    }
                    else {
                        statusReport.innerText = 'Status: Ok';
                        //find crop
                        let query3 = connection.query('SELECT * FROM crop WHERE id= ?', cropCode,
                            function (err, results, fields) {
                                if (err) {
                                    statusReport.innerText = 'Status: Could not get crop.';
                                    errors.push(timeError(err.code + ": Could not get crop."));
                                    throw err;
                                }
                                else {
                                    statusReport.innerText = 'Status: Ok';
                                    targetCrop = new Crop(results[0]);
                                    lab_results.id = id;
                                    let data = new Data(lab_results, targetCrop);
                                }
                            })
                    }
                });

        }
    })

}