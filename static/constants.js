const FERTILIZERS = {
    "CC": { code: "CC", method: "Top dressing", name: "Compound C", nitrogen: 0.06, phosphorus: 0.15, potasium: 0.12 },
    "CD": { code: "CD", method: "Top dressing", name: "Compound D", nitrogen: 0.07, phosphorus: 0.14, potasium: 0.07 },
    "PB": { code: "PB", method: "Top dressing", name: "Potato blend", nitrogen: 0.08, phosphorus: 0.18, potasium: 0.24 },
    "AN": { code: "AN", method: "Top dressing", name: "Amonium nitrate", nitrogen: 0.345, phosphorus: 0, potasium: 0 },
    "U": { code: "U", method: "Top dressing", name: "Urea", nitrogen: 0.46, phosphorus: 0, potasium: 0 },
    "PN": { code: "PN", method: "Top dressing", name: "Potasium nitrate", nitrogen: 0.13, phosphorus: 0, potasium: 0.46 },
    "SP": { code: "SP", method: "Top dressing", name: "Super phosphate", nitrogen: 0, phosphorus: 0.5, potasium: 0 },
    "NULL": { code: "NULL", method: "Top dressing", name: "", nitrogen: 0, phosphorus: 0, potasium: 0 },
}

const COMPOUND_C = "CC";
const COMPOUND_D = "CD";
const POTATO_BLEND = "PB";
const AMONIUM_NITRATE = "AN";
const UREA = "U";
const POTASIUM_NITRATE = "PN";
const SUPER_PHOSPHATE = "SP";
const NULL_FERTILIZER = "NULL";


//Errors
const ERR_CONNECTING = "Could not connect to database.";
const MYSQL_SERVER_NOT_READY = "Mysql server not ready.";
const ERR_OFFLINE = "Database connection not available.";
const ERR_LOST_CONNECTION = "Lost connection to the database.";
const ERR_ENQUEQUE = "An error occured.";
const ERR_LOADING_CROPS = "Could not load crops.";
const ERR_LOADING_CROP = "Could not load crop";
const ERR_SAVING_CROP = "Could not save crop.";
const F_ERR_SAVING_REQUIREMENTS = "Could not save @f requirements.";
const F_ERR_LOADING_REQUIREMENTS = "Could not load @f requiremnts."
const ERR_LOADING_DATA = "Could not load data.";
const ERR_SAVING_DATA = "Could not save data.";
const ERR_LOADING_RECOMMENDATION = "Could not load recommendation.";
const ERR_SAVING_RECOMMENDATION = "Could not save recommendation.";
const F_ERR_TABLE_EXISTS = "@f already exist.";
const F_ERR_TABLE_DOES_NOT_EXIST = "@f does not exist.";
const ERR_DELETING_REQUIREMENTS = "Error deleting requirements.";


//get the fertilizers needed
function getFertilizers(requirements) {
    let fertilizers = [];
    let nitroReqs = requirements.nitrogen;
    let phosReqs = requirements.phosphorus;
    let potReqs = requirements.potasium;
    //now check first if potasium is needed
    if (potReqs.min_kg == 0 && potReqs.max_kg == 0) {
        fertilizers.push(FERTILIZERS[AMONIUM_NITRATE]); //nitrogen
        fertilizers.push(FERTILIZERS[SUPER_PHOSPHATE]); //phosphorus
        fertilizers.push(FERTILIZERS[NULL_FERTILIZER]); //potasium
    } else {
        fertilizers.push(FERTILIZERS[AMONIUM_NITRATE]);
        fertilizers.push(FERTILIZERS[COMPOUND_D]);
        fertilizers.push(FERTILIZERS[POTASIUM_NITRATE]);
    }
    return fertilizers;
}

//build errors
function timeError(error){
    let date = new Date();
    let str = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} -  ${error}`;
    return str;
}

function formatError(error, input){
    let str = error.replace("@f", input);
    return str;
}