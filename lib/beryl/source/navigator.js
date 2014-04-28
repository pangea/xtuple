(function(){

  enyo.kind({
    name: "beryl.Navigator",
    classes: "container",
    published: {
      modules: [],
      selectedModule: null,
      panelCache: {},
    },
    events: {
      onListAdded: ""
    },
    fetched: {},
    components: [
      {name: "applicationHeader", classes: "row", components: [
        {content: "pCore Logo", classes: "col-lg-2"},
        {name: "searchContainer", classes: "col-lg-8", components: [
          {name: "searchInput", kind: "enyo.Input"}
        ]},
        {content: "User Menu", classes: "col-lg-1"},
        {content: "Help LInk", classes: "col-lg-1"},
      ]},
      {name: "applicationContainer", classes: "row", components: [
        // Sidebar
        {name: "sidebar", classes: "col-lg-2", components: [
          {name: "navigationMenu", components: [
            {kind: "onyx.PickerDecorator", onChange: "modulePickerChanged", components: [
              {}, // onyx.PickerButton
              {name: "modulePicker", kind: "onyx.Picker"}
            ]}
          ]},
          {name: "subModuleMenu", kind: "List", touch: true,
            onSetupItem: "setupSubModuleMenuItem", ontap: "subModuleMenuTap",
            components: [
              {name: "listItem"}
            ]
          }
        ]},
        // This scroller doesn't actuallys scroll. We need to fix.
        {name: "workspace", classes: "col-lg-10", components: [
          {name: "contentHeader", style: "min-height: 50px; background: #eee;",
            attributes: {'rv-show': 'account.name'}},
          {name: "contentPanels", kind: "Panels", margin: 0, fit: true,
            draggable: false, animate: false, panelCount: 0, classes: "scroll-ios"}
        ]}
      ]}
    ],
    create: function() {
      this.inherited(arguments);
    },
    activate: function() {
      this.buildPicker();
    },
    buildPicker: function() {
      var picker = this.$.modulePicker;
      _.each(this.getModules(), function(module, idx) {
        if (idx === 0) {
          picker.createComponent({content: module.label, active: true});
        } else {
          picker.createComponent({content: module.label});
        }
      });
    },
    setModules: function(modules) {
      this.modules = modules;
      this.modulesChanged();
    },
    modulesChanged: function() {
      var modules = this.getModules() || [],
        existingModules = this._modules || [],
        existingModule,
        existingPanel,
        panels,
        panel,
        i,
        n,
        findExistingModule = function (name) {
          return _.find(existingModules, function (module) {
            return module.name === name;
          });
        },
        findExistingPanel = function (panels, name) {
          return _.find(panels, function (panel) {
            return panel.name === name;
          });
        };

      // Build panels
      for (i = 0; i < modules.length; i++) {
        panels = modules[i].panels || [];
        existingModule = findExistingModule(modules[i].name);
        for (n = 0; n < panels.length; n++) {

          // If the panel already exists, move on
          if (existingModule) {
            existingPanel = findExistingPanel(existingModule.panels, panels[n].name);
            if (existingPanel) { continue; }
          }

          // Keep track of where this panel is being placed for later reference
          panels[n].index = this.$.contentPanels.panelCount++;

          // XXX try this: only create the first three
          if (panels[n].index < 3) {
            panels[n].status = "active";

            // Default behavior for Lists is toggle selections
            // So we can perform actions on rows. If not a List
            // this property shouldn't hurt anything
            if (panels[n].toggleSelected === undefined) {
              panels[n].toggleSelected = true;
            }
            panel = this.$.contentPanels.createComponent(panels[n]);
            if (panel instanceof XV.List) {

              // TODO: Determine if we should keep pull out. And code it up.
              // Currently there is no pullout.
              // Bubble parameter widget up to pullout
              this.doListAdded(panel);
            }
          } else {
            panels[n].status = "unborn";
          }
        }
      }

      // Cache a deep copy
      this._modules = JSON.parse(JSON.stringify(modules));
      this.render();
    },
    modulePickerChanged: function(inSender, inEvent) {
      var modules = this.getModules();
      var moduleName = inEvent.content.toLowerCase();

      var module = _.find(modules, function(mod) {
        return mod.name === moduleName;
      });

      var panels = module.panels || [],
      hasSubmenu = module.hasSubmenu !== false && panels.length;
      if (module !== this.selectedModule || enyo.Panels.isScreenNarrow()) {
        this.selectedModule = module;
        if (hasSubmenu) {
          this.$.subModuleMenu.setCount(panels.length);
          this.$.subModuleMenu.render();
        } else {
          // TODO: Figure out what to do here.
          // if no submenus, treat lke a panel
          this.setContentPanel(0);
        }
      }
    },
    setupSubModuleMenuItem: function(inSender, inEvent) {
      var module = this.getSelectedModule(),
        index = inEvent.index,
        isSelected = inSender.isSelected(index),
        panel = module.panels[index],
        name = panel && panel.name ? module.panels[index].name : "",
        // peek inside the kind to see what the label should be
        kind = panel && panel.kind ? XT.getObjectByName(panel.kind) : null,
        label = kind && kind.prototype.label ? kind.prototype.label : "",
        shortKindName;

      if (!label && kind && kind.prototype.determineLabel) {
        // some of these lists have labels that are dynamically computed,
        // so we can't rely on their being statically defined. We have to
        // compute them in the same way that their create() method would.
        shortKindName = panel.kind.substring(0, panel.kind.length - 4).substring(3);
        label = kind.prototype.determineLabel(shortKindName);

      } else if (!label) {
        label = panel ? panel.label || name : name;
      }

      this.$.listItem.setContent(label);
      // TODO: Change selected class to our own version
      this.$.listItem.addRemoveClass("onyx-selected", isSelected);
    },
    subModuleMenuTap: function(inSender, inEvent) {
      var index = inEvent.index, validIndex = index || index === 0;
      if (validIndex && inSender.isSelected(index)) { // make sure an item in the list was clicked and is selected
        this.setContentPanel(index);
      }
    },
    /**
      Renders a list and performs all the necessary auxilliary work such as hiding/showing
      the advanced search icon if appropriate. Called when a user chooses a menu item.
     */
    setContentPanel: function (index) {
      var contentPanels = this.$.contentPanels,
        module = this.getSelectedModule(),
        panelIndex = module && module.panels ? module.panels[index].index : -1,
        panelStatus = module && module.panels ? module.panels[index].status : 'unknown',
        contentHeader = this.$.contentHeader,
        panel,
        label,
        collection,
        model,
        canNotCreate = true;

      // TODO: Implement our own message clearing function. //this.clearMessage();
      if (panelStatus === 'active') {
        panel = _.find(contentPanels.children, function (child) {
          return child.index === panelIndex;
        });
      } else if (panelStatus === 'unborn') {
        // panel exists but has not been rendered. Render it.
        module.panels[index].status = 'active';

        // Default behavior for Lists is toggle selections
        // So we can perform actions on rows. If not a List
        // this property shouldn't hurt anything
        if (module.panels[index].toggleSelected === undefined) {
          module.panels[index].toggleSelected = true;
        }
        panel = contentPanels.createComponent(module.panels[index]);
        panel.render();
        if (panel instanceof XV.List) {

          // Bubble parameter widget up to pullout
          //this.doListAdded(panel);
        }

      } else if (panelStatus === 'cached') {
        module.panels[index].status = 'active';
        panel = this.panelCache[panelIndex];
        contentPanels.addChild(panel);
        panel.node = undefined; // new to enyo2.2! wipe out the node so that it can get re-rendered fresh
        panel.render();

      } else {
        XT.error("Don't know what to do with this panel status");
      }

      // If we're already here, bail
      if (contentPanels.index === this.$.contentPanels.indexOfChild(panel)) {
        return;
      }
      //
      // // cache any extraneous content panels
      // this.cachePanels();
      //
      label = panel && panel.label ? panel.label : "";
      collection = panel && panel.getCollection ? XT.getObjectByName(panel.getCollection()) : false;

      if (!panel) { return; }

      // // Make sure the advanced search icon is visible iff there is an advanced
      // // search for this list
      // if (panel.parameterWidget) {
      //   this.$.searchIconButton.setShowing(true);
      // } else {
      //   this.$.searchIconButton.setShowing(false);
      // }
      // this.doNavigatorEvent({name: panel.name, show: false});
      //
      // // Handle new button
      // this.$.newButton.setShowing(panel.canAddNew && !panel.newActions);
      // this.$.newMenuButton.setShowing(panel.canAddNew && panel.newActions);
      //
      if (panel.canAddNew && collection) {
        // Check 'couldCreate' first in case it's an info model.
        model = collection.prototype.model;
        canNotCreate = model.prototype.couldCreate ? !model.prototype.couldCreate() : !model.canCreate();
      }
      // this.$.newButton.setDisabled(canNotCreate);
      //
      // // Select panelMenu
      // if (!this.$.panelMenu.isSelected(index)) {
      //   this.$.panelMenu.select(index);
      // }
      //
      // // Select list
      contentPanels.setIndex(this.$.contentPanels.indexOfChild(panel));
      //
      // this.$.rightLabel.setContent(label);
      // if (panel.getFilterDescription) {
      //   this.setHeaderContent(panel.getFilterDescription());
      // }
      if (panel.fetch && !this.fetched[panelIndex]) {
        this.fetch();
        this.fetched[panelIndex] = true;
      }

      //
      // this.buildMenus();
      // this.$.contentToolbar.resized();
      //
      contentHeader.destroyClientControls();
      if (panel.headerComponents) {
        console.log(panel.headerComponents);
        contentHeader.createComponents(panel.headerComponents);
        contentHeader.render();
      }
    },
    /**
      The navigator only keeps three panels in the DOM at a time. Anything extra panels
      will be periodically cached into the panelCache published field and removed from the DOM.
    */
    cachePanels: function () {
      var contentPanels = this.$.contentPanels,
        panelToCache,
        globalIndex,
        pertinentModule,
        panelReference,
        findPanel = function (panel) {
          return panel.index === globalIndex;
        },
        findModule = function (module) {
          var panel = _.find(module.panels, findPanel);
          return panel !== undefined;
        };

      while (contentPanels.children.length > 3) {
        panelToCache = contentPanels.children[0];
        globalIndex = panelToCache.index;

        // Panels are abstractly referenced in this.getModules().
        // Find the abstract panel of the panelToCache
        // XXX this would be cleaner if we kept a backwards reference
        // from the panel to its containing module (and index therein)
        pertinentModule = _.find(this.getModules(), findModule);
        panelReference = _.find(pertinentModule.panels, findPanel);

        contentPanels.removeChild(panelToCache);
        // only render the most recent (i.e. active) child
        contentPanels.children[2].render();
        panelReference.status = "cached";
        this.getPanelCache()[globalIndex] = panelToCache;
      }
    },
    /**
      Fetch a list.
     */
    fetch: function (options) {
      options = options ? _.clone(options) : {};
      var list = this.$.contentPanels.getActive(),
        name = list ? list.name : "",
        query,
        //input,
        parameterWidget,
        parameters,
        filterDescription;

      // in order to continue to the fetch, this needs to be a list
      // or a dashboard

      if (!(list instanceof XV.List) && !(list instanceof XV.Dashboard) && !(list instanceof XV.Listboard)) { return; }

      query = list.getQuery() || {};
      //input = this.$.searchInput.getValue();

      // if the "list" doesn't allow dynamic searching, skip this
      // Dashboards have an allowFilter of false
      // if (list.allowFilter) {
      //   parameterWidget = XT.app ? XT.app.$.pullout.getParameterWidget(name) : null;
      //   parameters = parameterWidget ? parameterWidget.getParameters() : [];
      //   options.showMore = _.isBoolean(options.showMore) ?
      //     options.showMore : false;
      //
      //   // Get information from filters and set description
      //   filterDescription = this.formatQuery(parameterWidget ? parameterWidget.getSelectedValues() : null, input);
      //   list.setFilterDescription(filterDescription);
      //   this.setHeaderContent(filterDescription);
      //
      //   delete query.parameters;
      //   // Build parameters
      //   if (input || parameters.length) {
      //     query.parameters = [];
      //
      //     // Input search parameters
      //     if (input) {
      //       query.parameters.push({
      //         attribute: list.getSearchableAttributes(),
      //         operator: 'MATCHES',
      //         value: this.$.searchInput.getValue()
      //       });
      //     }
      //
      //     // Advanced parameters
      //     if (parameters) {
      //       query.parameters = query.parameters.concat(parameters);
      //     }
      //   }
      //
      //   // if there is a parameter widget for this list, build the columns
      //   if (parameterWidget && parameterWidget.showLayout) {
      //     this.buildLayout();
      //   }
      // }

      list.setQuery(query);
      list.fetch(options);
    }
  });

}());

