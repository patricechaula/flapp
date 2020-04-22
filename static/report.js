const mysql = require('mysql');
const electron = require('electron');
const remote = electron.remote;
const dialog = remote.dialog;
const ipc = require('electron').ipcRenderer;
var mpack;

ipc.on('pdf-data', function (event, data) {
    console.log(data);
})



ipc.on('successful', function(event){
    let userInterface = document.querySelector('#user-interface');
    userInterface.style.display = 'block';
});

ipc.on('error', function (event, error) {
    let userInterface = document.querySelector('#user-interface');
    userInterface.style.display = 'block';
    alert(error.toString() + ": Could not write file.");
})


ipc.on('o-package', function (event, pack) {
    console.log(pack);
    mpack = pack;
    //now let's construct our pdf
    let pdfDocument = document.querySelector('#report');
    let dateField = document.querySelector('#date');
    let date = new Date().toDateString();
    dateField.innerText = date;

    let nameField = document.querySelector('#name');
    nameField.innerHTML = `<b>Attention:</b><span> ${pack.results.name}</span>`;


    //do the table 
    let row = document.createElement('tr');
    let ref = document.createElement('td');
    ref.style.border = '1px solid black';
    ref.style.padding = '10px';
    ref.innerText = pack.results.ref;
    row.appendChild(ref);
    //color
    let color = document.createElement('td');
    color.style.border = '1px solid black';
    color.style.padding = '10px';
    color.innerText = pack.results.color;
    row.appendChild(color);
    //texture
    let texture = document.createElement('td');
    texture.style.border = '1px solid black';
    texture.style.padding = '10px';
    texture.innerText = pack.results.texture;
    row.appendChild(texture);
    //pH
    let pH = document.createElement('td');
    pH.style.border = '1px solid black';
    pH.style.padding = '10px';
    pH.innerText = pack.results.pH;
    row.appendChild(pH);
    //Nitronit
    let nitroInit = document.createElement('td');
    nitroInit.style.border = '1px solid black';
    nitroInit.style.padding = '10px';
    nitroInit.innerText = pack.results.nitrogen;
    row.appendChild(nitroInit);
    //Nitrocub
    let nitroIncub = document.createElement('td');
    nitroIncub.style.border = '1px solid black';
    nitroIncub.style.padding = '10px';
    nitroIncub.innerText = pack.results.m_nitrogen_init;
    row.appendChild(nitroIncub);
    //phosphorus
    let phosphorus = document.createElement('td');
    phosphorus.style.border = '1px solid black';
    phosphorus.style.padding = '10px';
    phosphorus.innerText = pack.results.phosphorus;
    row.appendChild(phosphorus);
    //potasium
    let potasium = document.createElement('td');
    potasium.style.border = '1px solid black';
    potasium.style.padding = '10px';
    potasium.innerText = pack.results.potasium;
    row.appendChild(potasium);
    //calcium
    let calcium = document.createElement('td');
    calcium.style.border = '1px solid black';
    calcium.style.padding = '10px';
    calcium.innerText = pack.results.calcium;
    row.appendChild(calcium);
    //magnesium
    let magnesium = document.createElement('td');
    magnesium.style.border = '1px solid black';
    magnesium.style.padding = '10px';
    magnesium.innerText = pack.results.magnesium;
    row.appendChild(magnesium);
    //table
    let table = document.querySelector('#results-table');
    table.appendChild(row);
    let description = "";
    let description2 = "";

    var dict = {
        "S": "sand",
        "L": "loam",
        "LSa": "loamy sand",
        "Si": "silty",
        "C": "clay",
        "SaC": "sandy clay",
        "SaCL": "sandy clay loam",
        "SaL": "sandy loam"
    }

    description2 = dict[pack.results.texture];
    switch (pack.results.texture) {
        case 'Si':
        case 'S':
        case 'LSa':
            description = 'light';
            break;
        case 'L':
        case 'SaC':
        case 'SaL':
        case 'SaCL':
            description = 'medium';
            break;
        case 'C':
            description = 'heavy';
            break;

    }
    let pHDescription = "";
    let extratext = "Crop production on this soil might be limited by ";
    let soilpH = pack.results.pH;
    if (soilpH <= 7.5 && soilpH >= 6.5) {
        pHDescription = 'strongly alkaline';
        extratext += "soil alkanlity ";
    }
    if (soilpH <= 6.4 && soilpH >= 6.0) {
        //Nuetral
        pHDescription = 'nuetral';
    }
    if (soilpH <= 5.9 && soilpH >= 5.5) {
        //Slightly acidic
        pHDescription = 'slightly acidic';
    }
    if (soilpH <= 5.4 && soilpH >= 5.0) {
        //Medium acid
        pHDescription = 'medium acidic';
    }
    if (soilpH <= 4.9 && soilpH >= 4.5) {
        //Strongly acidic
        pHDescription = 'strongly acidic';
        extratext += 'soil acidity ';
    }
    if (soilpH < 4.5) {
        //Very strongly acidic
        pHDescription = 'very strongly acidic';
        extratext += 'soil acidity ';
    }

    if (pack.results.phosphorus < 16) {
        extratext += 'and deficiency of phosphorus ';
    }

    if (pack.results.nitrogen < 15) {
        extratext += 'and deficiency of nitrogen ';
    }
    let soilDescription = `The soil is ${description} soil (${description2}), ${pHDescription}. ${pack.recommendation.text4}`;
    let describer = document.querySelector('#description');
    describer.innerText = soilDescription;

    let applicationsTable = document.querySelector('#applications');
    let phosphorusFertilizer = pack.recommendation.phosphorus_fertilizer;
    let nitrogenFertilizer = pack.recommendation.nitrogen_fertilizer;
    let potasiumFertilizer = pack.recommendation.potasium_fertilizer;

    //add the ref
    let values = document.querySelector('#appl-values');
    let myref = document.createElement('td');
    myref.innerText = pack.results.ref;
    values.appendChild(myref);
    //phosphorus fertilizer application
    if (!(phosphorusFertilizer.length == 0)) {
        //then add phosphorus fertilizer requirements
        let heading = document.createElement('th');
        heading.innerHTML = `<span>${phosphorusFertilizer}<br/> kg/ha</span>`;
        let headings = document.querySelector('#appl-headings');
        headings.appendChild(heading);
        //append the value
        let phosphorusRange = document.createElement('td');
        phosphorusRange.innerText = `${pack.recommendation.min_phosphorus} - ${pack.recommendation.max_phosphorus}`;
        values.appendChild(phosphorusRange);
    }
    //nitrogen fertilizer application
    if (!(nitrogenFertilizer.length == 0)) {
        //then add phosphorus fertilizer requirements
        let heading = document.createElement('th');
        heading.innerHTML = `<span>${nitrogenFertilizer} <br/> kg/ha</span>`;
        let headings = document.querySelector('#appl-headings');
        headings.appendChild(heading);
        //append the value
        let nitrogenRange = document.createElement('td');
        nitrogenRange.innerText = `${pack.recommendation.min_nitrogen} - ${pack.recommendation.max_nitrogen}`;
        values.appendChild(nitrogenRange);
    }
    //potasium fertilizer application
    if (!(potasiumFertilizer.length == 0)) {
        //then add phosphorus fertilizer requirements
        let heading = document.createElement('th');
        heading.innerHTML = `<span>${potasiumFertilizer}<br/> kg/ha</span>`;
        let headings = document.querySelector('#appl-headings');
        headings.appendChild(heading);
        //append the value
        let potasiumRange = document.createElement('td');
        potasiumRange.innerText = `${pack.recommendation.min_potasium} - ${pack.recommendation.max_potasium}`;
        values.appendChild(potasiumRange);
    }
    if (pack.recommendation.lime > 0) {
        //then add phosphorus fertilizer requirements
        let heading = document.createElement('th');
        heading.innerHTML = `<span>Lime<br/> kg/ha</span>`;
        let headings = document.querySelector('#appl-headings');
        headings.appendChild(heading);
        //append the value
        let lime = document.createElement('td');
        lime.innerText = `${pack.recommendation.lime}`;
        values.appendChild(lime);
    }


})

