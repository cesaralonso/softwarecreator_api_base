const router = require('express').Router();
const Proyecto = require('../models/proyecto');
const passport = require('passport');
const permissions = require('../config/permissions');
const Proyectoequipo = require('../models/proyectoequipo');
const Proyectoreporte = require('../models/proyectoreporte');
const multer = require('multer');
const fs = require('fs-extra');
const Logs = require('../models/log');
const AdmZip = require('adm-zip');
const pdf = require('html-pdf');
const async = require('async');
const { PDFDocument } = require('pdf-lib');
const { default: PQueue } = require('p-queue');
const queue = new PQueue({concurrency: 1});

// Multer File upload settings
const DIR = './public/proyectos/';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    cb(null, fileName)
  }
});

// Multer Mime Type Validation
var upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 100
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});



 var getProyectoequipoReportesFromRow = (row, idproyecto, created_by) => {

    const cols = row.split(',');
    let subestacion = cols[0] || '';
    let nombre = cols[1] || '';
    let serie = cols[2] || '';
    let tipo = cols[3] || '';
    let reportes = cols[4] || '';

    subestacion = subestacion.trim();
    nombre = nombre.trim();
    serie = serie.trim();
    tipo = tipo.trim();

    reportes = reportes.trim()
            .replace(/"/g,'')
            .replace(/ /g,'');
    // Si no fuera concatenación
    if (reportes.indexOf('|') > -1) {
        reportes = reportes.split('|');
    }

    // INSERTA UN REGISTRO A PROYECTOEQUIPO
    if (nombre !== '' && nombre !== undefined 
        && serie !== '' && serie !== undefined 
        && subestacion !== '' && subestacion !== undefined
        && tipo !== '' && tipo !== undefined) {

        const proyectoequipo = {
            proyecto_idproyecto: idproyecto,
            nombre: nombre.replace(/"/g, ''),
            serie: serie.replace(/"/g, ''),
            subestacion: subestacion.replace(/"/g, ''),
            tipo: tipo.replace(/"/g, ''),
            created_by: created_by
        };

        return [proyectoequipo, reportes, tipo];

    } else {
        return [null, null, null];
    }
}

router
    .get('/caducados', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.findCaducados(auth_data, created_by, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/from-to/:fechaDesde/:fechaHasta/:caducados', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.findFromTo(auth_data, req.params.fechaDesde, req.params.fechaHasta, req.params.caducados, created_by, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .patch('/entrega/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'updateable', (error, permission) => {
                if (permission.success) {
                    const _proyecto = req.body;
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.entregaProyecto(_proyecto, created_by, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .patch('/cancela/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'updateable', (error, permission) => {
                if (permission.success) {
                    const _proyecto = req.body;
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.cancelaProyecto(_proyecto, created_by, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .patch('/finaliza/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'updateable', (error, permission) => {
                if (permission.success) {
                    const _proyecto = req.body;
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.finalizaProyecto(_proyecto, created_by, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .post('/restaurar/:idproyecto/:idcliente', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            // DEBE TENER PERMISO DE VISIBILIZAR (CARGA) EN PROYECTO
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'carga', (error, permission) => {
                if (permission.success) {

                    // Primero debe mover de nuevo el proyecto a public proyectos
                    const idProyecto = req.params.idproyecto;

                    caducadosPath = './caducados/' + idProyecto;
                    publicPath = './public/proyectos/' + idProyecto;

                    try {
                        // Primero revisar si existe caducadosPath
                        if (fs.existsSync(caducadosPath)) {
                            fs.moveSync(caducadosPath, publicPath);
                            console.log("¡Carpetas movidas correctamente! desde: " + caducadosPath + " a: " + publicPath);
                            
                            // Ahora visibiliza todo
                            Proyecto.visibilizar(req.params.idproyecto, req.params.idcliente, req.mysql, (__error, data) => {
                                return Proyecto.response(res, __error, data);
                            });

                        } else {
                            console.error("Carpetas no fueron movidas, desde: " + caducadosPath + " a: " + publicPath + ". Carpeta en caducados: " + caducadosPath + " no se encontró.");
                            return Proyecto.response(res, error, {success: false, result: {}, message: "Carpeta en caducados: " + caducadosPath + " no se encontró."});
                        }
                    } catch (err) {
                        console.error(err);
                        return Proyecto.response(res, error, {success: false, result: {}, message: "Carpetas no fueron movidas, desde: " + caducadosPath + " a: " + publicPath});
                    }

                } else {
                    return Proyecto.response(res, _error, permission);
                }
            });
        })(req, res, next);
    })
    .post('/visibilizar/:idproyecto/:idcliente', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            // DEBE TENER PERMISO DE VISIBILIZAR (CARGA) EN PROYECTO
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'carga', (error, permission) => {
                if (permission.success) {
                    Proyecto.visibilizar(req.params.idproyecto, req.params.idcliente, req.mysql, (__error, data) => {
                        return Proyecto.response(res, __error, data);
                    });
                } else {
                    return Proyecto.response(res, _error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/montos/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    Proyecto.updateMontos(req.params.id, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/cliente/:idcliente/:caducados', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.findByIdCliente(req.params.idcliente, req.params.caducados, created_by, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/todos/:caducados', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.all(req.params.caducados, created_by, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/count', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    Proyecto.count(req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/exist/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    Proyecto.exist(req.params.id, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/like/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.findLikeId(req.params.id, created_by, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .get('/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.findById(req.params.id, created_by, req.mysql, (error, data) => {
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .post('/download-pdf/:idproyecto', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {

                    Proyecto.getAllFiles(req.params.idproyecto, req.mysql, async (error, files) => {

                        var arrayPdfs = [];
                        // Comienza creando el índice a partir de elemenento html recibido en body
                        const html = req.body.element;
                        const options = { 
                            format: 'Letter'
                         };
                        const indicePdfPath = './public/proyectos/' + req.params.idproyecto + '/indice_' + req.params.idproyecto + '.pdf';
                        const portadaPdfPath = './public/proyectos/' + req.params.idproyecto + '/portada_' + req.params.idproyecto + '.pdf';

                        // Toma archivo portada html y reemplaza variables
                        const portadaSource = './public/reportes/portada-plantilla-1.html';
                        let portadaHtml = fs.readFileSync(portadaSource, 'utf8');
                        portadaHtml = portadaHtml.replace(`[proyecto.idproyecto]`, files.result.proyecto.comentarios);
                        portadaHtml = portadaHtml.replace(`[proyecto.razonsocial]`, files.result.proyecto.razonsocial);

                        // Primero, revisar si existe ya una portada y eliminarlo para que no se bloqueé proceso.
                        if (fs.existsSync(portadaPdfPath)) {
                            try {
                                fs.unlinkSync(portadaPdfPath);
                                console.log('file removed');
                            } catch(err) {
                                console.error(err);
                            }
                        }

                        pdf.create(portadaHtml, options).toFile(portadaPdfPath, function(err, __res) {
                            if (err) {
                                console.log(err);
                            }
                            arrayPdfs.push(portadaPdfPath);

                            // Segundo, revisar si existe ya un índice y eliminarlo para que no se bloqueé proceso.
                            if (fs.existsSync(indicePdfPath)) {
                                try {
                                    fs.unlinkSync(indicePdfPath);
                                    console.log('file removed');
                                } catch(err) {
                                    console.error(err);
                                }
                            }

                            pdf.create(html, { 
                                "format": "Letter",
                                "border": {
                                    "top": "0.5in",            // default is 0, units: mm, cm, in, px
                                    "right": "0.5in",
                                    "bottom": "0.5in",
                                    "left": "0.5in"
                                  }
                             }).toFile(indicePdfPath, function(err, _res) {
                                if (err) {
                                    console.log(err);
                                }
                                arrayPdfs.push(indicePdfPath);

                                if (files.result.proyectodocumento) {
                                    (async () => {
                                        await queue.add(() => new Promise((resolve, reject) => {
                                            files.result.proyectodocumento.map(async file => {
                                                const folderPos = file.url.indexOf('/proyectos/') + 11;
                                                const _documento = file.url.substring(folderPos);
                                                const pathFile =  './public/proyectos/' + _documento;
                                                // add local file
                                                arrayPdfs.push(pathFile);
                                            });
                                            resolve();
                                        }));
                                    })();
                                }

                                if (files.result.proyectoreporte) {
                                    (async () => {
                                        await queue.add(() => new Promise((resolve, reject) => {
                                            files.result.proyectoreporte.map(async file => {
                                                const folderPos = file.url.indexOf('/proyectos/') + 11;
                                                const _documento = file.url.substring(folderPos);
                                                const pathFile =  './public/proyectos/' + _documento;
                                                // add local file
                                                arrayPdfs.push(pathFile);
                                            });
                                            resolve();
                                        }));
                                    })();
                                }

                                (async () => {
                                    // Create a new document
                                    const doc = await PDFDocument.create();

                                    
                                    // Primero, portada
                                    await queue.add(() => new Promise(async (resolve, reject) => {
                                        const pathFile = arrayPdfs.shift();   
                                        const pdfFile = await PDFDocument.load(fs.readFileSync(pathFile));
                                        const contentPages = await doc.copyPages(pdfFile, pdfFile.getPageIndices());
                                        var i = 0;
                                        contentPages.map(async page => {
                                            doc.addPage(page);
                                            i++;
                                        });
                                        if (contentPages && contentPages.length === i) {
                                            resolve();
                                        }
                                        if (!contentPages) {
                                            reject('No hay portada.');
                                        }
                                    }));

                                    // Segundo, indice
                                    await queue.add(() => new Promise(async (resolve, reject) => {
                                        const pathFile = arrayPdfs.shift();   
                                        const pdfFile = await PDFDocument.load(fs.readFileSync(pathFile));
                                        const contentPages = await doc.copyPages(pdfFile, pdfFile.getPageIndices());
                                        var i = 0;
                                        contentPages.map(async page => {
                                            doc.addPage(page);
                                            i++;
                                        });
                                        if (contentPages && contentPages.length === i) {
                                            resolve();
                                        }
                                        if (!contentPages) {
                                            reject('No hay índice.');
                                        }
                                    }));

                                    await queue.add(() => Promise.all(
                                        arrayPdfs.map(async pathFile => {
                                            const pdfFile = await PDFDocument.load(fs.readFileSync(pathFile));
                                            const contentPages = await doc.copyPages(pdfFile, pdfFile.getPageIndices());
                                            contentPages.map(async page => {
                                                await doc.addPage(page);
                                            });
                                        }
                                    ))
                                    .then(async () => {
                                        // Write the PDF to a file
                                        fs.writeFileSync(`./public/proyectos/${req.params.idproyecto}/documento_completo_${req.params.idproyecto}.pdf`, await doc.save());
                                        res.download(
                                            `./public/proyectos/${req.params.idproyecto}/documento_completo_${req.params.idproyecto}.pdf`,
                                            function(err) {
                                                if (!err) {
                                                    //delete file after it's been downloaded
                                                    fs.unlinkSync(
                                                        `./public/proyectos/${req.params.idproyecto}/documento_completo_${req.params.idproyecto}.pdf`
                                                    );
                                                }
                                            }
                                        );
                                    })
                                    .catch(err => {
                                        console.error("Error creando registros 2: ", err);
                                    }));
                                })();

                            });

                        });

                    });
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .post('/download-zip/:idproyecto', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'readable', (error, permission) => {
                if (permission.success) {

                    Proyecto.getAllFiles(req.params.idproyecto, req.mysql, async (error, files) => {

                        const zip = new AdmZip();
                        // Comienza creando el índice a partir de elemenento html recibido en body
                        const html = req.body.element;
                        const indicePdfPath = './public/proyectos/' + req.params.idproyecto + '/indice_' + req.params.idproyecto + '.pdf';

                        pdf.create(html, { 
                            "format": "Letter",
                            "border": {
                                "top": "0.5in",            // default is 0, units: mm, cm, in, px
                                "right": "0.5in",
                                "bottom": "0.5in",
                                "left": "0.5in"
                              }
                         }).toFile(indicePdfPath, function(err, _res) {
                            if (err) {
                                console.log(err);
                            }

                            const pathFile = indicePdfPath;
                            zip.addLocalFile(pathFile);

                            files.result.proyectodocumento.map(async file => {
                                const folderPos = file.url.indexOf('/proyectos/') + 11;
                                const _documento = file.url.substring(folderPos);
                                const pathFile =  './public/proyectos/' + _documento;
                                // add local file
                                zip.addLocalFile(pathFile);
                            });

                            files.result.proyectoreporte.map(async file => {
                                const folderPos = file.url.indexOf('/proyectos/') + 11;
                                const _documento = file.url.substring(folderPos);
                                const pathFile =  './public/proyectos/' + _documento;
                                // add local file
                                zip.addLocalFile(pathFile);
                            });

                            const date = Date.now() + '___';

                            zip.writeZip(
                                `./public/proyectos/zips/${date}zipfile.zip`,
                                err => {
                                if (err) {
                                    console.log(err);
                                }
                                res.download(
                                    `./public/proyectos/zips/${date}zipfile.zip`,
                                    function(err) {
                                        if (!err) {
                                            //delete file after it's been downloaded
                                            fs.unlinkSync(
                                                `./public/proyectos/zips/${date}zipfile.zip`
                                            );
                                        }
                                    }
                                );
                                }
                            );
                        });
                    });
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .delete('/:id', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'deleteable', (error, permission) => {
                if (permission.success) {
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.logicRemove(req.params.id, created_by, req.mysql, (error, data) => {
                                                
                        if (!error) {
                            const idProyecto = req.params.id;

                            // GUARDAR EN LOGS
                            const logs = {
                                si_modulo_idsi_modulo: 13,
                                accion:  `Proyecto eliminado: ${idProyecto}`,
                                created_by: auth_data.user.idsi_user
                            };

                            Logs.insert(logs, req.mysql, (error, data) => {
                                console.log('Logs actualizado');
                            });
                        }
                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .patch('/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'updateable', (error, permission) => {
                if (permission.success) {
                    const _proyecto = req.body;
                    const created_by = (permission.only_own) ? auth_data.user.idsi_user : false;
                    Proyecto.update(_proyecto, created_by, req.mysql, (error, data) => {
                        
                        if (!error) {
                            const idProyecto = _proyecto.idproyecto;

                            // GUARDAR EN LOGS
                            const logs = {
                                si_modulo_idsi_modulo: 13,
                                accion:  `Registro actualizado: ${data.result.insertId}, Proyecto: ${idProyecto}`,
                                created_by: auth_data.user.idsi_user
                            };

                            Logs.insert(logs, req.mysql, (error, data) => {
                                console.log('Logs actualizado');
                            });
                        }

                        return Proyecto.response(res, error, data);
                    })
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .post('/', (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyecto', auth_data.user.super, 'writeable', (error, permission) => {
                if (permission.success) {
                    const _proyecto = req.body;
                    _proyecto.created_by = auth_data.user.idsi_user;
                    Proyecto.insert( _proyecto, req.mysql, (error, data) => {

                        if (error === null && data.success) {

                            // GUARDAR EN LOGS
                            const logs = {
                                si_modulo_idsi_modulo: 13,
                                accion:  `Proyecto creado: ${data.result.insertId}`,
                                created_by: auth_data.user.idsi_user
                            };

                            Logs.insert(logs, req.mysql, (error, _data) => {
                                return Proyecto.response(res, error, data);
                            });
                        } else {
                            return Proyecto.response(res, error, data);
                        }

                    });
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })
    .post('/importfromcsv', upload.single('documento'), (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {

            if( !auth_data )
                return next('auth_data refused');
 
            permissions.module_permission(auth_data.modules, 'proyectoequipo', auth_data.user.super, 'updateable', (error, permission) => {
                if (permission.success) {
                    const _proyecto = req.body;
                    _proyecto.created_by = auth_data.user.idsi_user;

                    if (req.file && req.file.filename) {
                        const _url = process.env.HOST || req.protocol + '://' + req.get('host');
                        const _documento =  './public/proyectos/' + req.file.filename;

                        const resultEquipos = [];
                        
                        // PRIMERO COLOCAR EN DISCO Y DESPUÉS LEER
                        fs.readFile(_documento, 'utf8', function (err, data) {
                            if (err) {
                                console.error('error', err);
                            }
                            var dataArray = data.split(/\r?\n/);
                            dataArray = dataArray.filter(o => o !== '');
                            dataArray.shift();

                            (async () => {
                                await queue.add(() => Promise.all(
                                    dataArray.map(async row => {

                                        (async () => {
                                            await queue.add(() => new Promise((resolve, reject) => {

                                                const result = getProyectoequipoReportesFromRow(row, _proyecto.idproyecto, auth_data.user.idsi_user);
                                                const proyectoequipo = result[0];
                                                const reportes = result[1];
                                                const tipo = result[2];
                                                    
                                                if (!proyectoequipo) {
                                                    resolve(data);
                                                }

                                                Proyectoequipo.insert(proyectoequipo, req.mysql, (error, data) => {
                                                    if (error) {
                                                        console.error('Proyectoequipo falló al crearse en importación desde .csv');
                                                        reject('Proyectoequipo falló al crearse en importación desde .csv');
                                                    } else {
                                                        // Después de insertar un equipo debe de barrer listado de reportes a asociarse al equipo
                                                        const idproyectoequipo = data.result.insertId;

                                                        // Para devolver a front listado de equipos insertados
                                                        resultEquipos.push(proyectoequipo);
 
                                                        if (reportes && reportes.length) {
                                                            
                                                            // Probar enviando en un solo array los ids de reportes v2.2
                                                            const proyectoreporte = {
                                                                proyecto_idproyecto: _proyecto.idproyecto,
                                                                reporte_idreporte: (Array.isArray(reportes)) ? reportes.join(',').replace(' ', '') : reportes, // Recibe como string
                                                                proyectoequipo_idproyectoequipo: idproyectoequipo + '||' + tipo, // Recibe idproyectoequipo y categoría concatenados
                                                                url: '',
                                                                descripcion: '',
                                                                visibleCliente: 0
                                                            };

                                                            Proyectoreporte.insert(proyectoreporte, req.mysql, (error, data) => {
                                                                if (error) {
                                                                    console.error('Proyectoreporte falló al crearse en importación desde .csv');
                                                                    reject('Proyectoreporte falló al crearse en importación desde .csv');
                                                                } else {
                                                                    resolve(data);
                                                                }
                                                            });

                                                        } else {
                                                            resolve(data);
                                                        }
                                                    }
                                                });
                                            }));
                                        })();
                                    }
                                ))
                                .then(() => {
                                    // GUARDAR EN LOGS
                                    const logs = {
                                        si_modulo_idsi_modulo: 13,
                                        accion:  `CSV Importado a Proyecto: ${_proyecto.idproyecto}`,
                                        created_by: auth_data.user.idsi_user
                                    };

                                    Logs.insert(logs, req.mysql, (error, data) => {
                                        // AL LEERSE ELIMINARSE DEL DISCO
                                        fs.unlinkSync(_documento, function() { consolle.log('Removed: ' + _documento); });
                                        return Proyecto.response(res, error, {success: true, result: resultEquipos, message: '¡Importación de .CSV correcta!.'});
                                    });
                                })
                                .catch(err => {
                                    console.error("Error creando registros de equipos a proyecto, razón: ", err);
                                    return Proyecto.response(res, err, data);
                                }));
                            })();
                        });
                    }
                } else {
                    return Proyecto.response(res, error, permission);
                }
            });
        })(req, res, next);
    })

    
    .post('/evidencia', upload.single('evidencia'), (req, res, next) => {
        passport.authenticate('jwt', { session: true }, (err, auth_data, info) => {
            if (!auth_data) {
                return next('auth_data refused');
            }
            permissions.module_permission(auth_data.modules, 'cadenapruebaestado', auth_data.user.super, 'writeable', (error, permission) => {
                if (permission.success) {
                    const _cadenapruebaestado = req.body;
                    _cadenapruebaestado.created_by = auth_data.user.idsi_user;

                    
                    if (req.file && req.file.filename) {
                        const _url = process.env.HOST || req.protocol + '://' + req.get('host');
                        const evidencia =  _url + '/clientes/muestras/' + req.file.filename;
                        _cadenapruebaestado.evidencia = evidencia;
                    }

                    Cadenapruebaestado.insert( _cadenapruebaestado, req.mysql, (error, dataPost) => { 

                        if (error) {
                            console.error(error);
                            return next('Error');
                        }

                        const idCadenaprueba = dataPost.result.identificadorMuestra;

                        // GUARDAR EN LOGS
                        const logs = {
                            si_modulo_idsi_modulo: 41, // cadenapruebaestados
                            accion:  `Registro creado: ${dataPost.result.insertId}, CadenaPrueba: ${idCadenaprueba}, Proyecto: ${dataPost.result.proyecto_idproyecto}`,
                            created_by: auth_data.user.idsi_user
                        };

                        Logs.insert(logs, req.mysql, (error, data) => {
                            console.log('Logs actualizado');
                        });

                        const titulo = `LA MUESTRA CON IDENTIFICADOR: ${idCadenaprueba} DEL PROYECTO FOLIO: ${dataPost.result.proyecto_idproyecto} HA CAMBIADO DE ESTADO.`;
                        const mensaje = `LA MUESTRA CON IDENTIFICADOR: ${idCadenaprueba} DEL PROYECTO FOLIO: ${dataPost.result.proyecto_idproyecto} HA CAMBIADO DE ESTADO, POR FAVOR ACCEDA AL SISTEMA PARA REVISAR SU ESTADO.`;
                        const enlace = "pages/cadenapruebaestados/identificadormuestra/" + idCadenaprueba;

                        const notificar = [
                            titulo,
                            mensaje,
                            enlace
                        ];

                        // PRIMERO, SI ES UNA AVERIA Y TIENE UNA ACCIÓN
                        if ( _cadenapruebaestado.estadoactividad_idestadoactividad === 9  && _cadenapruebaestado.accion !== '' && _cadenapruebaestado.accion !== 'NA' ) {

                            if (dataPost.result.notificarArea || dataPost.result.notificarUsuarios) {
                                if (dataPost.result.notificarUsuarios && dataPost.result.notificarArea ) {
                                    // ENVIAR A ALERTA NOTIFICARPORAREA
                                    Alerta.notificarPorArea(dataPost.result, notificar, req.mysql, (error, data) => {
                                        // ENVIAR A ALERTA NOTIFICARPORAREA
                                        Alerta.notificarPorUsuarios(dataPost.result, notificar, req.mysql, (_error, _data) => {
                                            return Cadenapruebaestado.response(res, _error, dataPost);
                                        });
                                    });
                                } else if (dataPost.result.notificarUsuarios && !dataPost.result.notificarArea) {
                                    // ENVIAR A ALERTA NOTIFICARPORAREA
                                    Alerta.notificarPorUsuarios(dataPost.result, notificar, req.mysql, (error, data) => {
                                        return Cadenapruebaestado.response(res, error, dataPost);
                                    });
                                } else if (!dataPost.result.notificarUsuarios && dataPost.result.notificarArea) {
                                    // ENVIAR A ALERTA NOTIFICARPORAREA
                                    Alerta.notificarPorArea(dataPost.result, notificar, req.mysql, (error, data) => {
                                        return Cadenapruebaestado.response(res, error, dataPost);
                                    });
                                } 
                            } else {

                                // notificar solo a cliente
                                if (dataPost.result.cliente_email && dataPost.result.cliente_idsi_user) {
                                    const _alerta = {
                                        emailDestinatario: dataPost.result.cliente_email, 
                                        mensaje:  mensaje,
                                        titulo: titulo,
                                        enlace: enlace,
                                        si_user_idsi_user: dataPost.result.cliente_idsi_user,
                                        tipoAlerta: 'ALERTA'
                                    };

                                    Alerta.insert(_alerta, req.mysql, (_error, _data) => {
                                        return Cadenapruebaestado.response(res, _error, dataPost);
                                    });
                                } else {
                                    return Cadenapruebaestado.response(res, error, dataPost);
                                }

                            }

                        } else {

                            // notificar solo a cliente
                            if (dataPost.result.cliente_email && dataPost.result.cliente_idsi_user) {
                                const _alerta = {
                                    emailDestinatario: dataPost.result.cliente_email, 
                                    mensaje:  mensaje,
                                    titulo: titulo,
                                    enlace: enlace,
                                    si_user_idsi_user: dataPost.result.cliente_idsi_user,
                                    tipoAlerta: 'ALERTA'
                                };

                                Alerta.insert(_alerta, req.mysql, (_error, _data) => {
                                    return Cadenapruebaestado.response(res, _error, dataPost);
                                });
                            } else {
                                return Cadenapruebaestado.response(res, error, dataPost);
                            }

                        }

                    });
                } else {
                    return Cadenapruebaestado.response(res, error, permission);
                }
            });
        })(req, res, next);
    });

module.exports = router;
