(function(){

  enyo.kind({
    name: "beryl.Navigator",
    classes: "container",
    kind: "FittableRows",
    published: {
      modules: [],
      selectedModule: null,
      panelCache: {}
    },
    events: {
      onListAdded: "",
      onNavigatorEvent: "",
      onWorkspace: ""
    },
    handlers: {
      onItemTap: "itemTap"
    },
    fetched: {},
    components: [
      {name: "applicationHeader", classes: "row", components: [
        {content: "Logo Holder", classes: "col-lg-2 col-md-2 logo-holder", components: [
	    {kind: "enyo.Image", src: "/assets/logo.png", classes: "col-lg-2 col-md-2 logo"}
	]},
        {content: "Search Bar", classes: "col-lg-8 col-md-8", components: [
          {kind: "onyx.InputDecorator", classes: "top-search",  components: [
	    {kind: "onyx.Input", classes: "search-input", placeholder: "Search...", onchange:"searchChanged"},
	    {kind: "Image", classes: "search-icon", src: "/assets/search-input-search.png"}
	  ]} 
        ]},
        {kind: 'onyx.MenuDecorator', name: 'userMenuButton', classes: "col-lg-1 col-md-1", onSelect: "userItemSelected", components: [
          {content: "User Menu"},
          {name: 'userMenu', kind: 'onyx.Menu', components: [
            {content: 'New Tab', value: 'newTab'},
            {content: 'Preferences', value: 'preferences'},
            {content: 'Logout', value: 'logout'}
          ]}
        ]},
        { tag: "a", attributes: { href: "https://pangea.zendesk.com/", target: "_blank" }, content: "Need Help?", classes: "col-lg-1 col-md-1 help-link" }
      ]},
      {name: "applicationActionHolder", classes: "row", components: [
        {name: "navigationMenu", classes: "col-lg-2 col-md-2", components: [
          {kind: "onyx.PickerDecorator", onSelect: "modulePickerChanged", components: [
            {}, // onyx.PickerButton
            {name: "modulePicker", kind: "onyx.Picker"}
          ]}
        ]},
        {name: "subModuleToolbar", classes: "col-lg-10 col-md-10", components: [
          {classes: 'row', components: [
            {name: 'leftActionGroup', ontap: 'actionItemSelected', classes: 'col-lg-5 col-md-5', defaultKind: 'onyx.Button'},
            {name: 'rightActionGroup', ontap: 'actionItemSelected', classes: 'col-lg-6 col-md-6 col-lg-offset-1 col-md-offset-1', style: 'text-align: right', defaultKind: 'onyx.Button'}
          ]}
        ]}
      ]},
      {name: "applicationContainer", classes: "row", components: [
        // Sidebar
        {name: "sidebarHolder", classes: "col-lg-2 col-md-2 no-padding", components: [
          {name: "sidebar", kind: "Panels", fit: true, arrangerKind: "flexboxArranger", components: [
            {name: "subModuleMenu", fit: true, kind: "List",
             onSetupItem: "setupSubModuleMenuItem", ontap: "subModuleMenuTap",
             components: [
               {name: "listItem"}
             ]
            }
          ]}
        ]},
        {name: "workspace", classes: "col-lg-10 col-md-10 no-padding",
         components: [
           {name: "contentPanels", kind: "Panels", margin: 0, fit: true, draggable: false, animate: false, panelCount: 0, classes: "scroll-ios flexbox-arranger", arrangerKind: "flexboxArranger"
           }
         ]
        }
      ]}
    ],
    create: function() {
      this.inherited(arguments);
      var callback = function () {
          this.clearSubModuleToolbar();
        }.bind(this);

      // If not everything is loaded yet, come back to it later
      if (!XT.session || !XT.session.privileges) {
        XT.getStartupManager().registerCallback(callback);
      } else {
        callback();
      }
    },
    activate: function() {
      this.buildPicker();
      window.dispatchEvent(new Event('resize'));
    },
    actionItemSelected: function(inSender, inEvent) {
      var module = this.selectedModule,
          action = inEvent.originator,
          method;

      if(action.method){
        method = module[action.method];
        if(method && typeof(method) == "function") {
          method.call(module, inSender, inEvent);
        } else if((method = this[action.method]) && typeof(method) == "function") {
          method.call(this, inSender, inEvent);
        } else {
          throw "unknown method";
        }
      } else {
        throw "no method supplied";
      }
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
    // doWorkspace: function(options) {
    //   console.log('FUCK');
    //   console.log(arguments);
    //   var contentPanels = this.$.contentPanels,
    //       workspace = contentPanels.createComponent({kind: options.workspace});
    //   workspace.setRecordId(options.id);
    //   contentPanels.setActive(contentPanels.getPanels().length - 1);
    //   contentPanels.render();
    // },
    /**
    * Sets up usermenu button originally renders with (New Tab, Preferences, Logout) 
    * to add a action go to the desegnated module postbooks.js.
    *
    * XT.app.$.postbooks.insertUserMenuItem({
    *   content: 'Party', value: 'party'
    * });
    */
    setUserMenu: function(items){
      var panel = this.$.contentPanels.getActive();

      this.$.userMenu.destroyClientControls();      

      _.chain(items).compact().each(function (action) {

        action.context = panel;

        this.$.userMenu.createComponent(action);
      }, this);

      this.$.userMenu.render();
    },
    /**
      Fired when the user clicks the "New" button. Takes the user to a workspace
      backed by an empty object of the type displayed in the current list.
     */
    newRecord: function (inSender, inEvent) {
      var list = this.$.contentPanels.getActive(),
        workspace = list instanceof XV.List ? list.getWorkspace() : null,
        item = inEvent.originator.item,
        defaults = inEvent.originator.defaults,
        allowNew = inEvent.originator.allowNew,
        Model,
        canCreate,
        callback;

      // This list is actually a dashboard so the item
      // will be a type of chart added to the dashboard
      if (list instanceof XV.Dashboard && item) {
        list.newRecord(item);
        return true;
      }

      if (list instanceof XV.Listboard && item) {
        list.newRecord(item);
        return true;
      }

      if (!list instanceof XV.List) {
        return true;
      }

      // Check privileges
      Model = list.getValue().model;
      canCreate = Model.couldCreate ? Model.couldCreate() : Model.canCreate();
      if (!canCreate) {
        this.showError("_insufficientCreatePrivileges".loc());
        return true;
      }

      if (workspace) {
        var params = {};
        this.setContentPanel(null, {'id': false, 'workspace': workspace});
      }

      // In addition to preventing Enyo event propagation,
      // we need to prevent propagation of DOM events to support
      // mobile browsers and long button clicks
      // check to make sure this is a button click before calling inEvent function
      if (inEvent && inEvent.preventDefault) {
        inEvent.preventDefault();
      }
      return true;
    },
    saveWorkspace: function() {
      this.$.contentPanels.getActive().save();
    },
    /**
    * Constructs the toolbar directly above the contentPanel
    * Calls getNavigatorActions on the currently active panel to get the actions
    * that should be displayed in the toolbar.  We recognize one non-standard
    * property here - placement.  The values 'right', 'left', and 'menu' are
    * recognized.  Unrecognized values are treated like 'left'.
    */
    buildSubModuleToolbar: function() {
      var panel       = this.$.contentPanels.getActive(),
          privilages  = XT.session.privileges,
          actions     = [
            // default actionMenu controls
           {name: 'newMenuButton', method: "newRecord", content: 'New', value: 'new', placement: 'menu'},
            {name: 'saveButton', method: 'saveWorkspace', content: 'Save', value: 'save', placement: 'right' },
            {content: 'Export', value: 'export', placement: 'menu'}
          ];
      
      // No sense in doing any of this if we don't have a panel
      if(!panel) { return; }

      this.clearSubModuleToolbar();

      if(panel.getNavigatorActions) {
        actions = actions.concat(panel.getNavigatorActions());
      }
      
      _.chain(actions).compact().each(function (action) {
        var actionPrivileges = action.privilege ? action.privilege.split(" ") : [],
            isDisabled = false;

        if(actionPrivileges.length) {
          isDisabled = !_.some(actionPrivileges, function (priv) {
            return privileges.get(priv);
          });
        }

        // skip disabled actions
        if(isDisabled) { return; }

        action.context = panel;
        
        // default buttons are placed to left, inorder to define = placement: "right or menu"
        switch(action.placement) {
          case 'menu':
          case 'right':
            this.$.rightActionGroup.createComponent(action);
            break;
          default:
            this.$.leftActionGroup.createComponent(action);
        }
      }, this);

      this.renderSubModuleToolbar();
    },
    clearSubModuleToolbar: function() {
      this.$.leftActionGroup.destroyClientControls();
      this.$.rightActionGroup.destroyClientControls();
    },
    renderSubModuleToolbar: function() {
      this.$.leftActionGroup.render();
      this.$.rightActionGroup.render();
    },
    /**
       Drills down into a workspace if a user clicks a list item.
    */
    itemTap: function (inSender, inEvent) {
      var workspace = inEvent.originator.getWorkspace(),
          model = inEvent.model,
          module = this.selectedModule,
          canNotRead = model.couldRead ? !model.couldRead() : !model.getClass().canRead(),
          id = model && model.id ? model.id : false,
          index;

      // Check privileges first
      if (canNotRead) {
        this.showError("_insufficientViewPrivileges".loc());
        return true;
      }

      if (workspace) {
        this.setContentPanel(null, { 'id': id, 'workspace': workspace });
      }

      return true;
    },
    userItemSelected: function(inSender, inEvent) {
      var action = inEvent.originator;

      switch(action.value) {
        case 'newTab':
          window.open(XT.getOrganizationPath() + '/app', '_newtab');
          break;
        case 'preferences':
          this.doWorkspace({workspace: "XV.UserPreferenceWorkspace", id: false});
          break;
        case 'logout':
          XT.logout();
          break;
        default:
          if(action.method){
            action.module[action.method]();
          } else {
          console.error('unkown user action "' + action.value + '" selected!');
          }
      }
    },
    modulePickerChanged: function(inSender, inEvent) {
      var modules = this.getModules(),
          moduleName = inEvent.content.split(" "),
          module;

      //need to split on space if its more than 1 word and create camelcase version
      moduleName[0] = moduleName[0].toLowerCase();
      moduleName = moduleName.join("");

      module = _.find(modules, function(mod){
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

      this.clearSubModuleToolbar();
      this.$.sidebar.refresh();
	window.dispatchEvent(new Event('resize'));
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

      options is used solely by itemTap to render workspaces.  Using it will run the
      workspace rendering code.
     */
    setContentPanel: function (index, options) {
      var contentPanels = this.$.contentPanels,
          module = this.getSelectedModule(),
          panel = module && module.panels && (index || index === 0) && module.panels[index],
          panelIndex = panel ? panel.index : -1,
          panelStatus = panel ? panel.status : 'unknown',
          // contentHeader = this.$.contentHeader,
          label,
          collection,
          model,
          canNotCreate = true;

      // check if we're actually rendering a workspace
      // in this case, index should be null and panel will be falsey
      if(!panel && !index && options) {
        module.workspacePanels = module.workspacePanels || {};
        label = _.last(options.workspace.split('.'));
        panel = module.workspacePanels[label];
        if(!panel) {
          panelStatus = 'unborn';
          panel = module.workspacePanels[label] = {
            'name'    : label,
            'kind'    : options.workspace,
            'status'  : panelStatus,
            'index'   : label
          };
        } else {
          panelIndex = panel.index;
          panelStatus = panel.status;
        }
      }

      // TODO: Implement our own message clearing function. //this.clearMessage();
      if (panelStatus === 'active') {
        panel = _.find(contentPanels.children, function (child) {
          return child.index === panelIndex;
        });
      } else if (panelStatus === 'unborn') {
        // panel exists but has not been rendered. Render it.
        panel.status = 'active';

        // Default behavior for Lists is toggle selections
        // So we can perform actions on rows. If not a List
        // this property shouldn't hurt anything
        if (panel.toggleSelected === undefined) {
          panel.toggleSelected = true;
        }
        panel = contentPanels.createComponent(panel);
        panel.render();
        if (panel instanceof XV.List) {

          // Bubble parameter widget up to pullout
          //this.doListAdded(panel);
        }

      } else if (panelStatus === 'cached') {
        panel.status = 'active';
        panel = this.panelCache[panelIndex];
        contentPanels.addChild(panel);
        panel.node = undefined; // new to enyo2.2! wipe out the node so that it can get re-rendered fresh
        panel.render();

      } else {
        XT.error("Don't know what to do with this panel status");
      }

      // check if this is a workspace render
      if(options) {
        if(options.id === false) {
          var defaults = {};
          if(panel.defaultAttributes) {
            defaults = panel.defaultAttributes();
          }

          panel.newRecord(defaults);
        } else if(options.id) {
          panel.setSuccess(options.success);
          panel.setRecordId(options.id);
        }
      }

      // If we're already here, bail
      if (contentPanels.index === contentPanels.indexOfChild(panel)) {
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
      contentPanels.setIndex(contentPanels.indexOfChild(panel));
      // this is required for workspaces to render.  It doesn't appear to affect
      // list rendering.
      panel.reflow();
      //
      // this.$.rightLabel.setContent(label);
      // if (panel.getFilterDescription) {
      //   this.setHeaderContent(panel.getFilterDescription());
      // }
      if (panel.fetch && !this.fetched[panelIndex]) {
        this.fetch();
        this.fetched[panelIndex] = true;
      }

      // Don't display submodule toolbar for the dashboard
      // TODO: Why does it have an index of 1?  1 based indexing?
      if(this.$.modulePicker.getSelected().indexInContainer() === 0) {
        this.$.subModuleToolbar.hide();
      } else {
        this.$.subModuleToolbar.show();
        this.buildSubModuleToolbar();
      }
      // this.$.contentToolbar.resized();
      //
      // contentHeader.destroyClientControls();
      if (panel.headerComponents) {
        console.log(panel.headerComponents);
        // contentHeader.createComponents(panel.headerComponents);
        // contentHeader.render();
      }
	window.dispatchEvent(new Event('resize'));
    },
    /**
      The navigator only keeps three panels in the DOM at a time. Anything extra panels
      will be periodically cached into the panelCache published field and removed from the DOM.
    */
    getActions: function (alwaysShowingOnly) {
      var actions = this.actions;
      if (alwaysShowingOnly) {
        actions = _.filter(actions, function (action) {
          return action.alwaysShowing === true;
        });
      }
      return actions;
    },
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
        query,
        input = this.$.searchInput.getValue();


      // in order to continue to the fetch, this needs to be a list
      // or a dashboard
      if ((list instanceof XV.List) || (list instanceof XV.Dashboard) || (list instanceof XV.Listboard)) {
        query = list.getQuery() || {}
        console.log(list.getSearchableAttributes());

        delete query.parameters;
        query.parameters = [];
        // Input search parameters
        if (input) {
          query.parameters.push({
            attribute: list.getSearchableAttributes(),
            operator: 'MATCHES',
            value: this.$.searchInput.getValue()
          });
        }

        list.setQuery(query);
      }

      list.fetch(options);
    },
    searchChanged: function(inSender, inEvent) {
      this.fetched = {};
      this.fetch();
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
//           //     onSetupItem: "setupModuleMenuItem", ontap
//: "menuTap", components: [
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
