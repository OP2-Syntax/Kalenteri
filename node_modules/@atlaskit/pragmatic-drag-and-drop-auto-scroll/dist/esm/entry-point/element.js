import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter';
import { makeApi } from '../over-element/make-api';
var api = makeApi({
  monitor: monitorForElements
});
export var autoScrollForElements = api.autoScroll;
// eslint-disable-next-line @atlaskit/volt-strict-mode/no-multiple-exports
export var autoScrollWindowForElements = api.autoScrollWindow;