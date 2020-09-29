const addbtn = document.getElementById("add");
const chgbtn = document.getElementById("change");
const delbtn = document.getElementById("delete");
const shap = document.getElementById("shap");
const shap1 = document.getElementById("shap1");
const okbtn = document.getElementById("addclose");
const clsbtn = document.getElementById("close");
const search = document.getElementById("search");
const sqlite3 = require('sqlite3').verbose();
const tstop = document.getElementById("data");
const tstop1 = document.getElementById("data1");
const QRCODE = require('qrcode');
const jsQR = require("jsqr");
const cqr = document.getElementById('createqr')
// const { remote, BrowserWindow } = require('electron');
// const ipcRenderer = require('electron').ipcRenderer;
const modal = document.getElementById("myModal");
let table = "";
let tables = [];
let head = {"fields": {}};
let clicked = null;
let assoc = {};
let datas = [];
let alamount = 0;
// let id = 0;
// let path = 'mda';

// ipcRenderer.on('opend-file', (e, file) => {
//     console.log(file);
// })

cqr.addEventListener('click', () => {
    let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          console.error(err.message);
        }
    });
    db.each('select * from books', (err,row) => {
        QRCODE.toFile(`qrs/${row.id}.png`, row.id)
    })
})

document.getElementById('mainbtn').addEventListener('click', () => {
    table = '';
    head = {"fields": {}};
    load();
})
search.addEventListener('change', () => {
    head.action = 'search';
    load();
})

