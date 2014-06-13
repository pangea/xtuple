(function(){

  enyo.kind({
    name: "flexboxArranger",
    kind: "CardArranger",
    size: function() {
      sizeFlexboxContent(this);
    },
    arrange: function(inC, inIndex) {
      sizeFlexboxContent(this);
    }
  });


  //Get the top offset of the element and subtract that from the
  //overall height of the window. This is your height.
  function sizeFlexboxContent(item){
    var el = item.container.node,
        rect = el.getBoundingClientRect(),
        top = rect.top + document.body.scrollTop,
        height;
    
    if(el.nextSibling){
      height = window.innerHeight - top - el.nextSibling.offsetHeight + "px";
    } else {
      height = window.innerHeight - top + "px";
    }
      
    el.style.height = height; 

  }
}());
