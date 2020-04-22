const electron = require('electron');
const ipc = electron.ipcRenderer;
document.addEventListener('DOMContentLoaded', (event) =>{
    ipc.send('get-connection');
})

ipc.on('connection', (event, connection) =>{
    if(connection){
        //list all the users who have access to this database
        connection.query('', (err, results) =>{

        })
    }
})