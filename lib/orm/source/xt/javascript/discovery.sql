select xt.install_js('XT','Discovery','xtuple', $$

  /**
   * @class
   *
   * The XT.Discovery class includes all functions necessary to return an
   * API Discovery document: (https://developers.google.com/discovery/v1/using)
   */

  XT.Discovery = {};

  XT.Discovery.isDispatchable = true;

  /**
   * Return a API Discovery document for this database's ORM where isRest = true.
   *
   * @param {String} Optional. An orm_type name like "Contact".
   * @param {String} Optional. The rootUrl path of the API. e.g. "https://www.example.com/"
   * @returns {Object}
   */
  XT.Discovery.getDiscovery = function(orm, rootUrl) {
    var discovery = {},
        org = plv8.execute("select current_database()"),
        orms = XT.Discovery.getIsRestORMs(orm),
        rootUrl = rootUrl || "{rootUrl}",
        version = "v1alpha1";

    if (org.length !== 1) {
      return false;
    } else {
      org = org[0].current_database;
    }

    if (!orms) {
      return false;
    }

    /*
     * Header section.
     */
    discovery.kind = "discovery#restDescription";

    /* TODO - Implement etags. */
    discovery.etag = "";

    discovery.discoveryVersion = version; /* TODO - Move this to v1 for release. */
    discovery.id = org + ":" + version;
    discovery.name = org;
    discovery.version = version;
    discovery.revision = XT.Discovery.getDate();
    discovery.title = "xTuple ERP REST API",
    discovery.description = "Lets you get and manipulate xTuple ERP business objects.",
    discovery.icons = { /* TODO - Get org's icons or set a token to be replaced when this discovery document is sent. */
      "x16": "{iconx16}",
      "x32": "{iconx32}"
    };
    discovery.documentationLink = "https://dev.xtuple.com"; /* TODO - What should this be? */
    discovery.protocol = "rest",
    discovery.baseUrl = rootUrl + "api/" + version + "/";
    discovery.basePath = "/api/" + version + "/";
    discovery.rootUrl = rootUrl;
    discovery.servicePath = "api/" + version + "/";
    discovery.batchPath = "batch"; /* TODO - Support batch requests? */

    /*
     * Parameters section.
     */
    discovery.parameters = {
      "alt": {
        "type": "string",
        "description": "Data format for the response.",
        "default": "json",
        "enum": [
          "json"
        ],
        "enumDescriptions": [
          "Responses with Content-Type of application/json"
        ],
        "location": "query"
      },
      "fields": {
        "type": "string",
        "description": "Selector specifying which fields to include in a partial response.",
        "location": "query"
      },
      "oauth_token": {
        "type": "string",
        "description": "OAuth 2.0 token for the current user.",
        "location": "query"
      },
      "prettyPrint": {
        "type": "boolean",
        "description": "Returns response with indentations and line breaks.",
        "default": "true",
        "location": "query"
      },
    };

    /*
     * Auth section.
     */
    discovery.auth = {
      "oauth2": {
        "scopes": {}
      }
    };

    /* Set base full access scope. */
    discovery.auth.oauth2.scopes[rootUrl + "auth/" + org] = {
      "description": "Full access to all '" + org + "' resources"
    }

    /* Loop through exposed ORM models and build scopes. */
    for (var i = 0; i < orms.length; i++) {
      var ormType = orms[i].orm_type,
          ormTypeHyphen = ormType.camelToHyphen();

      /* TODO - Do we need to include "XM" in the name? */
      discovery.auth.oauth2.scopes[rootUrl + "auth/" + org + "/" + ormTypeHyphen] = {
        "description": "Manage " + orms[i].orm_type + " resources"
      }
      discovery.auth.oauth2.scopes[rootUrl + "auth/" + org + "/" + ormTypeHyphen + ".readonly"] = {
        "description": "View " + orms[i].orm_type + " resources"
      }
    }

    /*
     * Schema section.
     */
    schemas = {};
    XT.Discovery.getORMSchemas(orms, schemas);

    if (!schemas) {
      return false;
    }

    var listItemOrms = [];

    /* Get parent ListItem ORMs */
    for (var i = 0; i < orms.length; i++) {
      listItemOrms[i] = {"orm_namespace": orms[i].orm_namespace, "orm_type": orms[i].orm_type + "ListItem"};
    }

    if (listItemOrms.length) {
      XT.Discovery.getORMSchemas(listItemOrms, schemas);
    }

    /* Sort schema properties alphabetically. */
    discovery.schemas = XT.Discovery.sortObject(schemas);

    /*
     * Resources section.
     */
    discovery.resources = {};

    /* Loop through exposed ORM models and build resources. */
    for (var i = 0; i < orms.length; i++) {
      var ormType = orms[i].orm_type,
          ormTypeHyphen = ormType.camelToHyphen(),
          primKeyProp = XT.Discovery.getPrimaryKeyProps(discovery.schemas[ormType]);

      discovery.resources[ormType] = {};
      discovery.resources[ormType].methods = {};

      /*
       * delete
       */
      discovery.resources[ormType].methods.delete = {
        "id": ormTypeHyphen + "-id.delete",
        "path": ormTypeHyphen + "/{" + ormTypeHyphen + "-id}",
        "httpMethod": "DELETE",
        "description": "Deletes a single " + ormType + " record.",
      };

      discovery.resources[ormType].methods.delete.parameters = {};
      discovery.resources[ormType].methods.delete.parameters[ormTypeHyphen + "-id"] = primKeyProp;

      discovery.resources[ormType].methods.delete.parameterOrder = [ormTypeHyphen + "-id"];

      discovery.resources[ormType].methods.delete.scopes = [
        rootUrl + "auth/" + org,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen
      ];

      /*
       * get
       */
      discovery.resources[ormType].methods.get = {
        "id": ormTypeHyphen + "-id.get",
        "path": ormTypeHyphen + "/{" + ormTypeHyphen + "-id}",
        "httpMethod": "GET",
        "description": "Gets a single " + ormType + " record.",
      };

      discovery.resources[ormType].methods.get.parameters = {};
      discovery.resources[ormType].methods.get.parameters[ormTypeHyphen + "-id"] = primKeyProp;

      discovery.resources[ormType].methods.get.parameterOrder = [ormTypeHyphen + "-id"];

      discovery.resources[ormType].methods.get.response = {
        "ref$": ormType
      };

      discovery.resources[ormType].methods.get.scopes = [
        rootUrl + "auth/" + org,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen + ".readonly"
      ];

      /*
       * head
       */
      discovery.resources[ormType].methods.head = {
        "id": ormTypeHyphen + "-id.head",
        "path": ormTypeHyphen + "/{" + ormTypeHyphen + "-id}",
        "httpMethod": "HEAD",
        "description": "Returns the HTTP Header as if you made a GET request for a single " + ormType + " record, but will not return any response body.",
      };

      discovery.resources[ormType].methods.head.parameters = {};
      discovery.resources[ormType].methods.head.parameters[ormTypeHyphen + "-id"] = primKeyProp;

      discovery.resources[ormType].methods.head.parameterOrder = [ormTypeHyphen + "-id"];

      discovery.resources[ormType].methods.head.scopes = [
        rootUrl + "auth/" + org,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen + ".readonly"
      ];

      /*
       * insert
       */
      discovery.resources[ormType].methods.insert = {
        "id": ormTypeHyphen + "-id.insert",
        "path": ormTypeHyphen,
        "httpMethod": "POST",
        "description": "Add a single " + ormType + " record.",
      };

      discovery.resources[ormType].methods.insert.request = {
        "ref$": ormType
      };

      discovery.resources[ormType].methods.insert.response = {
        "ref$": ormType
      };

      discovery.resources[ormType].methods.insert.scopes = [
        rootUrl + "auth/" + org,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen
      ];

      /*
       * list
       */
      discovery.resources[ormType].methods.list = {
        "id": ormTypeHyphen + "-id.list",
        "path": ormTypeHyphen,
        "httpMethod": "GET",
        "description": "Returns a list of " + ormType + " records.",
      };

      discovery.resources[ormType].methods.list.parameters = {
        "maxResults": {
          "type": "integer",
          "description": "Maximum number of entries returned on one result page. Optional.",
          "format": "int32",
          "minimum": "1",
          "location": "query"
        },
        "q": {
          "type": "string",
          "description": "Free text search terms to find events that match these terms in any field. Optional.",
          "location": "query"
        },
        "pageToken": {
          "type": "string",
          "description": "Token specifying which result page to return. Optional.",
          "location": "query"
        }
      };

      discovery.resources[ormType].methods.list.response = {
        "ref$": ormType + "ListItem"
      };

      discovery.resources[ormType].methods.list.scopes = [
        rootUrl + "auth/" + org,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen + ".readonly"
      ];

      /*
       * listhead
       */
      discovery.resources[ormType].methods.listhead = {
        "id": ormTypeHyphen + "-id.listhead",
        "path": ormTypeHyphen,
        "httpMethod": "HEAD",
        "description": "Returns the HTTP Header as if you made a GET request for a list of " + ormType + " records, but will not return any response body.",
      };

      discovery.resources[ormType].methods.listhead.parameters = {
        "maxResults": {
          "type": "integer",
          "description": "Maximum number of entries returned on one result page. Optional.",
          "format": "int32",
          "minimum": "1",
          "location": "query"
        },
        "q": {
          "type": "string",
          "description": "Free text search terms to find events that match these terms in any field. Optional.",
          "location": "query"
        },
        "pageToken": {
          "type": "string",
          "description": "Token specifying which result page to return. Optional.",
          "location": "query"
        }
      };

      discovery.resources[ormType].methods.listhead.scopes = [
        rootUrl + "auth/" + org,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen + ".readonly"
      ];

      /*
       * patch
       */
      discovery.resources[ormType].methods.patch = {
        "id": ormTypeHyphen + "-id.patch",
        "path": ormTypeHyphen + "/{" + ormTypeHyphen + "-id}",
        "httpMethod": "PATCH",
        "description": "Modifies a single " + ormType + " record. This method supports JSON-Patch semantics.",
      };

      discovery.resources[ormType].methods.patch.parameters = {};
      discovery.resources[ormType].methods.patch.parameters[ormTypeHyphen + "-id"] = primKeyProp;

      discovery.resources[ormType].methods.patch.parameterOrder = [ormTypeHyphen + "-id"];

      discovery.resources[ormType].methods.patch.request = {
        "ref$": ormType
      };

      discovery.resources[ormType].methods.patch.response = {
        "ref$": ormType
      };

      discovery.resources[ormType].methods.patch.scopes = [
        rootUrl + "auth/" + org,
        rootUrl + "auth/" + org + "/" + ormTypeHyphen
      ];
    }

    /* return the results */
    return discovery;
  }


  /*
   * Helper function to convert date to string in yyyyMMdd format.
   *
   * @returns {String}
   */
  XT.Discovery.getDate = function() {
    var today = new Date(),
        year = today.getUTCFullYear(),
        month = today.getUTCMonth() + 1,
        day = today.getUTCDate();

    /* Convert to string and preserve leading zero. */
    if (day < 10) {
      day = "0" + day;
    } else {
      day = "" + day;
    }

    if (month < 10) {
      month = "0" + month;
    } else {
      month = "" + month;
    }

    year = "" + year;

    return year + month + day;
  }


  /*
   * Helper function to sort the schemas properties alphabetically.
   * Note: ECMA-262 does not specify enumeration order. This is just for
   * human readability in outputted JSON.
   *
   * @param {Object} Object of JSON-Schemas.
   * @returns {Object}
   */
  XT.Discovery.sortObject = function(obj) {
    var sorted = {},
        key,
        arr = [];

    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(key);
      }
    }

    arr.sort();

    for (key = 0; key < arr.length; key++) {
        sorted[arr[key]] = obj[arr[key]];
    }
    return sorted;
  }

  /*
   * Helper function to get a single or all isRest ORM Models.
   *
   * @param {String} Optional. An orm_type name like "Contact".
   * @returns {Object}
   */
  XT.Discovery.getIsRestORMs = function(orm) {
    /* TODO - Do we need to include "XM" in the propName? */
    var sql = "select orm_namespace, orm_type from xt.orm where orm_rest ",
        sqlend = "group by orm_namespace, orm_type order by orm_namespace, orm_type",
        orms = [];

    if (orm) {
      sql = sql + "and orm_type = $1 " + sqlend;
      orms = plv8.execute(sql, [orm]);
    } else {
      sql = sql + sqlend;
      orms = plv8.execute(sql);
    }

    if (!orms.length) {
      return false;
    }

    return orms;
  }

  /*
   * Helper function to get a JSON-Schema for ORM Models.
   *
   * @param {String} An array of orm objects name like [{"orm_namespace": "XM", "orm_type":"Contact"}].
   * @returns {Object}
   */
  XT.Discovery.getORMSchemas = function(orms, schemas) {
    schemas = schemas || {};

    if (!orms.length) {
      return false;
    }

    /* Loop through the returned ORMs and get their JSON-Schema. */
    for (var i = 0; i < orms.length; i++) {
      /* TODO - Do we need to include "XM" in the propName? */
      var propName = orms[i].orm_type;

      /* Only get this parent schema if we don't already have it. */
      if (!schemas[propName]) {
        /* Get parent ORM */
        schemas[propName] = XT.Schema.getProperties({"nameSpace": orms[i].orm_namespace, "type": orms[i].orm_type});
      }

      if (!schemas[propName] || !schemas[propName].properties) {
        return false;
      }

      /* Drill down through schemas and get all $ref schemas. */
      for (var prop in schemas[propName].properties) {
        var childProp = schemas[propName].properties[prop];

        if (childProp) {
          if (childProp.items && childProp.items["$ref"]){
            var childOrm = childProp.items["$ref"];
          } else if (childProp["$ref"]){
            var childOrm = childProp["$ref"];
          }

          /* Only get this child schema if we don't already have it. */
          if (childOrm && !schemas[childOrm]) {
            /* Recusing into children. */
            schemas = XT.extend(schemas, XT.Discovery.getORMSchemas([{ "orm_namespace": "XM", "orm_type": childOrm }]));
          }
        }
      }
    }

    return schemas;
  }


  /*
   * Helper function to find the primary key for a JSON-Schema and return it's properties.
   *
   * @param {Object} A JSON-Schema object.
   * @returns {Object}
   */
  XT.Discovery.getPrimaryKeyProps = function(schema) {
    for (var prop in schema.properties) {
      if (schema.properties[prop].isPrimaryKey) {
        var primKeyProp = {};

        /* Use extend so we can delete without affecting schema.properties[prop]. */
        primKeyProp = XT.extend(primKeyProp, schema.properties[prop]);

        /* Delete these properties which are not needed for a resource's parameters. */
        delete primKeyProp.isPrimaryKey;
        delete primKeyProp.title;
        delete primKeyProp.required;

        return primKeyProp;
      }
    }

    return false;
  }
  $$ );
