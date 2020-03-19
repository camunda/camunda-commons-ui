require("babel-polyfill");

var original = document.addEventListener;
document.addEventListener = function(...args) {
  const event = args[0];
  if (event === "focusin") {
    return;
  }
  return original.apply(document, args);
};

export { default as NavigatedViewer } from "./NavigatedViewer";
export { default as Modeler } from "dmn-js/lib/Modeler";
export { migrateDiagram } from "@bpmn-io/dmn-migrate";
