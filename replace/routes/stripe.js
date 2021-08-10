const router = require('express').Router();

const Liquidacion = require('../models/si_liquidacion');
const Si_user = require('../models/si_user');
const Alerta = require('../models/si_alerta');
const Pagoliquidacion = require('../models/si_pagoliquidacion');
const bodyParser = require('body-parser');

const dotenv = require('dotenv');
dotenv.config();

const host = process.env.APP_PRODURL;
// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SK);


// Find your endpoint's secret in your Dashboard's webhook settings
// https://plataforma-x.com/api/stripe/payment_intent_succeeded
const endpointSecret = process.env.ENDPOINT_SECRET;



const fulfillOrder = (session, req, res) => {
    /*
    allow_promotion_codes: null
    amount_subtotal: 9000
    amount_total: 9000
    billing_address_collection: null
    cancel_url: "http://localhost:4200/#/pages/pagos/pago-fallido"
    client_reference_id: null
    currency: "mxn"
    customer: "cus_IjCmzPeuQMOBBV"
    customer_email: null
    id: "cs_test_a1bebLMcm9f7MkVYFsJVw9ib3AvqxERiDV5nD4Fgp4w74aZOTTno0x5WvO"
    livemode: false
    locale: null
    metadata: {}
    mode: "payment"
    object: "checkout.session"
    payment_intent: "pi_1I7kN1F35OPRMxEaZ8w1QJZ1"
    payment_method_types: ["card"]
    0: "card"
    payment_status: "paid"
    setup_intent: null
    shipping: null
    shipping_address_collection: null
    submit_type: null
    subscription: null
    success_url: "http://localhost:4200/#/pages/pagos/pago-exitoso?session_id={CHECKOUT_SESSION_ID}"
    total_details: {amount_discount: 0, amount_tax: 0}
    amount_discount: 0
    amount_tax: 0
    */
    if (!session.client_reference_id || !session.customer) {
        res.status(400).json({success: false, result: {}, message: 'No se encontró la información requerida desde Stripe'});
    }

    const idliquidacion = parseInt(session.client_reference_id.split('||')[0]);
    const residente_idresidente = parseInt(session.client_reference_id.split('||')[1]);
    const amountTotal = +session.amount_total / 100;

    // Aquí debo de updatear liquidación a pagada
    const _liquidacion = {
        idliquidacion: idliquidacion,
        residente_idresidente: residente_idresidente,
        estado_idestado: 8, // Pagada,
        saldoactual: 0,
        montopagado: amountTotal
    };

    Liquidacion.update(_liquidacion, false, req.mysql, (error, data) => {

        // Adjuntar la session en respuesta
        data.result.session = session;

        if (error) {
            res.status(400).json(error);
        } 

        // Podría incluso crear con node el pdf de la factura y adjuntar a pagoliquidación...

        // Debo crear pagoliquidación y este debe de crear la notificacion que a su vez envia correo y push notification
        const _pagoliquidacion = {
            saldoanterior: amountTotal,
            montopagado: amountTotal,
            saldoactual: 0,
            pago_idpago: 1, // Corresponde a pago 1 hecho por administrador y este no se debe borrar de db!.
            liquidacion_idliquidacion: idliquidacion,
            residente_idresidente: residente_idresidente,
            payment_intent: session.payment_intent
        };

        Pagoliquidacion.insert( _pagoliquidacion, req.mysql, (error, dataPagoliquidacion) => {

            if (error) {
                console.error('error', error);
                res.status(400).json(error);
            }
                    
            // Sacar el email del propietario
            if (data && data.success) {
                
                Si_user.findByIdResidente(_liquidacion.residente_idresidente, false, req.mysql, (error, dataSi_user) => {
                    if (error) {
                        console.error(error);
                        res.status(400).json(error);
                    } 

                    // Crear Notificación y este a su vez enviar email
                    if (dataSi_user && dataSi_user.success && dataSi_user.result[0].email && dataSi_user.result[0].idsi_user) {
                        const _alerta = {
                            emailDestinatario: dataSi_user.result[0].email,
                            mensaje: `¡En Hora Buena!, has hecho un pago exitoso para la liquidación con folio: ${_liquidacion.idliquidacion}. 
                                Por favor accesa a Plataforma y revisa este pago para descargar tu factura.`,
                            titulo: `¡En Hora Buena!, has hecho un pago exitoso.`,
                            tipoalerta_idtipoalerta: 1,
                            si_user_idsi_user: dataSi_user.result[0].idsi_user
                        };

                                            
                        // Updatear el customer id de stripe en registro de tabla si_user
                        const _si_user = {
                            idcustomer: session.customer,
                            email: (session.customer_email) ? session.customer_email : dataSi_user.result[0].email
                        };
                        Si_user.updateByEmail(_si_user, false, req.mysql, (error, dataUserUpdate) => {
                            if (error) {
                                console.error(error);
                                res.status(400).json(error);
                            } 

                            // Crea alertas
                            Alerta.insert(_alerta, req.mysql, (error, dataAlerta) => {
                                if (error) {
                                    console.error(error);
                                } 
                                if (data.message && dataSi_user.message && dataAlerta.message && dataPagoliquidacion.message && dataUserUpdate.message) {
                                    const message = `${data.message} | ${dataSi_user.message} | ${dataUserUpdate.message} | ${dataAlerta.message} | ${dataPagoliquidacion.message}`;
                                    data.message = message;
                                }
                                res.status(200).json(data);
                            });

                        });
                    
                    } else {
                        res.status(200).json({error: data});
                    }
                });

            } else {
                res.status(200).json({error: data});
            }
        });
    });
}