function load() {
    video = null;
    document.getElementById('amdata').innerHTML = "";
    let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          console.error(err.message);
        }
    });
    let sql = ``;
    if (head.action != "search") {

        search.value = '';
    }
    if (head.action == "change") {
        sql += `UPDATE ${head.table} SET `
        for (let i in head.fields) {
            sql += `${i} = '${head.fields[i]}',`
        }
        sql = sql.slice(0,sql.length-1) + ` WHERE id = ${head.oldid};`
    }
    else if (head.action == "add") {
        sql += `INSERT into ${head.table} VALUES (`;
        for (let i in head.fields) {
            sql += `'${head.fields[i]}',`
        }
        sql = sql.slice(0,sql.length-1) + ');'
        if (head.table == 'TakeHistory') {
            alert('Книга выдана')
        }
    }
    else if (head.action == "delete") {
        sql += `DELETE from ${table} WHERE id = ${head.fields.id}`
    }
    if (sql) {
        db.run(sql, (err) => {
            if (err) {
                console.error(err.message);
                if (err.message.includes("SQLITE_CONSTRAINT: UNIQUE constraint failed")) {
                    alert('ID должен быть уникальным!');
                }
                if (err.message.includes("SQLITE_MISMATCH: datatype mismatch")) {
                    alert('Ошибка типа данных');
                }
            }
        });
    }
    clicked = null;
    if (head.action == "order") {
        head = {"fields": {}, "action": "order", "order": head.order};
    }
    else {
        head = {"fields": {}};
    }
    if (table) {
        shap.style.display = 'inline';
        shap1.style.display = 'none';
        tstop.innerHTML = "";
        db.serialize(() => {

        
        db.get(`SELECT * from ${table}`, (err, row) => {
            if (err) {
                console.error(err);
            }
            for (let i in row) {
                tstop.innerHTML += `<div class = "table" id="${i}"><div class = "head">${assoc[i]}</div></div>`;
                head.fields[i] = '';

            };
        })
        if (head.action == "order") {
            let sql = `SELECT * from ${table} Order By ${head.order} LIMIT 50`
            if (head.order == 'own') {
                sql = `SELECT * from ${table} Order By ${head.order} DESC LIMIT 50`
            }
            else if (head.order == 'id') {
                sql = `SELECT * from ${table} LIMIT 50`
            }
            db.each(sql, (err, row) => {
                for (let i in row) {
                    if (i == 'bibl') {
                        document.getElementById(i).innerHTML += `<div class="row" id="row${row.id}">><div style="display:none;">${row[i]}</div></div>  `;
                    }
                    else {
                        document.getElementById(i).innerHTML += `<div class="row" id="row${row.id}">${row[i]}</div>  `;
                    }
                };
                document.querySelectorAll('.head').forEach( (x) => {
                    x.addEventListener('click', () => {
                        head.action = "order";
                        head.order = Object.keys(assoc).find(key => assoc[key] === x.textContent);
                        load();
                        let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                            if (err) {
                              console.error(err.message);
                            }
                        });
                        db.each(`SELECT ${head.order}, count(${head.order}) as Amount from ${table} Group by ${head.order}`, (err, row) => {
                            for (let i in row) {
                                document.getElementById('amdata').innerHTML += `${assoc[i]} : ${row[i]} `;
                            };
                            document.getElementById('amdata').innerHTML += "<br>";
                        })
                        db.close()
                    })
                })
                document.querySelectorAll('.row').forEach( (x) => {
                    x.addEventListener('click', () => {
                        if (clicked) {
                            document.querySelectorAll(`#${clicked}`).forEach( (x) => {
                                x.style.backgroundColor = 'white';
                                x.style.color = 'black';
                                if (x.textContent.includes('>')) {
                                    x.children[0].style.display = "none";
                                }
                            })
                        }
                        if (clicked !== x.id) {
                            clicked = x.id
                            let j = 0;
                            let body = document.querySelectorAll(`#${clicked}`);
                            for (let i in head.fields) {
                                if (body[j].textContent.includes('>')) {
                                    body[j].children[0].style.display = "inline";
                                }
                                head.fields[i] = body[j].textContent;
                                j++;
                            }
                            document.querySelectorAll(`#${clicked}`).forEach( (x) => {
                                x.style.backgroundColor = 'blue';
                                x.style.color = 'white';
                            })
                        }
                        else {
                            clicked = null;
                        }
        
                    })
                })
                
            })
            
            
        }
        if (search.value != '') {
            alamount = 0;
            let rows = []
            db.serialize(() => {
                db.get(`SELECT * from ${table}`, (err,row) => {
                    for (let i in row) {
                        let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                            if (err) {
                            console.error(err.message);
                            }
                        });
                        db.each(`SELECT * from ${table} WHERE ${i} like '%${search.value}%' LIMIT 50 `, (err, row) => {
                            let check = false;
                            for (let i in rows) {
                                console.log(rows[i].id, row.id)
                                if (rows[i].id == row.id) {
                                    check = true;
                                }
                            }
                            if (!check) {
                                rows.push(row)
                                alamount += 1;
                                if (err) {
                                console.error(err);
                                }
                                for (let i in row) {
                                    if (i == 'bibl') {
                                        document.getElementById(i).innerHTML += `<div class="row" id="row${row.id}">><div style="display:none;">${row[i]}</div></div>  `;
                                    }
                                    else {
                                        document.getElementById(i).innerHTML += `<div class="row" id="row${row.id}">${row[i]}</div>  `;
                                    }
                                    
                                };
                                document.querySelectorAll('.head').forEach( (x) => {
                                    x.addEventListener('click', () => {
                                        head.action = "order";
                                        head.order = Object.keys(assoc).find(key => assoc[key] === x.textContent);
                                        load();
                                        let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                                            if (err) {
                                            console.error(err.message);
                                            }
                                        });
                                        db.each(`SELECT ${head.order}, count(${head.order}) as Amount from ${table} Group by ${head.order}`, (err, row) => {
                                            for (let i in row) {
                                                document.getElementById('amdata').innerHTML += `${assoc[i]} : ${row[i]} `;
                                            };
                                            document.getElementById('amdata').innerHTML += "<br>";
                                        })
                                        db.close()
                                        
                                    })
                                })
                                document.querySelectorAll('.row').forEach( (x) => {
                                    x.addEventListener('click', () => {
                                        if (clicked) {
                                            document.querySelectorAll(`#${clicked}`).forEach( (x) => {
                                                x.style.backgroundColor = 'white';
                                                x.style.color = 'black';
                                                if (x.textContent.includes('>')) {
                                                    x.children[0].style.display = "none";
                                                }
                                            })
                                        }
                                        if (clicked !== x.id) {
                                            clicked = x.id
                                            let j = 0;
                                            let body = document.querySelectorAll(`#${clicked}`);
                                            for (let i in head.fields) {
                                                if (body[j].textContent.includes('>')) {
                                                    body[j].children[0].style.display = "inline";
                                                }
                                                head.fields[i] = body[j].textContent;
                                                j++;
                                            }
                                            document.querySelectorAll(`#${clicked}`).forEach( (x) => {
                                                x.style.backgroundColor = 'blue';
                                                x.style.color = 'white';
                                            })
                                        }
                                        else {
                                            clicked = null;
                                        }
                        
                                    })
                                })
                                document.getElementById('alamount').innerHTML = `Общее кол-во: ${alamount}`
                            }
                        });
                        db.close();
                    }
                })
            });
        }
        else {
            alamount = 0;
            db.each(`SELECT * from ${table} LIMIT 50`, (err, row) => {
                alamount += 1;
                if (err) {
                console.error(err);
                }
                for (let i in row) {
                    if (i == 'bibl') {
                        document.getElementById(i).innerHTML += `<div class="row" id="row${row.id}">><div style="display:none;">${row[i]}</div></div>  `;
                    }
                    else if (document.getElementById(i)){
                        document.getElementById(i).innerHTML += `<div class="row" id="row${row.id}">${row[i]}</div>  `;
                    }
                    
                };
                document.querySelectorAll('.head').forEach( (x) => {
                    x.addEventListener('click', () => {
                        head.action = "order";
                        head.order = Object.keys(assoc).find(key => assoc[key] === x.textContent);
                        load();
                        let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                            if (err) {
                              console.error(err.message);
                            }
                        });
                        db.each(`SELECT ${head.order}, count(${head.order}) as Amount from ${table} Group by ${head.order}`, (err, row) => {
                            for (let i in row) {
                                document.getElementById('amdata').innerHTML += `${assoc[i]} : ${row[i]} `;
                            };
                            document.getElementById('amdata').innerHTML += "<br>";
                        })
                        db.close()
                        
                    })
                })
                document.querySelectorAll('.row').forEach( (x) => {
                    x.addEventListener('click', () => {
                        if (clicked) {
                            document.querySelectorAll(`#${clicked}`).forEach( (x) => {
                                x.style.backgroundColor = 'white';
                                x.style.color = 'black';
                                if (x.textContent.includes('>')) {
                                    x.children[0].style.display = "none";
                                }
                            })
                        }
                        if (clicked !== x.id) {
                            clicked = x.id
                            let j = 0;
                            let body = document.querySelectorAll(`#${clicked}`);
                            for (let i in head.fields) {
                                if (body[j].textContent.includes('>')) {
                                    body[j].children[0].style.display = "inline";
                                }
                                head.fields[i] = body[j].textContent;
                                j++;
                            }
                            document.querySelectorAll(`#${clicked}`).forEach( (x) => {
                                x.style.backgroundColor = 'blue';
                                x.style.color = 'white';
                            })
                        }
                        else {
                            clicked = null;
                        }
        
                    })
                })
                document.getElementById('alamount').innerHTML = `Общее кол-во: ${alamount}`
            });
        }
        })
    } else {
        db.serialize(() => {
            db.each('select * from datas', (err, row) => {
                if (!datas.includes(row.name)) {
                    datas.push(row.name);
                }
            })
            db.each("select * from Assoc", (err, row) => {
                assoc[row.name] = row.mean;
            })
        })
        document.getElementById('footer').innerHTML = '';
        db.each("select name from sqlite_master where type='table'", (err, row) => {
            if ((row.name != "Assoc") && (row.name != "datas")) {
                document.getElementById('footer').innerHTML += `<button id='btn${row.name}' class="tables">${assoc[row.name]}</button>`
                document.querySelectorAll(".tables").forEach((x) => {
                    x.addEventListener('click', () => {
                        table = x.id.substring(3,x.id.length);
                        head.action = "";
                        load();
                    })
                })
                table = row.name;
                tables.push(row.name)
            }
        })
        // tstop.innerHTML = '';
        shap1.style.display = 'inline';
        shap.style.display = 'none';
    }
    db.close();    
        
}

