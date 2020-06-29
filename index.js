const PDFDocument = require("pdf-lib").PDFDocument;
const fs = require("fs");
const PdfReader = require("pdfreader").PdfReader;
const moment = require("moment");

async function readlines(buffer, xwidth) {
  return new Promise((resolve, reject) => {
    var pdftxt = new Array();
    var pg = 0;
    new PdfReader({}).parseBuffer(buffer, function (err, item) {
      if (err) console.log("pdf reader error: " + err);
      else if (!item) {
        pdftxt.forEach(function (a, idx) {
          pdftxt[idx].forEach(function (v, i) {
            pdftxt[idx][i].splice(1, 2);
          });
        });
        resolve(pdftxt);
      } else if (item && item.page) {
        pg = item.page - 1;
        pdftxt[pg] = [];
      } else if (item.text) {
        var t = 0;
        var sp = "";
        pdftxt[pg].forEach(function (val, idx) {
          if (val[1] == item.y) {
            if (xwidth && item.x - val[2] > xwidth) {
              sp += " ";
            } else {
              sp = "";
            }
            pdftxt[pg][idx][0] += sp + item.text;
            t = 1;
          }
        });
        if (t == 0) {
          pdftxt[pg].push([item.text, item.y, item.x]);
        }
      }
    });
  });
}

async function edit() {
  const existingPdfBytes = fs.readFileSync("./input.pdf");
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const newPdfDoc = await PDFDocument.create();
    const [_page] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(_page);

    let pdfBytes = await newPdfDoc.save();

    // const pdfFile = "./output_" + i + ".pdf";

    const buf = Buffer.from(pdfBytes);
    var lines = await readlines(buf);

    const _date1 = lines[0][2];
    const _date2 = _date1.join().replace(/ /gi, "");
    const _date3 = moment(_date2, "YYYY년M월DD일");
    const _date = _date3.format("YYMMDD");

    console.log(i, _date);
    const newFileName = "./지출품의서_" + _date + "_야근특근식대.pdf";
    const isExist = await fs.existsSync(newFileName);
    if (isExist) {
      console.log("------------중복이다!", i, newFileName);
      console.log("--------------중복이다!", i);

      let buf = await fs.readFileSync(newFileName);
      const npdfDoc = await PDFDocument.load(buf);

      const [_npage] = await npdfDoc.copyPages(pdfDoc, [i]);
      npdfDoc.insertPage(1, _npage);
      pdfBytes = await npdfDoc.save();
    }

    // 파일쓰기
    console.log(newFileName);
    await fs.writeFileSync(newFileName, pdfBytes);
  }
}

edit();
