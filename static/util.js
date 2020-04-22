const { Document, Packer, Paragraph, TextRun,
    Table, TableRow, TableCell, BorderStyle,
    WidthType, Media, HeadingLevel } = require('docx');


//Textures
const textures_map = {
    "S": "sand",
    "L": "loam",
    "LSa": "loamy sand",
    "Si": "silty",
    "C": "clay",
    "SaC": "sandy clay",
    "SaCL": "sandy clay loam",
    "SaL": "sandy loam"
}
//Colors
const colors_map = {
    "dR": "Dark red",
    "lR": "Light red",
    "PR": "Pale red",
    "sR": "Strong red",
    "wR": "Weak red",
    "duR": "Dusky red",
    "vR": "Very red",
    //Yellow
    "dY": "Dark yellow",
    "lY": "Light yellow",
    "PY": "Pale yellow",
    "sY": "Strong yellow",
    "wY": "Weak yellow",
    "duY": "Dusky yellow",
    "vY": "Very yellow",
    //Brown
    "dB": "Dark brown",
    "lB": "Light brown",
    "PB": "Pale brown",
    "sB": "Strong brown",
    "wB": "Weak brown",
    "duB": "Dusky brown",
    "vB": "Very brown",
    //Grey
    "dG": "Dark grey",
    "lG": "Light grey",
    "PG": "Pale grey",
    "sG": "Strong grey",
    "wG": "Weak grey",
    "duG": "Dusky grey",
    "vG": "Very grey",
    //White
    "W": "White",
    //Black
    "B": "Black",
    //Olive
    "dO": "Dark olive",
    "lO": "Light olive",
    "PO": "Pale olive",
    "sO": "Strong olive",
    "wO": "Weak olive",
    "duO": "Dusky olive",
    "vO": "Very olive",
}

//create a utility stack for managing views
//Stack class
class Stack {
    //Array is used to implement stack
    constructor() {
        this.items = []
    }
    //push
    push(element) {
        //push element into items
        this.items.push(element);
    }
    //pop function
    pop() {
        //return the top most element in the stack
        //and removes it from the stack
        //underflow if the stack is empty
        if (this.items.length == 0)
            return null;
        return this.items.pop();
    }

    peek() {
        return this.items[this.items.length - 1];
    }

    isEmpty() {
        //returns true if the stack is empty
        return this.items.length == 0;
    }

}

//Get description of a texture
function getTextureDescription(dictionary, texture) {
    let description;
    description = dictionary[texture];
    return description;
}
//get description of color
function getColorDescription(dictionary, color) {
    let description;
    description = dictionary[color];
    return description;
}