addbtn.addEventListener('click', () => {
    // const top = remote.getCurrentWindow();
    // let win = new remote.BrowserWindow({
    //     width: document.documentElement.clientWidth / 2,
    //     height: document.documentElement.clientHeight / 2,
    //     webPreferences: {
    //         nodeIntegration: true,
    //         enableRemoteModule: true
    //     },
    //     show: false,
    //     parent: top,
    //     modal: true
    // });
    // win.loadFile('db.html');
    // win.once('ready-to-show', () => {
    //     head.fields.id = id + 1;
    //     win.webContents.send('data', head)
    //     win.show();
    // })
    // win.on('close', () => {
    //     win = null;
    // })
    if (table == "TakeHistory") {
        document.getElementById('divvideo').style.display = 'block'
        let video = document.createElement("video");
        const canvasElement = document.getElementById("canvas");
        const canvas = canvasElement.getContext("2d");
        const loadingMessage = document.getElementById("loadingMessage");
        const outputContainer = document.getElementById("output");
        const outputMessage = document.getElementById("outputMessage");
        const outputData = document.getElementById("outputData");
    
        function drawLine(begin, end, color) {
          canvas.beginPath();
          canvas.moveTo(begin.x, begin.y);
          canvas.lineTo(end.x, end.y);
          canvas.lineWidth = 4;
          canvas.strokeStyle = color;
          canvas.stroke();
        }
    
        // Use facingMode: environment to attemt to get the front camera on phones
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
          video.srcObject = stream;
          video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
          video.play();
          requestAnimationFrame(tick);
        });
    
        function tick() {
          loadingMessage.innerText = "⌛ Loading video..."
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            loadingMessage.hidden = true;
            canvasElement.hidden = false;
            outputContainer.hidden = false;
    
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            var code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code) {
                video = null;
                document.getElementById('divvideo').style.display = 'none'
                let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message);
                }
                db.get(`SELECT * from books where invid = "${code.data}"`, (err, row) => {
                    if (err) {
                        console.error(err);
                    }
                    let d = new Date();
                    if (row.own == '0') {
                        document.getElementById('inputinvid').value = row.id;
                        document.getElementById('inputname').value = row.name;
                        document.getElementById('inputwwhen').value = `${d.getDate()}.${d.getMonth()}.${d.getFullYear()}`
                        let d2 = new Date(Date.parse(d)+1209600033)
                        document.getElementById('inputqwhen').value = `${d2.getDate()}.${d2.getMonth()}.${d2.getFullYear()}`
                        db.run(`UPDATE books SET own = "1" WHERE id = ${code.data}`)
                    }
                    else {
                        db.run(`UPDATE books SET own = "0" WHERE id = ${code.data}`)
                        db.run(`UPDATE TakeHistory SET return = "${d.getDate()}.${d.getMonth()}.${d.getFullYear()}" WHERE invid = ${code.data}`)
                        clsbtn.click();
                        load()
                        alert('Книга сдана')
                    }
                })
            });
                
            } else {
                outputMessage.hidden = false;
                outputData.parentElement.hidden = true;
            }
          }
          requestAnimationFrame(tick);
        }        
    }

    head.table = table;
    head.action = "add";
    for (let i in head.fields) {
        head.fields[i] = '';
    }
    for (let i in head.fields){
        if (datas.includes(i)) {
            tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <input list = 'input${i}'><datalist id= 'input${i}'></div>`;
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message);
                }
            });
            db.serialize(() => {
                db.each(`Select * from datas Where name = "${i}";`, (err, row) => {
                    document.getElementById(`input${i}`).innerHTML += `<option>${row.value}</option>`;
                })
            })
        }
        else if (tables.includes(i)) {
            tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <input list = 'input${i}'><datalist id= 'input${i}'></datalist></div>`;
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message);
                }
            });
            db.serialize(() => {
                db.each(`Select * from ${i};`, (err, row) => {
                    if (i == "class") {
                        document.getElementById(`input${i}`).innerHTML += `<option>${row.name}</option>`;
                    }
                    else if (i == "pupil") {
                        document.getElementById(`input${i}`).innerHTML += `<option>${row.FIO}</option>`;
                    }
                    else {
                        document.getElementById(`input${i}`).innerHTML += `<option>${row.id}</option>`;
                    }
                    
                })
            })
        }
        else if (i == 'id') {
            tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <input id = "input${i}" value="${alamount+1}"></div>`;
        }
        else {
            tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <input id = "input${i}" value="${head.fields[i]}"></div>`;
        }
        
    }
    modal.style.display = "block";
});

