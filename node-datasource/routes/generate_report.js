/*jshint node:true, indent:2, curly:false, eqeqeq:true, immed:true, latedef:true, newcap:true, noarg:true,
regexp:true, undef:true, strict:true, trailing:true, white:true */
/*global X:true, XT:true, XM:true, SYS:true */

(function () {
  "use strict";

  // https://localhost:8543/qatest/generate-report?nameSpace=XM&type=Invoice&id=60000
  /*
    TODO: fetch images from database
    TODO: translations
    TODO: get on fluentreports 0.0.2. Pity Nathanael hasn't published 0.0.2 to npm yet.

  */


  //
  // DEPENDENCIES
  //

  var _ = require("underscore"),
    async = require("async"),
    fs = require("fs"),
    path = require("path"),
    Report = require('fluentreports').Report,
    queryForData = require("./report").queryForData;


  var generateReport = function (req, res) {

    //
    // VARIABLES THAT SPAN MULTIPLE STEPS
    //
    var reportDefinition;
    var reportData;
    var username = req.session.passport.user.id;
    var databaseName = req.session.passport.user.organization;
    var reportName = req.query.type.toLowerCase() + req.query.id + ".pdf";
    var reportPath = path.join(__dirname, "../temp", databaseName, reportName);
    //
    // HELPER FUNCTIONS FOR DATA TRANSFORMATION
    //

    /**
      We receive the data in the form we're familiar with: an object that represents the head,
      which has an array that represents item data (such as InvoiceLines).

      Fluent expects the data to be just an array, which is the array of the line items with
      head info copied redundantly.

      As a convention we'll put a * as prefix in front of the keys of the item data.

      This function performs both these transformtations on the data object.
    */
    var transformDataStructure = function (data) {
      // TODO: detailAttribute could be inferred by looking at whatever comes before the *
      // in the detailElements definition.
      return _.map(data[reportDefinition.settings.detailAttribute], function (detail) {
        var pathedDetail = {};
        _.each(detail, function (detailValue, detailKey) {
          pathedDetail[reportDefinition.settings.detailAttribute + "*" + detailKey] = detailValue;
        });
        return _.extend({}, data, pathedDetail);
      });
    };

    // I'm sure this is already written somewhere else in our app. Akin to getValue() on a model.
    var traverseDots = function (data, key) {
      while (key.indexOf(".") >= 0) {
        data = data[key.prefix()];
        key = key.suffix();
      }
      return data[key];
    };

    /**
      Resolve the xTuple JSON convention for report element definition to the
      output expected from fluentReports by swapping in the data fields.

      FluentReports wants its definition key to be a string in some cases (see the
      textOnly parameter), and in other cases in the "data" attribute of an object.

      The xTuple standard is to use "text" or "attr" instead of data. Text means text,
      attr refers to the attribute name on the data object. This function accepts either
      and crams the appropriate value into "data" for fluent (or just returns the string).
     */
    var marryData = function (detailDef, data, textOnly) {
      return _.map(detailDef, function (def) {
        var text = def.attr ? traverseDots(data, def.attr) : def.text;
        if (def.label === true) {
          text = ("_" + def.attr).loc() + ": " + text;
        } else if (def.label) {
          text = def.label + ": " + text;
        }
        if (textOnly) {
          return text;
        }

        // TODO: maybe support any attributes? Right now we ignore all but these three
        return {
          data: text,
          width: def.width,
          align: def.align || 2 // default to "center"
        };
      });
    };

    /**
      Custom transformations depending on the element descriptions.

      TODO: support custom transforms like def.transform === 'address' which would need
      to do stuff like smash city state zip into one line. The function to do this can't live
      in the json definition, but we can support a set of custom transformations here
      that can be referred to in the json definition.
     */
    var transformElementData = function (def, data) {
      var textOnly;

      if (typeof def.definition === 'string') {
        // element: image, for example
        return def.definition;
      }

      // "print" elements (aka the default) only want strings as the definition
      textOnly = def.element === "print" || !def.element;
      return marryData(def.definition, data, textOnly);
    };

    /**
      The "element" (default to "print") is the method on the report
      object that we are going to call to draw the pdf. That's the magic
      that lets us represent the fluentReport functions as json objects.
    */
    var printDefinition = function (report, data, definition) {
      _.each(definition, function (def) {
        var elementData = transformElementData(def, data);
        report[def.element || "print"](elementData, def.options);
      });
    };


    //
    // STEPS TO PERFORM ROUTE
    //

    /**
      Make a directory node-datasource/temp if none exists
     */
    var createTempDir = function (done) {
      fs.exists("./temp", function (exists) {
        if (exists) {
          done();
        } else {
          fs.mkdir("./temp", done);
        }
      });
    };

    /**
      Make a directory node-datasource/temp/orgname if none exists
     */
    var createTempOrgDir = function (done) {
      fs.exists("./temp/" + databaseName, function (exists) {
        if (exists) {
          done();
        } else {
          fs.mkdir("./temp/" + databaseName, done);
        }
      });
    };

    /**
      Fetch the highest-grade report definition for this business object.
     */
    var fetchReportDefinition = function (done) {
      var reportDefinitionColl = new SYS.ReportDefinitionCollection(),
        afterFetch = function () {
          if (reportDefinitionColl.getStatus() === XM.Model.READY_CLEAN) {
            reportDefinitionColl.off("statusChange", afterFetch);
            reportDefinition = JSON.parse(reportDefinitionColl.models[0].get("definition"));
            done();
          }
        };

      reportDefinitionColl.on("statusChange", afterFetch);
      reportDefinitionColl.fetch({
        query: {
          parameters: [{
            attribute: "recordType",
            value: req.query.nameSpace + "." + req.query.type
          }],
          rowLimit: 1,
          orderBy: [{
            attribute: "grade",
            descending: true
          }]
        },
        database: databaseName,
        username: username
      });
    };

    /**
      TODO
      We support an image element in the json definition. The definition of that element
      is a string that could refer to a description (or perhaps name) of a XM.File. We
      can fetch that file, put it in the temp directory, and then refer to it by whatever
      name we like when we build the report. Then we have to worry about cleaning it up,
      or caching it.
     */
    var fetchImages = function (done) {
      // TODO
      done();
    };

    /**
      TODO: develop a protocol for defining barcodes in the definition file. A simple
      implementation would then involve creating an image file in the temp directory
      using some npm package, and then including it as an image in the report.
     */
    var fetchBarcodes = function (done) {
      // TODO
      done();
    };

    /**
      Get the data for this business object.
      TODO: support lists (i.e. no id)
     */
    var fetchData = function (done) {
      var requestDetails = {
        nameSpace: req.query.nameSpace,
        type: req.query.type,
        id: req.query.id
      };
      var callback = function (result) {
        if (!result || result.isError) {
          done(result || "Invalid query");
          return;
        }
        reportData = transformDataStructure(result.data.data);
        done();
      };

      queryForData(req.session, requestDetails, callback);
    };

    /**
      Generate the report by calling fluentReports.
     */
    var printReport = function (done) {

      var printHeader = function (report, data) {
        printDefinition(report, data, reportDefinition.headerElements);
      };

      var printDetail = function (report, data) {
        printDefinition(report, data, reportDefinition.detailElements);
      };

      var printFooter = function (report, data) {
        printDefinition(report, data, reportDefinition.footerElements);
      };

      var rpt = new Report(reportPath)
          .data(reportData)
          .detail(printDetail)
          .footer(printFooter)
          .header(printHeader)
          .fontSize(reportDefinition.settings.defaultFontSize);

      // Debug output is always nice (Optional, to help you see the structure)
      //rpt.printStructure();

      rpt.render(done);
    };


    /**
      Dispatch the report however the client wants it
        -Email (TODO: implement for real)
        -Silent Print (TODO)
        -Stream download
        -Display to browser

      TODO: each of these options could be its own function, and this function
      can just call the appropriate one.
    */
    var sendReport = function (done) {
      fs.readFile(reportPath, function (err, data) {
        if (err) {
          res.send({isError: true, error: err});
          return;
        }
        if (req.query.action === "email") {
          var mailContent = {
            from: "no-reply@xtuple.com",
            to: "shackbarth@xtuple.com",
            subject: "hi",
            text: "Here is your email",
            attachments: [{fileName: reportPath, contents: data, contentType: "application/pdf"}]
          };
          var callback = function (error, response) {
              if (error) {
                X.log("Email error", error);
                res.send({isError: true, message: "Error emailing"});
              } else {
                res.send({message: "Email success"});
              }
            };

          X.smtpTransport.sendMail(mailContent, callback);
          done();
          return;
        }
        res.header("Content-Type", "application/pdf");

        if (req.query.action === "download") {
          res.attachment(reportPath);
        }
        res.send(data);
        done();
      });
    };

    /**
     TODO
     Do we want to clean these all up every time? Do we want to cache them? Do we want to worry
     about files getting left there if the route crashes before cleanup?
     */
    var cleanUpFiles = function (done) {
      // TODO
      done();
    };

    //
    // Actually perform the operations, one at a time
    //

    async.series([
      createTempDir,
      createTempOrgDir,
      fetchReportDefinition,
      fetchImages,
      fetchBarcodes,
      fetchData,
      printReport,
      sendReport,
      cleanUpFiles
    ], function (err, results) {
      if (err) {
        console.log(err);
        res.send({isError: true, message: err.description});
      }
    });
  };

  exports.generateReport = generateReport;

}());

