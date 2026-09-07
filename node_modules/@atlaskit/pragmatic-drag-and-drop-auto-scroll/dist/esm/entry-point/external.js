import { monitorForExternal } from '@atlaskit/pragmatic-drag-and-drop/adapter/monitor-for-external';
import { makeApi } from '../over-element/make-api';
var api = makeApi({
  monitor: monitorForExternal
});
export var autoScrollForExternal = api.autoScroll;
// eslint-disable-next-line @atlaskit/volt-strict-mode/no-multiple-exports
export var autoScrollWindowForExternal = api.autoScrollWindow;