router
    .post('/payment_intent_succeeded', bodyParser.raw({type: 'application/json'}), (req, res) => {
        const payload = req.body;
        const sig = req.headers['stripe-signature'];
        
        let event;
        
        try {
            event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
        } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message} - ${endpointSecret} - ${JSON.stringify(payload)} - ${sig}`);
        }
        
        // Handle the checkout.session.completed event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
        
            // Fulfill the purchase...
            fulfillOrder(session, req, res);
        } 
    })

    .post('/create-checkout-session', bodyParser.json(), async (req, res) => {
        const _liquidacion = req.body;
        if (!_liquidacion.email) {
            res.status(400).send('No se enconytró un usuario de plataforma-x.');
        }
        
        const _metadata = {
            condominio: `${_liquidacion.condominio_nombre}`,
            concepto: `${_liquidacion.tipo}`,
            casa: `${_liquidacion.numero}`,
            idresidente: `${_liquidacion.residente_idresidente}`,
            userEmail: `${_liquidacion.email}`,
            idLiquidacion: `${_liquidacion.idliquidacion}`,
            fechaLiquidada: `${_liquidacion.fecha}`
        };

        const _session = {
            payment_method_types: ['card'],
            line_items: [
            {
                price_data: {
                currency: 'mxn',
                product_data: {
                    name: `${_liquidacion.condominio_nombre} ${_liquidacion.tipo} - ${_liquidacion.numero}`  
                },
                unit_amount: +_liquidacion.saldoactual.toFixed(2) * 100,
                },
                quantity: 1
            }
            ],
            metadata: _metadata,
            mode: 'payment',
            success_url: (process.env.HOST || host) + '/#/pages/pagos/pago-exitoso?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: (process.env.HOST || host) + '/#/pages/pagos/pago-fallido?session_id={CHECKOUT_SESSION_ID}',
            client_reference_id: _liquidacion.idliquidacion + '||' + _liquidacion.residente_idresidente
        };

        if (_liquidacion.idcustomer) {
            _session.customer = _liquidacion.idcustomer;
        } else {
            _session.customer_email = _liquidacion.email
        }
        const session = await stripe.checkout.sessions.create(_session);
        res.json({ id: session.id });
    })

    // Fetch the Checkout Session to display the JSON result on the success page
    .get('/checkout-session', bodyParser.json(), async (req, res) => {
        const { sessionId } = req.query;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        const data = {};

        if (session.payment_status === 'paid' && session.id) {
            data.success = true;
            data.result = {
                session: session
            };
            data.message = '¡El pago ha sido exitoso!';
        } else {
            data.success = false;
            data.result = {
                session: session
            };
            data.message = '¡El pago no se realizo!';
        }

        res.status(200).json(data);
    });


module.exports = router;