function printContents() {
    let userInterface = document.querySelector('#user-interface');
    userInterface.style.display = 'none';
    WIN = remote.getCurrentWindow();

    //options
    let options = {
        //Placeholder 1
        title: "Save PDF file",
        //Placeholder 2
        //defaultPath: app.getPath('documents'),
        buttonLabel: 'Save PDF',
        filters: [
            { name: 'Portable document format', extensions: ['pdf'] }
        ]
    }
    dialog.showSaveDialog(WIN, options).then(result => {
        if (!(result.filePath.length == 0))
            ipc.send('print-to-pdf', result.filePath);
        else{
            userInterface.style.display = 'block';
            console.log("File path empty");
        }
    })

}

function printToDocx(){
    let userInterface = document.querySelector('#user-interface');
    userInterface.style.display = 'none';
    WIN = remote.getCurrentWindow();
    let contents  = document.querySelector('#report');

    //options
    let options = {
        //Placeholder 1
        title: "Save DOCX file",
        //Placeholder 2
        //defaultPath: app.getPath('documents'),
        buttonLabel: 'Save Microsoft Word document',
        filters: [
            { name: 'Microsoft Word Document', extensions: ['docx'] }
        ]
    }
    dialog.showSaveDialog(WIN, options).then(result => {
        if (!(result.filePath.length == 0)){
            let data = {
                contents: contents,
                filePath: result.filePath,
                pack: mpack
            }
            ipc.send('save-to-docx', data);
        }
        else{
            userInterface.style.display = 'block';
            console.log("File path empty");
        }
    })
}

function printToText()
{
    let userInterface = document.querySelector('#user-interface');
    userInterface.style.display = 'none';
    WIN = remote.getCurrentWindow();

    //options
    let options = {
        //Placeholder 1
        title: "Save Text  file",
        //Placeholder 2
        //defaultPath: app.getPath('documents'),
        buttonLabel: 'Save Text file',
        filters: [
            { name: 'Text file', extensions: ['txt'] }
        ]
    }
    dialog.showSaveDialog(WIN, options).then(result => {
        if (!(result.filePath.length == 0)){
            let data = {
                pack: mpack,
                filePath: result.filePath
            }
            ipc.send('save-to-text',data);
        }
        else{
            userInterface.style.display = 'block';
            console.log("File path empty");
        }
    })
}
let expanded = false;
document.addEventListener('DOMContentLoaded', function () {
    ipc.send('get-package');
    
})

