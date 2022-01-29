const dotenv = require('dotenv');
dotenv.config();


const _ = require('lodash');
const PdfService = {};


function getHtmlHead() {

    // HTML for PDF
    return `
    <head>
      <meta charset="utf-8">
      <title></title>
      <style>
      
      html, body, div, p, header,hgroup, h1, h2,article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section {
          margin: 0;
          padding: 0;
      }
      article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section {
          display: block;
      }
      html {
          font-size: 100%;
      }
      body {
          width: 100%;
          height:100%;
          font-size: 0.8rem;
          background-color:#fff;
          color:#333;
           font-family: "  Regular", "Helvetica", "Arial", "Verdana", "sans-serif";
          -webkit-font-smoothing: antialiased;
      }
      *, *:before, *:after {
          box-sizing: border-box;
          -webkit-box-sizing: border-box;
      }

      @page Section1 {
        size: 8.27in 11.69in;
        margin: .5in .5in .5in .5in;
        mso-header-margin: .5in;
        mso-footer-margin: .5in;
        mso-paper-source: 0;
      }
      html {
          height: 100%;
          zoom: 0.55;
      }
      body {
          /* page: Section1; */
      }

      #page-container {
          /* bottom: 0;
          right: 0;
          overflow: auto;
          position: absolute;
          top: 0;
          left: 0;
          margin: 0;
          padding: 0;
          border: 0; */
      }

      .w0 {
          width: 100%;
      }

      .h0 {
          height: 100%;
      }

      .pf {
          position: relative;
          background-color: white;
          overflow: hidden;
          margin: 0;
          border: 0;
          page-break-after: auto;
      }

      .container {
          margin: 0;
          display: -webkit-box;
          display: -moz-box;
          display: -ms-flexbox;
          display: -webkit-flex;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
      }

      .header .col-sm-4, .header .col-sm-5, .header .col-sm-2, .header .col-sm-3 {
        height: 120px;
        padding: 8px 8px;
        font-size: 10px;
        text-align: center;
        display : flex;
        align-items : center;
        justify-content: center;
      }
      .title {
        padding: 7px 0;
        font-size: 12px;
        background-color: green;
        color: #fff;
        text-align: center;
      }
      .imagen {
        padding: 0 0;
        background-color: white;
        color: #333;
        text-align: center;
        height: 200px;
        display : flex;
        align-items : center;
        justify-content: center;
      }

      /*---------------------------------------—--------
         Grid system
       *----------------------------------------------- */
      .row {
          display: block;
      }
      .col {
        width: 100%;
      }
      .col-sm-4, .col-sm-5, .col-sm-3, .col-sm-2  {
          position: relative;
          min-height: 1px;
          width: 100%;
          padding-right: 12px;
          padding-left: 12px;
          font-weight: 600;
      }
      [class*="col-sm-"] {
          padding-top: 12px;
          padding-bottom: 12px;
      }
      .col-sm-4 {
          width: 33.3%;
          float: left;
      }
      .col-sm-5 {
        width: 41.6%;
        float: left;
      }
      .col-sm-3 {
        width: 25%;
        float: left;
      }
      .col-sm-2 {
        width: 16.6%;
        float: left;
      }
    </style>
    </head>
      `;
}

function getColsArray(arreglo) {
  var colsArray = [];
  if (arreglo.length) {
    for (const element in arreglo) {
      if (arreglo.hasOwnProperty(element)) {
        for (const _element in arreglo[element].capturaevidencia) {
          if (arreglo[element].capturaevidencia.hasOwnProperty(_element)) {
            var col = {
              title: arreglo[element].evidencia_evidencia_idevidencia,
              url: arreglo[element].capturaevidencia[_element].url
            };
            colsArray.push(col);
          }
        }
      }
    }
  }
  return colsArray;
}

PdfService.generateHtml = (plantillacdevidencias, cliente_logo) => {

  var colsArray = getColsArray(plantillacdevidencias);
  var pedazos = _.chunk(colsArray, 9);

  // HTML for PDF
  var html = `
  <html style="zoom: 0.55 !important;">
  ${getHtmlHead()}
  <body>`;

  for (const page in pedazos) {
    if (pedazos.hasOwnProperty(page)) {

      var evidencias = pedazos[page];

      html += `
      <div id="page-container">
        <div class="pf w0 h0" data-page-no="${page + 1}">
          
          <div class="row header">
              <div class="col-sm-3">
              <img src="${process.env.HOST}/logo.png" width="115" height="72">
              </div>
              <div class="col-sm-4">
                  <p style="text-align: center; padding-top: 8px;">
                      GRUPO EMPAQUE ROQUIN S.A. DE C.V. <br>
                      EL CASCO 1 S/N <br>
                      GER 041022B53 <br>
                      GOMEZ FARIAS, JAL.
                  </p>
              </div>
              <div class="col-sm-5">
              <img src="${cliente_logo}" height="72">
              </div>
          </div>
    
          <div class="row">`;
    
          if (evidencias.length) {
            for (const element in evidencias) {
              if (evidencias.hasOwnProperty(element)) {
    
                html += `
                <div class="col-sm-4" *ngFor="let imagen of item.capturaevidencia">
                  <div class="row">
                      <div class="col title">
                        ${evidencias[element].title}
                      </div>
                  </div>
                  <div class="row">
                      <div class="col imagen">
                        <img src="${evidencias[element].url}" alt="" style="width: 100%; height: 200px;">
                      </div>
                  </div>
                </div>
                `;
    
              }
            }
          }
    
          html += `
          </div>
        </div>
      </div>`;
    
    }
  }

  html += `
  </body>
  </html>
    `;

  return html;
}


module.exports = PdfService;