chgbtn.addEventListener('click', () => {
    if (clicked) {
        // const top = remote.getCurrentWindow();
        // let win = new remote.BrowserWindow({
        //     width: document.documentElement.clientWidth / 2,
        //     height: document.documentElement.clientHeight / 2,
        //     webPreferences: {
        //         nodeIntegration: true,
        //         enableRemoteModule: true
        //     },
        //     show: false,
        //     parent: top,
        //     modal: true
        // });
        // win.loadFile('db.html');
        // win.once('ready-to-show', () => {
        //     head.table = table;
        //     head.action = "change";
        //     win.webContents.send('data', head)
        //     win.show();
        // })
        // win.on('close', () => {
        //     win = null;
        // })
        head.table = table;
        head.action = "change";
        head.oldid = head.fields.id;
        for (let i in head.fields){
            if (datas.includes(i)) {
                tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <input list = 'input${i}'><datalist id = 'input${i}'></datalist></div>`;
                let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                    if (err) {
                      console.error(err.message);
                    }
                });
                db.serialize(() => {
                    db.each(`Select * from datas Where name = "${i}";`, (err, row) => {
                        document.getElementById(`input${i}`).innerHTML += `<option>${row.value}</option>`;
                    })
                })
            }
            else if (tables.includes(i)) {
                tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <input list = 'input${i}'> <datalist id= 'input${i}'></datalist></div>`;
                let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                    if (err) {
                      console.error(err.message);
                    }
                });
                db.serialize(() => {
                    db.each(`Select * from ${i};`, (err, row) => {
                        if (i == "class") {
                            document.getElementById(`input${i}`).innerHTML += `<option>${row.name}</option>`;
                        }
                        else if (i == "pupil") {
                            document.getElementById(`input${i}`).innerHTML += `<option>${row.FIO}</option>`;
                        }
                        else {
                            document.getElementById(`input${i}`).innerHTML += `<option>${row.id}</option>`;
                        }
                        
                    })
                })
            }
            else if (i == 'id') {
                tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <input id = "input${i}" value="${head.fields[i]}"></div>`;
            }
            else {
                tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <input id = "input${i}" value="${head.fields[i]}"></div>`;
            }
            
        }
        modal.style.display = "block";
    }
    else {
        alert("Выберете запись");
    }
});

