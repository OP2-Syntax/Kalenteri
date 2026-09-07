export var dataAttribute = 'data-auto-scrollable';
// eslint-disable-next-line @atlaskit/volt-strict-mode/no-multiple-exports
export var selector = "[".concat(dataAttribute, "=\"true\"]");

// eslint-disable-next-line @atlaskit/volt-strict-mode/no-multiple-exports
export function addScrollableAttribute(element) {
  element.setAttribute(dataAttribute, 'true');
  return function () {
    return element.removeAttribute(dataAttribute);
  };
}