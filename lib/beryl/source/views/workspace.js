(function(){
  "use strict";

  enyo.kind(/** @lends beryl.WorkspaceContainer*/{
    name: 'beryl.WorkspaceContainer',
    kind: 'XV.WorkspaceContainer',
    components: [
      {name: "applicationHeader", classes: "row", components: [
        {content: "pCore Logo", classes: "col-lg-2 col-md-2"},
        {name: 'title', classes: "col-lg-8 col-md-8"},
        {kind: 'onyx.MenuDecorator', name: 'userMenu', classes: "col-lg-1 col-md-1", onSelect: "userItemSelected", components: [
          {content: "User Menu"},
          {kind: 'onyx.Menu', components: [
            {content: 'New Tab', value: 'newTab'},
            {content: 'Preferences', value: 'preferences'},
            {content: 'Logout', value: 'logout'}
          ]}
        ]},
        {content: "Help Link", classes: "col-lg-1 col-md-1"}
      ]},
      {name: "applicationActionHolder", classes: "row", components: [
        {name: "navigationMenu", classes: "col-lg-2 col-md-2", components: [
          {kind: "onyx.Button", name: "backButton", content: "_back".loc(), onclick: "close"}
        ]},
        {name: "subModuleToolbar", classes: "col-lg-10 col-md-10", components: [
          {classes: 'row', components: [
            {name: 'leftActionGroup', ontap: 'actionItemSelected', classes: 'col-lg-5 col-md-5'},
            {name: 'rightActionGroup', ontap: 'actionItemSelected', classes: 'col-lg-5 col-md-5 col-lg-offset-1 col-md-offset-1', style: 'text-align: right'},
            {name: 'actionMenu', kind: 'onyx.MenuDecorator', classes: 'col-lg-1 col-md-1', onSelect: 'actionItemSelected', components: [
              {kind: "XV.IconButton", src: "/assets/menu-icon-gear.png"},
              {kind: 'onyx.Menu', components: [
                {content: 'New', value: 'new'},
                {content: 'Export', value: 'export'}
              ]}
            ]}
          ]}
        ]}
      ]},
      {name: "applicationContainer", classes: "row", components: [
        // Sidebar
        {name: "sidebar", classes: "col-lg-2 col-md-2", components: [
          {name: "menu", kind: "List", touch: true,
           onSetupItem: "setupItem", components: [
            {name: "item", ontap: 'itemTap'}
          ]}
        ]},
        // Workspace
        {name: "workspace", kind: "Scroller", classes: "col-lg-10 col-md-10 no-padding",
          components: [
            {name: "contentPanels", kind: "Panels", margin: 0, fit: true, draggable: false, animate: false, panelCount: 0, classes: "scroll-ios flexbox-arranger",
              arrangerKind: "flexboxArranger"}
          ]
        }
      ]}
    ],
    setLoginInfo: function() {},
    /**
      Loads a workspace into the workspace container.
      Accepts the following options:
        * workspace: class name (required)
        * id: record id to load. If none, a new record will be created.
        * allowNew: boolean indicating whether Save and New button is shown.
        * attributes: default attribute values for a new record.
        * success: function to call from the workspace when the workspace
          has either succefully fetched or created a model.
        * callback: function to call on either a successful save, or the user
          leaves the workspace without saving a new record. Passes the new or
          updated model as an argument.

      NOTE: This is copied from XV.WorkspaceContainer to allow us to modify the
            behavior of this function.
    */
    setWorkspace: function (options) {
      var that = this,
        menuItems = [],
        prop,
        headerAttrs,
        workspace = options.workspace,
        id = options.id,
        callback = options.callback,
        // if the options do not specify allowNew, default it to true
        allowNew,
        attributes = options.attributes;

      if (workspace) {
        this.destroyWorkspace();
        workspace = {
          name: "workspace",
          container: this.$.contentPanel,
          kind: workspace,
          fit: true,
          callback: callback
        };

        workspace = this.createComponent(workspace);

        // Handle save and new button
        allowNew = _.isBoolean(options.allowNew) ?
          options.allowNew : !workspace.getHideSaveAndNew();
        this.setAllowNew(allowNew);

        headerAttrs = workspace.getHeaderAttrs() || [];
        // if (headerAttrs.length) {
        //   this.$.header.show();
        // } else {
        //   this.$.header.hide();
        // }

        // Show the print & report button if this workspace is set up to have it
        // this.$.reportButton.setShowing((workspace.allowPrint && XT.session.config.printAvailable) ||
          // workspace.kind === "XV.InvoiceWorkspace");
        // this.$.printButton.setShowing(workspace.allowPrint && XT.session.config.printAvailable);

        // Set the button texts
        // this.$.saveButton.setContent(workspace.getSaveText());
        // this.$.backButton.setContent(workspace.getBackText());

        // Hide buttons if applicable
        if (workspace.getHideApply()) {
          // this.$.applyButton.hide();
        }

        if (workspace.getHideRefresh()) {
          // this.$.refreshButton.hide();
        }

        // Handle any extra action buttons specified
        _.each(this.$.workspace.actionButtons, function (action) {
          that.$.contentToolbar.createComponent(
            {kind: "onyx.Button",
              name: action.name,
              content: action.label || ("_" + action.name).loc(),
              method: action.method || action.name,
              isViewMethod: action.isViewMethod,
              ontap: "actionSelected"},
            {owner: that});
        });

        this.render();
        if (id || id === false) {
          workspace.setSuccess(options.success);
          workspace.setRecordId(id);
        } else {
          workspace.newRecord(attributes, options);
        }
      }

      // Build menu by finding all panels
      this.$.menu.setCount(0);
      for (prop in workspace.$) {
        if (workspace.$.hasOwnProperty(prop) &&
            workspace.$[prop] instanceof enyo.Panels) {
          menuItems = menuItems.concat(workspace.$[prop].getPanels());
        }
      }
      this.setMenuItems(menuItems);
      this.$.menu.setCount(menuItems.length);
      this.$.menu.render();
    }
  });
}());