delbtn.addEventListener('click', () => {
    if (clicked) {
        head.action = "delete";
        load();
    }
    else {
        alert("Не выбрано")
    }
})

okbtn.addEventListener('click', () => {
    for (let i in head.fields) {
        if (document.getElementById(`input${i}`)) {
            head.fields[i] = document.getElementById(`input${i}`).value == '' ? '-' : document.getElementById(`input${i}`).value;
        }
        else {
            head.fields[i] =  '-';
        }
        head.fields['id'] = alamount + 1;
    }
    modal.style.display = "none";
    tstop1.innerHTML = '';
    load();
})

// window.addEventListener('click', (e) => {
//     if (e.target == modal) {
//         if (modal.style.display != "none") {
//             modal.style.display = "none";
//         }
//     }
// })

clsbtn.addEventListener('click', () => {
    modal.style.display = "none";
    tstop1.innerHTML = '';
    head.action = ''
});

// document.getElementById('givebook').addEventListener('click', () => {
//     table = 'TakeHistory'
//     head.table = table;
//     head.action = "add";
//     for (let i in head.fields) {
//         head.fields[i] = '';
//     }
//     for (let i in head.fields){
//         if (datas.includes(i)) {
//             tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <select id= 'input${i}'></select></div>`;
//             let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
//                 if (err) {
//                   console.error(err.message);
//                 }
//             });
//             db.serialize(() => {
//                 db.each(`Select * from datas Where name = "${i}";`, (err, row) => {
//                     document.getElementById(`input${i}`).innerHTML += `<option>${row.value}</option>`;
//                 })
//             })
//         }
//         else if (tables.includes(i)) {
//             tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <select id= 'input${i}'></select></div>`;
//             let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
//                 if (err) {
//                   console.error(err.message);
//                 }
//             });
//             db.serialize(() => {
//                 db.each(`Select * from ${i};`, (err, row) => {
//                     if (i == "class") {
//                         document.getElementById(`input${i}`).innerHTML += `<option>${row.name}</option>`;
//                     }
//                     else if (i == "pupil") {
//                         document.getElementById(`input${i}`).innerHTML += `<option>${row.FIO}</option>`;
//                     }
//                     else {
//                         document.getElementById(`input${i}`).innerHTML += `<option>${row.id}</option>`;
//                     }
                    
//                 })
//             })
//         }
//         else if (i == 'id') {
//             tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <input id = "input${i}" value="${alamount+1}"></div>`;
//         }
//         else {
//             tstop1.innerHTML += `<div id="div${i}">${assoc[i]}: <input id = "input${i}" value="${head.fields[i]}"></div>`;
//         }
        
//     }
//     modal.style.display = "block";
// })

document.getElementById('takebook').addEventListener('click', () => {
            
})

load();
// ipcRenderer.send('open-file','mda');