// (function() {
//
//   enyo.kind({
//     name: "beryl.Navigator",
//     kind: "XV.Navigator",
//     components: [
//       {kind: "FittableRows", name: "navigationMenu", classes: "left", components: [
//         {kind: "onyx.Toolbar", classes: "onyx-menu-toolbar", components: [
//           {kind: "onyx.PickerDecorator", onChange: "modulePickerChanged", components: [
//             {}, // onyx.PickerButton
//             {name: "modulePicker", kind: "onyx.Picker"}
//           ]}
//         ]},
//         {name: "menuPanels", kind: "Panels", draggable: false, fit: true,
//           margin: 0, components: [
//           // {name: "moduleMenu", kind: "List", touch: true,
//           //     onSetupItem: "setupModuleMenuItem", ontap: "menuTap", components: [
//           //   {name: "moduleItem", classes: "item enyo-border-box"}
//           // ]},
//           {name: "panelMenu", kind: "List", touch: true,
//              onSetupItem: "setupPanelMenuItem", ontap: "panelTap", components: [
//             {name: "listItem", classes: "item enyo-border-box"}
//           ]},
//           {} // Why do panels only work when there are 3+ objects?
//         ]}
//       ]},
//       {kind: "FittableRows", name: "list-view", components: [
//         // the onyx-menu-toolbar class keeps the popups from being hidden
//         {kind: "onyx.MoreToolbar", name: "contentToolbar",
//           classes: "onyx-menu-toolbar", movedClass: "xv-toolbar-moved", components: [
//           {name: "rightLabel", classes: "xv-toolbar-label"},
//           // The MoreToolbar is a FittableColumnsLayout, so this spacer takes up all available space
//           {name: "spacer", content: "", fit: true},
//           // Selectable "New" menu which is hidden by default
//           {kind: "onyx.MenuDecorator", style: "margin: 0;", onSelect: "newRecord", components: [
//             {kind: "XV.IconButton", src: "/assets/menu-icon-new.png",
//               content: "_new".loc(), name: "newMenuButton", showing: false},
//             {kind: "onyx.Menu", name: "newMenu"}
//           ]},
//           // Button to initiate new workspace
//           {kind: "XV.IconButton", src: "/assets/menu-icon-new.png",
//             content: "_new".loc(), name: "newButton", ontap: "newRecord", showing: false},
//           {kind: "onyx.MenuDecorator", style: "margin: 0;", onSelect: "exportSelected", components: [
//             {kind: "XV.IconButton", src: "/assets/menu-icon-export.png",
//               content: "_export".loc(), name: "exportButton"},
//             {kind: "onyx.Menu", name: "exportMenu", showing: false}
//           ]},
//           {kind: "XV.IconButton", name: "sortButton", content: "_sort".loc(),
//             src: "/assets/sort-icon.png", ontap: "showSortPopup", showing: false,
//             classes: "xv-sort-icon"},
//           {name: "refreshButton", kind: "XV.IconButton",
//             src: "/assets/menu-icon-refresh.png", content: "_refresh".loc(),
//             ontap: "requery", showing: false},
//           {name: "search", kind: "onyx.InputDecorator",
//             showing: false, components: [
//             {name: 'searchInput', kind: "onyx.Input", style: "width: 200px;",
//               placeholder: "_search".loc(), onchange: "inputChanged"},
//             {kind: "Image", src: "/assets/search-input-search.png",
//               name: "searchJump", ontap: "jump"},
//             {kind: "XV.SortPopup", name: "sortPopup", showing: false}
//           ]}
//         ]},
//         {name: "messageHeader", content: "", classes: ""},
//         {name: "header", content: "", classes: ""},
//         {name: "contentHeader"},
//         {name: "contentPanels", kind: "Panels", margin: 0, fit: true,
//           draggable: false, panelCount: 0, classes: "scroll-ios"},
//         {name: "myAccountPopup", kind: "XV.MyAccountPopup"},
//         {name: "listItemMenu", kind: "onyx.Menu", floating: true, onSelect: "listActionSelected",
//           maxHeight: 500, components: []
//         }
//       ]}
//     ],
//     rendered: function() {
//       this.inherited(arguments);
//       // for (var index=0; index < this.getModules().length; index++) {
//       //   if (index === 0) {
//       //     this.$.modulePicker.createComponent({
//       //       content: this.getModules()[index].label,
//       //       active: true
//       //     });
//       //   } else {
//       //     this.$.modulePicker.createComponent({content: this.getModules()[index].label});
//       //   }
//       // }
//       // this.modulesChanged();
//     },
//     loginInfo: function() {
//       return null;
//     },
//     modulePickerChanged: function(inSender, inEvent) {
//       var modules = this.getModules();
//       var moduleName = inEvent.content.toLowerCase();
//
//       var module = _.find(modules, function(mod) {
//         return mod.name === moduleName;
//       });
//
//       var panels = module.panels || [],
//       hasSubmenu = module.hasSubmenu !== false && panels.length;
//       if (module !== this._selectedModule || enyo.Panels.isScreenNarrow()) {
//         this._selectedModule = module;
//         if (hasSubmenu) {
//           this.$.panelMenu.setCount(panels.length);
//           this.$.panelMenu.render();
//           //this.setMenuPanel(PANEL_MENU);
//         } else {
//           // if no submenus, treat lke a panel
//           //this.setContentPanel(0);
//         }
//       }
//     },
//     modulesChanged: function () {
//       var modules = this.getModules() || [],
//         existingModules = this._modules || [],
//         existingModule,
//         existingPanel,
//         panels,
//         panel,
//         i,
//         n,
//         findExistingModule = function (name) {
//           return _.find(existingModules, function (module) {
//             return module.name === name;
//           });
//         },
//         findExistingPanel = function (panels, name) {
//           return _.find(panels, function (panel) {
//             return panel.name === name;
//           });
//         };
//
//       // Build panels
//       for (i = 0; i < modules.length; i++) {
//         panels = modules[i].panels || [];
//         existingModule = findExistingModule(modules[i].name);
//         for (n = 0; n < panels.length; n++) {
//
//           // If the panel already exists, move on
//           if (existingModule) {
//             existingPanel = findExistingPanel(existingModule.panels, panels[n].name);
//             if (existingPanel) { continue; }
//           }
//
//           // Keep track of where this panel is being placed for later reference
//           panels[n].index = this.$.contentPanels.panelCount++;
//
//           // XXX try this: only create the first three
//           if (panels[n].index < 3) {
//             panels[n].status = "active";
//
//             // Default behavior for Lists is toggle selections
//             // So we can perform actions on rows. If not a List
//             // this property shouldn't hurt anything
//             if (panels[n].toggleSelected === undefined) {
//               panels[n].toggleSelected = true;
//             }
//             panel = this.$.contentPanels.createComponent(panels[n]);
//             if (panel instanceof XV.List) {
//
//               // Bubble parameter widget up to pullout
//               this.doListAdded(panel);
//             }
//           } else {
//             panels[n].status = "unborn";
//           }
//         }
//       }
//
//       // Cache a deep copy
//       this._modules = JSON.parse(JSON.stringify(modules));
//       this.render();
//     }
//   });
//
// }());
