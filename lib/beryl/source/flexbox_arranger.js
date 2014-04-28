(function(){

  enyo.kind({
    name: "flexboxArranger",
    kind: "Arranger",
    size: function() {
      this.container.node.style.height = "500px";
    },
    arrange: function(inC, inIndex) {
      this.container.node.style.height = "500px";
    }    
  });

}());
