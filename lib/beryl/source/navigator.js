(function() {

  enyo.kind({
    name: "beryl.Navigator",
    kind: "XV.Navigator",
    components: [
      {kind: "FittableRows", name: "navigationMenu", classes: "left", components: [
        {kind: "onyx.Toolbar", classes: "onyx-menu-toolbar", components: [
          {kind: "onyx.PickerDecorator", onChange: "modulePickerChanged", components: [
            {}, // onyx.PickerButton
            {name: "modulePicker", kind: "onyx.Picker"}
          ]}
        ]},
        {name: "menuPanels", kind: "Panels", draggable: false, fit: true,
          margin: 0, components: [
          // {name: "moduleMenu", kind: "List", touch: true,
          //     onSetupItem: "setupModuleMenuItem", ontap: "menuTap", components: [
          //   {name: "moduleItem", classes: "item enyo-border-box"}
          // ]},
          {name: "panelMenu", kind: "List", touch: true,
             onSetupItem: "setupPanelMenuItem", ontap: "panelTap", components: [
            {name: "listItem", classes: "item enyo-border-box"}
          ]},
          {} // Why do panels only work when there are 3+ objects?
        ]}
      ]},
      {kind: "FittableRows", name: "list-view", components: [
        // the onyx-menu-toolbar class keeps the popups from being hidden
        {kind: "onyx.MoreToolbar", name: "contentToolbar",
          classes: "onyx-menu-toolbar", movedClass: "xv-toolbar-moved", components: [
          {name: "rightLabel", classes: "xv-toolbar-label"},
          // The MoreToolbar is a FittableColumnsLayout, so this spacer takes up all available space
          {name: "spacer", content: "", fit: true},
          // Selectable "New" menu which is hidden by default
          {kind: "onyx.MenuDecorator", style: "margin: 0;", onSelect: "newRecord", components: [
            {kind: "XV.IconButton", src: "/assets/menu-icon-new.png",
              content: "_new".loc(), name: "newMenuButton", showing: false},
            {kind: "onyx.Menu", name: "newMenu"}
          ]},
          // Button to initiate new workspace
          {kind: "XV.IconButton", src: "/assets/menu-icon-new.png",
            content: "_new".loc(), name: "newButton", ontap: "newRecord", showing: false},
          {kind: "onyx.MenuDecorator", style: "margin: 0;", onSelect: "exportSelected", components: [
            {kind: "XV.IconButton", src: "/assets/menu-icon-export.png",
              content: "_export".loc(), name: "exportButton"},
            {kind: "onyx.Menu", name: "exportMenu", showing: false}
          ]},
          {kind: "XV.IconButton", name: "sortButton", content: "_sort".loc(),
            src: "/assets/sort-icon.png", ontap: "showSortPopup", showing: false,
            classes: "xv-sort-icon"},
          {name: "refreshButton", kind: "XV.IconButton",
            src: "/assets/menu-icon-refresh.png", content: "_refresh".loc(),
            ontap: "requery", showing: false},
          {name: "search", kind: "onyx.InputDecorator",
            showing: false, components: [
            {name: 'searchInput', kind: "onyx.Input", style: "width: 200px;",
              placeholder: "_search".loc(), onchange: "inputChanged"},
            {kind: "Image", src: "/assets/search-input-search.png",
              name: "searchJump", ontap: "jump"},
            {kind: "XV.SortPopup", name: "sortPopup", showing: false}
          ]}
        ]},
        {name: "messageHeader", content: "", classes: ""},
        {name: "header", content: "", classes: ""},
        {name: "contentHeader"},
        {name: "contentPanels", kind: "Panels", margin: 0, fit: true,
          draggable: false, panelCount: 0, classes: "scroll-ios"},
        {name: "myAccountPopup", kind: "XV.MyAccountPopup"},
        {name: "listItemMenu", kind: "onyx.Menu", floating: true, onSelect: "listActionSelected",
          maxHeight: 500, components: []
        }
      ]}
    ],
    rendered: function() {
      this.inherited(arguments);
      // for (var index=0; index < this.getModules().length; index++) {
      //   if (index === 0) {
      //     this.$.modulePicker.createComponent({
      //       content: this.getModules()[index].label,
      //       active: true
      //     });
      //   } else {
      //     this.$.modulePicker.createComponent({content: this.getModules()[index].label});
      //   }
      // }
      // this.modulesChanged();
    },
    loginInfo: function() {
      return null;
    },
    modulePickerChanged: function(inSender, inEvent) {
      var modules = this.getModules();
      var moduleName = inEvent.content.toLowerCase();

      var module = _.find(modules, function(mod) {
        return mod.name === moduleName;
      });

      var panels = module.panels || [],
      hasSubmenu = module.hasSubmenu !== false && panels.length;
      if (module !== this._selectedModule || enyo.Panels.isScreenNarrow()) {
        this._selectedModule = module;
        if (hasSubmenu) {
          this.$.panelMenu.setCount(panels.length);
          this.$.panelMenu.render();
          //this.setMenuPanel(PANEL_MENU);
        } else {
          // if no submenus, treat lke a panel
          //this.setContentPanel(0);
        }
      }
    },
    modulesChanged: function () {
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
    }
  });

}());
