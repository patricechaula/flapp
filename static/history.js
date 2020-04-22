function updateTable(sql) {
    var table = document.querySelector('.table-container table');
    let prevRecords = document.querySelectorAll('.record');
    for (const prevRecord of prevRecords) {
        prevRecord.remove();
    }
    //fire
    connection.query(sql, function (err, results, fields) {
        if (err) {
            statusReport.innerText = 'Status: Could not load data.';
            errors.push(timeError(err.code + ": Could not load data."));
            let reloadButton = document.createElement('button');
            reloadButton.innerText = 'Try again';
            reloadButton.id = "reload";
            reloadButton.style.display = 'inline-block';
            reloadButton.addEventListener('click', function () {
                let xsql = `SELECT * FROM lab_results`;
                updateTable(xsql);
                reloadButton.remove();
            })
            let controlsPanel = document.querySelector('.controls');
            controlsPanel.appendChild(reloadButton);
            throw err;
        }
        else {

            statusReport.innerText = 'Status: Ok';
            console.log(results);
            for (const result of results) {
                let record = document.createElement('tr');
                record.className = 'record';
                record.id = 'record' + result.id;
                let farmerName = document.createElement('td');
                farmerName.innerText = result.name;
                let reference = document.createElement('td');
                reference.innerText = result.ref;
                let labNumber = document.createElement('td');
                labNumber.innerText = result.lab_number;
                let recommendations = document.createElement('td');
                let cropName = document.createElement('td');



                connection.query(`SELECT recommendation_id FROM lab_results_has_recommendation WHERE lab_results_id = ${result.id}`,
                    function (err, bresult, fields) {
                        if (err) {
                            statusReport.innerText = 'Status: Could not load recommendation.';
                            errors.push(err.code + `: Could not load recommendation for ${result.name}.`);
                            throw err;
                        } else {
                            //now get the id of the crop
                            statusReport.innerText = 'Status: Ok';
                            if (bresult.length > 0) {
                                console.log(bresult);
                                recommendation_id = bresult[0].recommendation_id;
                                //fire
                                connection.query(`SELECT text1,text2,text3,text4,crop,lime,min_potasium, max_potasium FROM recommendation WHERE id = ${recommendation_id}`,
                                    function (err, cresult, fields) {
                                        if (err) {
                                            statusReport.innerText = `Status: Could not load recommendation for ${result.name}`;
                                            errors.push(timeError(err.code + `: Could not load recommendation for ${result.name}`));
                                            throw err;
                                        }
                                        else {
                                            statusReport.innerText = 'Status: Ok';
                                            let str = `<p>${cresult[0].text1}.<br/> ${cresult[0].text2}.<br/>`;
                                            if(cresult[0].max_potasium > 0 && cresult[0].min_potasium > 0)
                                                str += `${cresult[0].text3}<br/>.`;
                                            if (cresult[0].lime > 0)
                                                str += `Apply ${cresult[0].lime}kgs of lime.<br/>`;
                                            str += `${cresult[0].text4}</p>`;
                                            recommendations.innerHTML = str;
                                            cropName.innerText = cresult[0].crop;

                                        }
                                    })
                            }
                        }
                    })
                record.appendChild(farmerName);
                record.appendChild(reference);
                record.appendChild(labNumber);
                record.appendChild(cropName);
                record.appendChild(recommendations);
                let actions = document.createElement('td')
                let viewDetail = document.createElement('button');
                let printButton = document.createElement('button');
                printButton.innerText = 'REPORT';
                printButton.addEventListener('click', function () {
                    //already the result we got it
                    let xsql = `SELECT * FROM lab_results_has_recommendation WHERE lab_results_id = ${result.id}`;
                    connection.query(xsql, function (err, xresult, fields) {
                        if (err) {
                            statusReport.innerText = 'Status: Could not get recommendation';
                            errors.push(timeError(err.code + `: Could not get recomendation for ${result.name}`));
                            throw err;
                        } else {
                            console.log('////////////////////////////')
                            console.log(xresult);
                            if (xresult.length > 0) {
                                statusReport.innerText = 'Status: Ok';
                                let recommendation_id = xresult[0].recommendation_id;
                                console.log(xresult);
                                //query
                                let xsql1 = `SELECT * FROM recommendation WHERE id  = ${recommendation_id}`;
                                connection.query(xsql1, function (err, yresult, fields) {
                                    if (err) {
                                        statusReport.innerText = 'Status: Could not get recommendation.';
                                        errors.push(timeError(err.code + `: Could not get recomendation for ${result.name}`));
                                        throw err;
                                    } else {

                                        if (yresult.length > 0) {
                                            recommendationPackage = yresult[0];
                                            labresultsPackage = result;
                                            let pack = {
                                                results: labresultsPackage,
                                                recommendation: recommendationPackage
                                            }
                                            ipc.send('open-pdf-prep', pack);
                                        } else {
                                            statusReport.innerText = "Status: Can't print data without recommendation";
                                        }
                                    }
                                })
                            } else {
                                statusReport.innerText = "Status: Can't print data without recommendation";
                            }
                        }
                    })


                })
                viewDetail.innerText = 'VIEW DETAIL';
                let deleteRecord = document.createElement('button');
                deleteRecord.innerText = 'DELETE';
                actions.appendChild(printButton);
                actions.appendChild(viewDetail);
                actions.appendChild(deleteRecord);
                actions.className = 'table-controls';
                record.appendChild(actions);

                deleteRecord.id = result.id;



                deleteRecord.addEventListener('click', function () {
                    let xmysql = `DELETE FROM lab_results_has_recommendation WHERE lab_results_id = ${deleteRecord.id}`;
                    let xmysql2 = `DELETE FROM crop_has_lab_results WHERE lab_results_id = ${deleteRecord.id}`;
                    let xmysql3 = `DELETE FROM lab_results WHERE id = ${deleteRecord.id}`;
                    console.log(xmysql, xmysql2, xmysql3);
                    connection.query(xmysql, function (err, bresult, fields) {
                        if (err) {
                            statusReport.innerText = `Status: Could not load delete data for ${result.name}`;
                            errors.push(timeError(err.code + `: Could not delete data for ${result.name}`));
                            throw err;
                        }
                        else {
                            statusReport.innerText = 'Status: Ok';
                            connection.query(xmysql2, function (err, cresult, fields) {
                                if (err) {
                                    statusReport.innerText = `Status: Could not load delete data for ${result.name}`;
                                    errors.push(timeError(err.code + `: Could not delete data for ${result.name}`));
                                    throw err;
                                }
                                else {
                                    connection.query(xmysql3, function (err, dresult, fields) {
                                        if (err) {
                                            statusReport.innerText = `Status: Could not load delete data for ${result.name}`;
                                            errors.push(timeError(err.code + `: Could not delete data for ${result.name}`));
                                            throw err;
                                        }
                                        else {
                                            statusReport.innerText = 'Status: Ok';
                                            let record = document.getElementById(`record${deleteRecord.id}`);
                                            console.log("Id of the removed", deleteRecord.id);
                                            record.remove();
                                        }
                                    })
                                }
                            })

                        }
                    })
                })

                viewDetail.id = result.id;
                viewDetail.addEventListener('click', function () {
                    var detailPanel = document.querySelector('#detail-pane');
                    window.views.peek().style.display = 'none';
                    detailPanel.style.display = 'grid';
                    detailPanel.innerHTML = '';
                    window.views.push(detailPanel);

                    let mysql = `SELECT * FROM lab_results WHERE id = ${result.id}`

                    connection.query(mysql, function (err, mresult, fields) {
                        if (err) {
                            statusReport.innerText = `Status: Could not load lab data for ${result.name}`;
                            errors.push(timeError(err.code + `: Could not load data for ${result.name}`));
                            throw err;
                        } else {
                            statusReport.innerText = 'Status: Ok';
                            let myresult = mresult[0];
                            let detailer = document.createElement('table');
                            var name = document.createElement('h3');
                            name.innerHTML = `${myresult.name}`;
                            
                            var lab_number = document.createElement('tr');
                            lab_number.innerHTML = `<td>Lab number </td> <td>${myresult.lab_number}</td>`;
                            detailer.appendChild(lab_number);
                            var ref = document.createElement('tr')
                            ref.innerHTML = `<td>Reference</td><td>${myresult.ref}</td>`;
                            detailer.appendChild(ref);
                            var color = document.createElement('tr');
                            color.innerHTML = `<td>Color</td><td>${myresult.color}</td>`
                            detailer.appendChild(color);
                            var texture = document.createElement('tr');
                            texture.innerHTML = `<td>Texture</td><td>${myresult.texture}</td>`;
                            detailer.appendChild(texture);
                            var pH = document.createElement('tr');
                            pH.innerHTML = `<td>pH</td><td>${myresult.pH}</td>`;
                            detailer.appendChild(pH);
                            var free_carbonate = document.createElement('tr');
                            free_carbonate.innerHTML = `<td>Free carbonate</td><td>${myresult.free_carbonate}</td>`;
                            detailer.appendChild(free_carbonate);
                            var conductivity = document.createElement('tr');
                            conductivity.innerHTML = `<td>Conductivity</td><td>${myresult.conductivity}</td>`;
                            detailer.appendChild(conductivity);
                            var nitrogen = document.createElement('tr');
                            nitrogen.innerHTML = `<td>Initial nitrogen</td><td>${myresult.nitrogen}</td>`;
                            detailer.appendChild(nitrogen);
                            var nitrogen_after = document.createElement('tr');
                            nitrogen_after.innerHTML = `<td>Nitrogen after incubation</td><td>${myresult.m_nitrogen_init}</td>`;
                            detailer.appendChild(nitrogen_after);
                            var phosphorus = document.createElement('tr');
                            phosphorus.innerHTML = `<td>Phosphorus</td><td>${myresult.phosphorus}</td>`;
                            detailer.appendChild(phosphorus);
                            var potasium = document.createElement('tr');
                            potasium.innerHTML = `<td>Potasium</td><td>${myresult.potasium}</td>`;
                            detailer.appendChild(potasium);
                            var calcium = document.createElement('tr');
                            calcium.innerHTML = `<td>Calcium</td><td>${myresult.calcium}</td>`;
                            detailer.appendChild(calcium);
                            var magnesium = document.createElement('tr');
                            magnesium.innerHTML = `<td>Magnesium</td><td>${myresult.magnesium}</td>`;
                            detailer.appendChild(magnesium);
                            var total_bases = document.createElement('tr');
                            total_bases.innerHTML = `<td>Total bases</td><td>${myresult.total_bases}</td>`;
                            detailer.appendChild(total_bases);
                            detailer.style.marginRight = "5px";
                            let detailerView = document.createElement('div');
                            detailerView.appendChild(name);
                            detailerView.appendChild(detailer);
                            detailPanel.appendChild(detailerView);

                            let mysql2 = `SELECT * FROM lab_results_has_recommendation WHERE lab_results_id = 
                                    ${myresult.id}`;
                            connection.query(mysql2, function (erra, mresult2, fields) {
                                if (err) {
                                    statusReport.innerText = `Status: Could not load recommendation data for ${result.name}`;
                                    errors.push(timeError(err.code + ": Could not load recommendation data for " + result.name));
                                    throw err;
                                }
                                else {
                                    statusReport.innerText = 'Status: Ok';
                                    let myresult2 = mresult2[0];
                                    let mysql3 = `SELECT * FROM recommendation WHERE id = ${myresult2.recommendation_id}`;
                                    connection.query(mysql3, function (err, mresult3, fields) {
                                        if (err) {
                                            statusReport.innerText = `Status: Could not load recommendation data for ${result.name}`;
                                            errors.push(timeError(err.code + ": Could not load recommendation data for " + result.name));
                                            throw err;
                                        }
                                        else {
                                            statusReport.innerText = 'Status: Ok';
                                            let myresult3 = mresult3[0];
                                            let recommendationView = document.createElement('table');
                                            let recommendationPanel = document.createElement('div');
                                            recommendationView.style.marginLeft = "5px";
                                            let recommendationHeading = document.createElement('h3');
                                            recommendationHeading.innerText = 'Recommendation';
                                            recommendationPanel.appendChild(recommendationHeading);

                                            var nitrogenRecommendation = document.createElement('tr');
                                            nitrogenRecommendation.innerHTML = `<td>Nitrogen</td><td>from ${myresult3.nitrogen}</td> `;
                                            recommendationView.appendChild(nitrogenRecommendation);
                                            var phosphorusRecommendation = document.createElement('tr');
                                            phosphorusRecommendation.innerHTML = `<td>Phosphorus</td><td>from ${myresult3.phosphorus}</td>`;
                                            recommendationView.appendChild(phosphorusRecommendation);
                                            var potasiumRecommendation = document.createElement('tr');
                                            potasiumRecommendation.innerHTML = `<td>Potasium</td><td>${myresult3.potasium}</td>`;
                                            recommendationView.appendChild(potasiumRecommendation);
                                            var limeRecommendation = document.createElement('tr');
                                            limeRecommendation.innerHTML = `<td>Lime</td><td>${myresult3.lime}kg</td>`;
                                            recommendationView.appendChild(limeRecommendation);
                                            var text1 = document.createElement('tr');
                                            var text2 = document.createElement('tr');
                                            var text3 = document.createElement('tr');
                                            text1.innerHTML = `<td>Apply</td><td>${myresult3.text1}</td>`;
                                            text2.innerHTML =`<td>Apply</td><td>${myresult3.text2}</td>`;
                                            text3.innerHTML = `<td>Apply</td><td>${myresult3.text3}</td>`;
                                            recommendationView.appendChild(text1);
                                            recommendationView.appendChild(text2);
                                            recommendationView.appendChild(text3);
                                            recommendationPanel.appendChild(recommendationView);
                                            detailPanel.appendChild(recommendationPanel);


                                        }
                                    })
                                }
                            })

                        }
                    })


                })
                table.appendChild(record);

            }
        }
    })
    //get the crop related
}