function getSoilWeight(texture) {
    let description;
    switch (texture) {
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
    return description;
}

function getpHDescription(value) {
    let soilpH = value;
    let pHDescription = "";
    if (soilpH <= 7.5 && soilpH >= 6.5) {
        pHDescription = 'strongly alkaline';
    }
    if (soilpH <= 6.4 && soilpH >= 6.0) {
        //Nuetral
        pHDescription = 'neutral';
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
    }
    if (soilpH < 4.5) {
        //Very strongly acidic
        pHDescription = 'very strongly acidic';
    }
    return pHDescription;
}

function buildHeader(image) {
    const table = new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE
        },
        borders: {
            left: BorderStyle.NONE,
            top: BorderStyle.NONE,
            right: BorderStyle.NONE
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({

                        children: [
                            new Paragraph({
                                text: "All communications will be addressed ",
                                style: "ordinary"
                            }),
                            new Paragraph({
                                text: "to",
                                style: "ordinary",
                            }),
                            new Paragraph({
                                style: "ordinary",
                                children: [
                                    new TextRun({
                                        text: "THE HEAD",
                                        bold: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                style: "ordinary",
                                children: [
                                    new TextRun({
                                        text: "Tel:",
                                        bold: true
                                    }),
                                    new TextRun({
                                        text: "263-4-70451-3"
                                    })
                                ]
                            }),
                            new Paragraph({
                                style: "ordinary",
                                children: [
                                    new TextRun({
                                        text: "Fax:",
                                        bold: true
                                    }),
                                    new TextRun({
                                        text: "(263-4) 733313"
                                    })
                                ]
                            }),
                            new Paragraph({
                                style: "ordinary",
                                children: [
                                    new TextRun({
                                        text: "Email:",
                                        bold: true
                                    }),
                                    new TextRun({
                                        text: "csrispss@mweb.co.zw"
                                    })
                                ]
                            })
                        ],
                        borders: {
                            right: {
                                style: BorderStyle.DASH_DOT_STROKED,
                                size: 10,
                                color: "white",
                            },
                            left: {
                                style: BorderStyle.DASH_DOT_STROKED,
                                size: 10,
                                color: "white",
                            },
                        },
                    }),
                    new TableCell({
                        borders: {
                            right: {
                                style: BorderStyle.DASH_DOT_STROKED,
                                size: 10,
                                color: "white",
                            },
                            left: {
                                style: BorderStyle.DASH_DOT_STROKED,
                                size: 10,
                                color: "white",
                            },
                        },
                        children: [new Paragraph(image)],
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                style: "ordinary",
                                children: [
                                    new TextRun({
                                        text: "RESEARCH SERVICES DIVISION",
                                        bold: true
                                    })
                                ]
                            }),

                            new Paragraph({
                                style: "ordinary",
                                children: [
                                    new TextRun({
                                        text: "CHEMISTRY & SOIL",
                                        bold: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                style: "ordinary",
                                children: [
                                    new TextRun({
                                        text: "RESEARCH INSTITUTE",
                                        bold: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                style: "ordinary",
                                children: [
                                    new TextRun({
                                        text: "Fifth Street extension",
                                        bold: true
                                    })
                                ]
                            }),
                        ]
                    })
                ],
            }),

        ]
    })
    return table;
}

function createResultsTable(results) {
    let myrows = [];

    headers = new TableRow({
        children: [
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: " Sample Ref ",

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: " Colour ",

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: " Texture ",

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: " pH ",

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: " Initial N (ppm) ",

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: " After Incub N (ppm) ",

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: " Available P ",

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: " Available K ",

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: " Ca ",

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [

                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: " Mg ",

                            })
                        ]
                    })
                ]
            }),

        ]
    });
    myrows.push(headers)
    myDataRow = new TableRow({
        children: [
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: `${results.ref}`,

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: `${results.color}`,

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                style: "ordinary",
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${results.texture}`,

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                style: "ordinary",
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${results.pH}`,

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                style: "ordinary",
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${results.nitrogen}`,

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: `${results.m_nitrogen_init}`,

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: `${results.phosphorus}`,

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: `${results.potasium}`,

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: `${results.calcium}`,

                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                children: [
                    new Paragraph({
                        style: "ordinary",
                        children: [
                            new TextRun({
                                text: `${results.magnesium}`,

                            })
                        ]
                    })
                ]
            }),

        ]
    });
    myrows.push(myDataRow);
    let resultsTable = new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE
        },
        rows: myrows,
    })
    return resultsTable;
}

function createRecommendationTable(recommendation) {
    let row;
    let headrow;
    let table;
    let rowChildren = [];
    let headrowChildren = [];

    let nitrogenFertilizer = recommendation.nitrogen_fertilizer;
    let nitrogen = `${recommendation.min_nitrogen} - ${recommendation.max_nitrogen}`;
    let phosphorusFertilizer = recommendation.phosphorus_fertilizer;
    let phosphorus = `${recommendation.min_phosphorus} - ${recommendation.max_phosphorus}`;
    let potasiumFertilizer = recommendation.potasium_fertilizer;
    let potasium = `${recommendation.min_potasium} - ${recommendation.max_potasium}`;

    let refHeader = new TableCell({
        children: [
            new Paragraph({
                style: "ordinary",
                children: [
                    new TextRun({
                        text: "Sample Ref",
                        bold: true
                    })
                ]
            })
        ]
    })
    let refValue = new TableCell({
        children: [
            new Paragraph({
                style: "ordinary",
                children: [
                    new TextRun({
                        text: `${recommendation.ref}`,

                    })
                ]
            })
        ]
    })
    headrowChildren.push(refHeader);
    rowChildren.push(refValue);

    if (!(nitrogenFertilizer.length == 0)) {
        let nitrogenHeader = new TableCell({
            children: [new Paragraph({
                style: "ordinary",
                children: [
                    new TextRun({
                        text: `${nitrogenFertilizer} kg/ha`,

                    })
                ]
            })]
        })
        //create the nitrogen value
        let nitrogenValue = new TableCell({
            children: [new Paragraph({
                style: "ordinary",
                children: [
                    new TextRun({
                        text: `${nitrogen}`,

                    })
                ]
            })]
        })
        headrowChildren.push(nitrogenHeader);
        rowChildren.push(nitrogenValue);
    }
    if (!(phosphorusFertilizer.length == 0)) {
        let phosphorusHeader = new TableCell({
            children: [new Paragraph({
                style: "ordinary",
                children: [
                    new TextRun({
                        text: `${phosphorusFertilizer} kg/ha`,

                    })
                ]
            })]
        });
        let phosphorusValue = new TableCell({
            children: [new Paragraph({
                style: "ordinary",
                children: [
                    new TextRun({
                        text: `${phosphorus}`,

                    })
                ]
            })]
        })
        headrowChildren.push(phosphorusHeader);
        rowChildren.push(phosphorusValue);
    }
    if (!(potasiumFertilizer.length == 0)) {
        let potasiumHeader = new TableCell({
            children: [new Paragraph({
                style: "ordinary",
                children: [
                    new TextRun({
                        text: `${potasiumFertilizer} kg/ha`,

                    })
                ]
            })]
        })
        let potasiumValue = new TableCell({
            children: [new Paragraph({
                style: "ordinary",
                children: [
                    new TextRun({
                        text: `${potasium}`,

                    })
                ]
            })]
        })
        headrowChildren.push(potasiumHeader);
        rowChildren.push(potasiumValue);
    }
    //do it for lime
    if (recommendation.lime > 0) {
        let limeHeader = new TableCell({
            children: [new Paragraph({
                style: "ordinary",
                children: [
                    new TextRun({
                        text: `Lime kg/ha`,

                    })
                ]
            })]
        })
        let limeValue = new TableCell({
            children: [new Paragraph({
                style: "ordinary",
                children: [
                    new TextRun({
                        text: `${recommendation.lime}`,

                    })
                ]
            })]
        })
        headrowChildren.push(limeHeader);
        rowChildren.push(limeValue);
    }
    headrow = new TableRow({
        children: headrowChildren
    });
    row = new TableRow({
        children: rowChildren
    });
    table = new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE
        },
        rows: [
            headrow,
            row
        ]
    });
    return table;
}

function createFormattedText(data) {
    let text = "\n";
    text += `Created on: ${new Date().toDateString()}\r\n`;
    text += `Created by: Fertilizer recommmendation application\r\n`;
    text += "-----------------------------------------------------------------------\r\n\n";
    text += `Name.........................${data.pack.results.name}\r\n`;
    text += `Lab number...................${data.pack.results.lab_number}\r\n`;
    text += `Reference....................${data.pack.results.ref}\r\n`;
    text += `Color........................${data.pack.results.color}\r\n`;
    text += `Texture......................${data.pack.results.texture}\r\n`;
    text += `pH...........................${data.pack.results.pH}\r\n`;
    text += `Free carbonate...............${data.pack.results.free_carbonate}\r\n`;
    text += `Conductivity.................${data.pack.results.conductivity}\r\n`;
    text += `Initial nitrogen (ppm).......${data.pack.results.nitrogen}\r\n`;
    text += `After Incub (ppm)............${data.pack.results.m_nitrogen_init}\r\n`;
    text += `Phosphorus...................${data.pack.results.phosphorus}\r\n`;
    text += `Potasium.....................${data.pack.results.potasium}\r\n`;
    text += `Calcium......................${data.pack.results.calcium}\r\n`;
    text += `Magnesium....................${data.pack.results.magnesium}\r\n`;
    text += `Total bases..................${data.pack.results.total_bases}\r\n`;
    text += "-------------------------------------------------------------------------\r\n\n";
    //texture description
    let textureDescription = getTextureDescription(textures_map,
        data.pack.results.texture);
    //color description
    let colorDescription = getColorDescription(colors_map,
        data.pack.results.color);
    //soil weight
    let soilWeightDescription = getSoilWeight(data.pack.results.texture);
    //pH description
    let pHDescription = getpHDescription(data.pack.results.pH);
    let description = `The soil is ${soilWeightDescription} soil (${textureDescription}), ${pHDescription}\r\n`;
    text += description;
    text += "-------------------------------------------------------------------------\r\n\n";
    text += `${data.pack.recommendation.crop} recommendations\r\n`;
    text += `${data.pack.recommendation.nitrogen_fertilizer} (kg/ha)..................${data.pack.recommendation.min_nitrogen} - ${data.pack.recommendation.max_nitrogen}\r\n`;
    text += `${data.pack.recommendation.phosphorus_fertilizer} (kg/ha)..................${data.pack.recommendation.min_phosphorus} - ${data.pack.recommendation.max_phosphorus}\r\n`;
    text += `${data.pack.recommendation.potasium_fertilizer} (kg/ha)..................${data.pack.recommendation.min_potasium} - ${data.pack.recommendation.max_potasium}\r\n`;
    text += `Lime.......................${data.pack.recommendation.lime}\r\n`;
    return text;
}

module.exports = {
    getColorDescription,
    createFormattedText,
    buildHeader,
    createResultsTable,
    createRecommendationTable,
    getpHDescription,
    getTextureDescription,
    getSoilWeight,
    textures_map,
    colors_map
};