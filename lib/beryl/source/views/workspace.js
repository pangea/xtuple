(function(){
  "use strict";

  enyo.kind(/** @lends beryl.WorkspaceContainer*/{
    name: 'beryl.WorkspaceContainer',
    kind: 'XV.WorkspaceContainer',
    components: [
      {name: "applicationHeader", classes: "row", components: [
        {content: "pCore Logo", classes: "col-lg-2 col-md-2"},
        {content: "Search Bar", classes: "col-lg-8 col-md-8"},
        {kind: 'onyx.MenuDecorator', name: 'userMenu', classes: "col-lg-1 col-md-1", onSelect: "userItemSelected", components: [
          {content: "User Menu"},
          {kind: 'onyx.Menu', components: [
            {content: 'New Tab', value: 'newTab'},
            {content: 'History', value: 'history'},
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
            ]
          }
        ]},
        {name: "workspace", kind: "Scroller", classes: "col-lg-10 col-md-10 no-padding",
          components: [
            {name: "contentPanels", kind: "Panels", margin: 0, fit: true, draggable: false, animate: false, panelCount: 0, classes: "scroll-ios flexbox-arranger",
              arrangerKind: "flexboxArranger"}
          ]
        }
      ]}
    ]
  });
}());
