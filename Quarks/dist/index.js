// node_modules/mutraction-dom/dist/index.js
var RecordMutation = Symbol("RecordMutation");
var TrackerOf = Symbol("TrackerOf");
var ProxyOf = Symbol("ProxyOf");
var RecordDependency = Symbol("RecordDependency");
var GetOriginal = Symbol("GetOriginal");
var mutatingArrayMethods = ["copyWithin", "fill", "pop", "push", "reverse", "shift", "sort", "splice", "unshift"];
function isArrayLength(value) {
  if (typeof value === "string")
    return isArrayIndex(value);
  return typeof value === "number" && (value & 2147483647) === value;
}
function isArrayIndex(name) {
  if (typeof name !== "string")
    return false;
  if (!/^\d{1,10}$/.test(name))
    return false;
  return parseInt(name, 10) < 2147483647;
}
function isArguments(item) {
  return Object.prototype.toString.call(item) === "[object Arguments]";
}
function linkProxyToObject(obj, proxy) {
  Object.defineProperty(obj, ProxyOf, {
    enumerable: false,
    writable: true,
    configurable: false
  });
  obj[ProxyOf] = proxy;
}
var unproxyableConstructors = /* @__PURE__ */ new Set([RegExp, Promise]);
if ("window" in globalThis)
  unproxyableConstructors.add(globalThis.window.constructor);
function canBeProxied(val) {
  if (val == null)
    return false;
  if (typeof val !== "object")
    return false;
  if (isTracked(val))
    return false;
  if (!Object.isExtensible(val))
    return false;
  if (unproxyableConstructors.has(val.constructor))
    return false;
  return true;
}
function makeProxyHandler(model2, tracker) {
  function getOrdinary(target, name, receiver) {
    if (name === TrackerOf)
      return tracker;
    if (name === GetOriginal)
      return target;
    tracker[RecordDependency](createOrRetrievePropRef(target, name));
    let result = Reflect.get(target, name, receiver);
    if (canBeProxied(result)) {
      const existingProxy = result[ProxyOf];
      if (existingProxy) {
        if (existingProxy[TrackerOf] !== tracker) {
          throw Error("Object cannot be tracked by multiple tracker isntances");
        }
        result = existingProxy;
      } else {
        const original = result;
        const handler = makeProxyHandler(original, tracker);
        result = target[name] = new Proxy(original, handler);
        linkProxyToObject(original, result);
      }
    }
    if (typeof result === "function" && tracker.options.autoTransactionalize && name !== "constructor") {
      let proxyWrapped2 = function() {
        const autoTransaction = tracker.startTransaction(original.name ?? "auto");
        try {
          return original.apply(receiver, arguments);
        } finally {
          if (autoTransaction.operations.length > 0) {
            tracker.commit(autoTransaction);
          } else {
            tracker.rollback(autoTransaction);
          }
        }
      };
      var proxyWrapped = proxyWrapped2;
      const original = result;
      return proxyWrapped2;
    }
    return result;
  }
  function getArrayTransactionShim(target, name, receiver) {
    if (typeof name === "string" && mutatingArrayMethods.includes(name)) {
      let proxyWrapped2 = function() {
        const arrayTransaction = tracker.startTransaction(String(name));
        const arrayResult = arrayFunction.apply(receiver, arguments);
        tracker.commit(arrayTransaction);
        return arrayResult;
      };
      var proxyWrapped = proxyWrapped2;
      const arrayFunction = target[name];
      return proxyWrapped2;
    } else {
      return getOrdinary(target, name, receiver);
    }
  }
  let setsCompleted = 0;
  function setOrdinary(target, name, newValue, receiver) {
    if (canBeProxied(newValue)) {
      const handler = makeProxyHandler(newValue, tracker);
      newValue = new Proxy(newValue, handler);
    }
    const mutation = name in target ? { type: "change", target, name, oldValue: model2[name], newValue, timestamp: /* @__PURE__ */ new Date() } : { type: "create", target, name, newValue, timestamp: /* @__PURE__ */ new Date() };
    const initialSets = setsCompleted;
    const wasSet = Reflect.set(target, name, newValue, receiver);
    if (wasSet && initialSets == setsCompleted++) {
      tracker[RecordMutation](mutation);
    }
    return wasSet;
  }
  function setArray(target, name, newValue, receiver) {
    if (!Array.isArray(target)) {
      throw Error("This object used to be an array.  Expected an array.");
    }
    if (name === "length") {
      if (!isArrayLength(newValue))
        target.length = newValue;
      const oldLength = target.length;
      const newLength = parseInt(newValue, 10);
      if (newLength < oldLength) {
        const removed = Object.freeze(target.slice(newLength, oldLength));
        const shorten = {
          type: "arrayshorten",
          target,
          name,
          oldLength,
          newLength,
          removed,
          timestamp: /* @__PURE__ */ new Date()
        };
        const wasSet = Reflect.set(target, name, newValue, receiver);
        tracker[RecordMutation](shorten);
        ++setsCompleted;
        return wasSet;
      }
    }
    if (isArrayIndex(name)) {
      const index = parseInt(name, 10);
      if (index >= target.length) {
        const extension = {
          type: "arrayextend",
          target,
          name,
          oldLength: target.length,
          newIndex: index,
          newValue,
          timestamp: /* @__PURE__ */ new Date()
        };
        const wasSet = Reflect.set(target, name, newValue, receiver);
        tracker[RecordMutation](extension);
        ++setsCompleted;
        return wasSet;
      }
    }
    return setOrdinary(target, name, newValue, receiver);
  }
  function deleteProperty(target, name) {
    const mutation = { type: "delete", target, name, oldValue: model2[name], timestamp: /* @__PURE__ */ new Date() };
    const wasDeleted = Reflect.deleteProperty(target, name);
    if (wasDeleted) {
      tracker[RecordMutation](mutation);
    }
    return wasDeleted;
  }
  let set = setOrdinary, get = getOrdinary;
  if (Array.isArray(model2)) {
    set = setArray;
    if (tracker.options.trackHistory)
      get = getArrayTransactionShim;
  }
  if (isArguments(model2))
    throw Error("Tracking of exotic arguments objects not supported");
  return { get, set, deleteProperty };
}
function isTracked(obj) {
  return typeof obj === "object" && !!obj[TrackerOf];
}
var PropReference = class {
  object;
  prop;
  #subscribers = /* @__PURE__ */ new Set();
  #notifying = false;
  get subscribers() {
    return this.#subscribers;
  }
  constructor(object, prop) {
    if (!isTracked(object) && object[ProxyOf]) {
      object = object[ProxyOf];
    }
    this.object = object;
    this.prop = prop;
  }
  subscribe(dependencyList) {
    this.#subscribers.add(dependencyList);
    return {
      dispose: () => {
        this.#subscribers.delete(dependencyList);
      }
    };
  }
  notifySubscribers() {
    if (this.#notifying)
      console.warn(`Re-entrant property subscription for '${String(this.prop)}'`);
    const subscriberSnapshot = Array.from(this.#subscribers);
    this.#notifying = true;
    for (const dep of subscriberSnapshot)
      dep.notifySubscribers();
    this.#notifying = false;
  }
  get current() {
    return this.object[this.prop];
  }
  set current(newValue) {
    this.object[this.prop] = newValue;
  }
};
var propRefRegistry = /* @__PURE__ */ new WeakMap();
function createOrRetrievePropRef(object, prop) {
  let objectPropRefs = propRefRegistry.get(object);
  if (!objectPropRefs)
    propRefRegistry.set(object, objectPropRefs = /* @__PURE__ */ new Map());
  let result = objectPropRefs.get(prop);
  if (!result)
    objectPropRefs.set(prop, result = new PropReference(object, prop));
  return result;
}
var DependencyList = class {
  #trackedProperties = /* @__PURE__ */ new Map();
  #tracker;
  #tracksAllChanges = false;
  #subscribers = /* @__PURE__ */ new Set();
  active = true;
  constructor(tracker) {
    this.#tracker = tracker;
  }
  get trackedProperties() {
    return Array.from(this.#trackedProperties.keys());
  }
  addDependency(propRef) {
    if (this.active && !this.#tracksAllChanges) {
      if (this.#trackedProperties.has(propRef))
        return;
      const propSubscription = propRef.subscribe(this);
      this.#trackedProperties.set(propRef, propSubscription);
    }
  }
  subscribe(callback) {
    this.#subscribers.add(callback);
    return { dispose: () => this.#subscribers.delete(callback) };
  }
  notifySubscribers() {
    const subscriberSnapshot = Array.from(this.#subscribers);
    for (const callback of subscriberSnapshot)
      callback();
  }
  endDependencyTrack() {
    this.#tracker.endDependencyTrack(this);
  }
  /** Indicates that this dependency list is dependent on *all* tracked changes */
  trackAllChanges() {
    if (this.#tracksAllChanges)
      return;
    this.untrackAll();
    const historyPropRef = createOrRetrievePropRef(this.#tracker, "history");
    this.addDependency(historyPropRef);
    this.#tracksAllChanges = true;
  }
  untrackAll() {
    for (const sub of this.#trackedProperties.values())
      sub.dispose();
    this.#trackedProperties.clear();
  }
};
function compactTransaction({ operations }) {
  for (let i = 0; i < operations.length; ) {
    const currOp = operations[i];
    if (currOp.type === "transaction") {
      operations.splice(i, 1, ...currOp.operations);
    } else if (currOp.type === "change" && Object.is(currOp.oldValue, currOp.newValue)) {
      operations.splice(i, 1);
    } else if (i > 0) {
      const prevOp = operations[i - 1];
      if (prevOp.type === "transaction") {
        throw Error("Internal mutraction error.  Found internal transaction on look-back during packTransaction.");
      } else if (prevOp.target !== currOp.target || prevOp.name !== currOp.name) {
        ++i;
      } else if (prevOp.type === "create" && currOp.type === "change") {
        operations.splice(--i, 2, { ...prevOp, newValue: currOp.newValue });
      } else if (prevOp.type === "create" && currOp.type === "delete") {
        operations.splice(--i, 2);
      } else if (prevOp.type === "change" && currOp.type === "change") {
        operations.splice(--i, 2, { ...prevOp, newValue: currOp.newValue });
      } else if (prevOp.type === "change" && currOp.type === "delete") {
        operations.splice(--i, 2, { ...currOp, oldValue: prevOp.oldValue });
      } else if (prevOp.type === "delete" && currOp.type === "create") {
        operations.splice(--i, 2, { ...currOp, ...prevOp, type: "change" });
      } else
        ++i;
    } else
      ++i;
  }
}
var defaultTrackerOptions = {
  trackHistory: true,
  autoTransactionalize: true,
  compactOnCommit: true
};
var Tracker = class {
  #transaction;
  #operationHistory;
  #redos = [];
  #inUse = false;
  #dependencyTrackers = [];
  options = defaultTrackerOptions;
  // If defined this will be the prop reference for the "history" property of this Tracker instance
  // If so, it should be notified whenever the history is affected
  //      mutations outside of transactions
  //      non-nested transaction committed
  #historyPropRef;
  constructor(options = {}) {
    this.setOptions(options);
  }
  setOptions(options = {}) {
    if (this.#inUse)
      throw Error("Cannot change options for a tracker that has already started tracking");
    if (options.trackHistory === false) {
      options.compactOnCommit = false;
      options.autoTransactionalize ??= false;
    }
    const appliedOptions = { ...defaultTrackerOptions, ...options };
    if (appliedOptions.compactOnCommit && !appliedOptions.trackHistory) {
      throw Error("Option compactOnCommit requires option trackHistory");
    }
    if (appliedOptions.trackHistory) {
      this.#operationHistory = [];
    }
    this.options = Object.freeze(appliedOptions);
  }
  /**
   * Turn on change tracking for an object.
   * @param model
   * @returns a proxied model object
   */
  track(model2) {
    if (isTracked(model2))
      throw Error("Object already tracked");
    this.#inUse = true;
    if (!canBeProxied)
      throw Error("This object type cannot be proxied");
    const proxied = new Proxy(model2, makeProxyHandler(model2, this));
    linkProxyToObject(model2, proxied);
    return proxied;
  }
  /**
   * Turn on change tracking for an object.  This is behaviorally identical
   * to `track()`.  It differs only in the typescript return type, which is a deep
   * read-only type wrapper.  This might be useful if you want to enforce all mutations
   * to be done through methods.
   * @param model
   * @returns a proxied model object
   */
  trackAsReadonlyDeep(model2) {
    return this.track(model2);
  }
  #ensureHistory() {
    if (!this.options.trackHistory)
      throw Error("History tracking disabled.");
  }
  /** Retrieves the mutation history.  Active transactions aren't represented here.
   */
  get history() {
    this.#ensureHistory();
    this.#dependencyTrackers[0]?.trackAllChanges();
    this.#historyPropRef ??= createOrRetrievePropRef(this, "history");
    if (!this.#operationHistory)
      throw Error("History tracking enabled, but no root transaction. Probably mutraction internal error.");
    return this.#operationHistory;
  }
  /** Add another transaction to the stack  */
  startTransaction(name) {
    this.#transaction = { type: "transaction", parent: this.#transaction, operations: [], dependencies: /* @__PURE__ */ new Set(), timestamp: /* @__PURE__ */ new Date() };
    if (name)
      this.#transaction.transactionName = name;
    return this.#transaction;
  }
  /** resolve and close the most recent transaction
    * throws if no transactions are active
    */
  commit(transaction) {
    if (!this.#transaction)
      throw Error("Attempted to commit transaction when none were open.");
    if (transaction && transaction !== this.#transaction)
      throw Error("Attempted to commit wrong transaction. Transactions must be resolved in stack order.");
    if (this.options.compactOnCommit)
      compactTransaction(this.#transaction);
    if (this.#transaction.parent) {
      this.#transaction.parent.operations.push(this.#transaction);
      this.#transaction.dependencies.forEach((d) => this.#transaction.parent.dependencies.add(d));
      this.#transaction = this.#transaction.parent;
    } else {
      this.#operationHistory?.push(this.#transaction);
      const allDependencyLists = /* @__PURE__ */ new Set();
      for (const propRef of this.#transaction.dependencies) {
        for (const dependencyList of propRef.subscribers) {
          allDependencyLists.add(dependencyList);
        }
      }
      for (const depList of allDependencyLists) {
        depList.notifySubscribers();
      }
      this.#transaction = void 0;
    }
    if (this.#transaction == null) {
      this.#historyPropRef?.notifySubscribers();
    }
  }
  /** undo all operations done since the beginning of the most recent trasaction
   * remove it from the transaction stack
   * if no transactions are active, undo all mutations
   */
  rollback(transaction) {
    if (transaction && transaction !== this.#transaction)
      throw Error("Attempted to commit wrong transaction. Transactions must be resolved in stack order.");
    if (this.#transaction) {
      while (this.#transaction.operations.length)
        this.undo();
      this.#transaction = this.#transaction.parent;
    } else {
      while (this.#operationHistory?.length)
        this.undo();
    }
  }
  /** undo last mutation or transaction and push into the redo stack  */
  undo() {
    this.#ensureHistory();
    const mutation = (this.#transaction?.operations ?? this.#operationHistory).pop();
    if (!mutation)
      return;
    this.#undoOperation(mutation);
    this.#redos.unshift(mutation);
    if (this.#transaction == null) {
      this.#historyPropRef?.notifySubscribers();
    }
  }
  #undoOperation(mutation) {
    if (mutation.type === "transaction") {
      for (let i = mutation.operations.length; i-- > 0; ) {
        this.#undoOperation(mutation.operations[i]);
      }
    } else {
      const targetAny = mutation.target;
      switch (mutation.type) {
        case "change":
        case "delete":
          targetAny[mutation.name] = mutation.oldValue;
          break;
        case "create":
          delete targetAny[mutation.name];
          break;
        case "arrayextend":
          targetAny.length = mutation.oldLength;
          break;
        case "arrayshorten":
          targetAny.push(...mutation.removed);
          break;
        default:
          mutation;
      }
      if (!this.#transaction) {
        createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
        if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
          createOrRetrievePropRef(mutation.target, "length").notifySubscribers();
        }
      }
    }
  }
  /** Repeat last undone mutation  */
  redo() {
    this.#ensureHistory();
    const mutation = this.#redos.shift();
    if (!mutation)
      return;
    this.#redoOperation(mutation);
    (this.#transaction?.operations ?? this.#operationHistory).push(mutation);
    if (this.#transaction == null) {
      this.#historyPropRef?.notifySubscribers();
    }
  }
  #redoOperation(mutation) {
    if (mutation.type === "transaction") {
      for (const operation of mutation.operations) {
        this.#redoOperation(operation);
      }
    } else {
      const targetAny = mutation.target;
      switch (mutation.type) {
        case "change":
        case "create":
          targetAny[mutation.name] = mutation.newValue;
          break;
        case "delete":
          delete targetAny[mutation.name];
          break;
        case "arrayextend":
          targetAny[mutation.newIndex] = mutation.newValue;
          break;
        case "arrayshorten":
          targetAny.length = mutation.newLength;
          break;
        default:
          mutation;
      }
      if (!this.#transaction) {
        createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
        if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
          createOrRetrievePropRef(mutation.target, "length").notifySubscribers();
        }
      }
    }
  }
  /** Clear the redo stack. Any direct mutation implicitly does this.
   */
  clearRedos() {
    this.#redos.length = 0;
  }
  /** Commits all transactions, then empties the undo and redo history. */
  clearHistory() {
    this.#ensureHistory();
    this.#transaction = void 0;
    this.#operationHistory.length = 0;
    this.clearRedos();
  }
  /** record a mutation, if you have the secret key  */
  [RecordMutation](mutation) {
    if (this.options.trackHistory) {
      (this.#transaction?.operations ?? this.#operationHistory).push(Object.freeze(mutation));
    }
    this.clearRedos();
    if (this.#transaction) {
      this.#transaction.dependencies.add(createOrRetrievePropRef(mutation.target, mutation.name));
      if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
        this.#transaction.dependencies.add(createOrRetrievePropRef(mutation.target, "length"));
      }
    } else {
      createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
      if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
        createOrRetrievePropRef(mutation.target, "length").notifySubscribers();
      }
      this.#historyPropRef?.notifySubscribers();
    }
  }
  /** Run the callback without calling any subscribers */
  ignoreUpdates(callback) {
    const dep = this.startDependencyTrack();
    dep.active = false;
    callback();
    dep.endDependencyTrack();
  }
  /** Create a new `DependencyList` from this tracker  */
  startDependencyTrack() {
    const deps = new DependencyList(this);
    this.#dependencyTrackers.unshift(deps);
    return deps;
  }
  endDependencyTrack(dep) {
    if (this.#dependencyTrackers[0] !== dep)
      throw Error("Specified dependency list is not top of stack");
    this.#dependencyTrackers.shift();
    return dep;
  }
  [RecordDependency](propRef) {
    if (this.#gettingPropRef) {
      this.#lastPropRef = propRef;
    } else {
      this.#dependencyTrackers[0]?.addDependency(propRef);
    }
  }
  #gettingPropRef = false;
  #lastPropRef = void 0;
  /**
   * Gets a property reference that refers to a particular property on a particular object.
   * It can get or set the target property value using the `current` property, so it's a valid React ref.
   * If there's an existing PropRef matching the arguments, it will be returned.
   * A new one will be created only if necessary.
   * @param propGetter parameter-less function that gets the target property value e.g. `() => model.settings.logFile`
   * @returns PropReference for an object property
   */
  getPropRef(propGetter) {
    const result = this.getPropRefTolerant(propGetter);
    if (!result)
      throw Error("No tracked properties.  Prop ref detection requires a tracked object.");
    return result;
  }
  getPropRefTolerant(propGetter) {
    if (this.#gettingPropRef)
      throw Error("Cannot be called re-entrantly.");
    this.#gettingPropRef = true;
    this.#lastPropRef = void 0;
    try {
      const actualValue = propGetter();
      if (!this.#lastPropRef)
        return void 0;
      const propRefCurrent = this.#lastPropRef.current;
      if (!Object.is(actualValue, propRefCurrent))
        console.error("The last operation of the callback must be a property get.\n`(foo || bar).quux` is allowed, but `foo.bar + 1` is not");
      return this.#lastPropRef;
    } finally {
      this.#gettingPropRef = false;
    }
  }
};
var defaultTracker = new Tracker();
function track(model2) {
  return defaultTracker.track(model2);
}
var emptyEffect = { dispose: () => {
} };
function effect(sideEffect, options = {}) {
  const { tracker = defaultTracker, suppressUntrackedWarning = false } = options;
  let dep = tracker.startDependencyTrack();
  let lastResult;
  try {
    lastResult = sideEffect(dep);
  } finally {
    dep.endDependencyTrack();
  }
  if (dep.trackedProperties.length === 0) {
    if (!suppressUntrackedWarning) {
      console.warn("effect() callback has no dependencies on any tracked properties.  It will not fire again.");
    }
    return emptyEffect;
  }
  let subscription = dep.subscribe(effectDependencyChanged);
  const effectDispose = () => {
    dep.untrackAll();
    subscription.dispose();
  };
  function effectDependencyChanged() {
    if (typeof lastResult === "function")
      lastResult();
    effectDispose();
    dep = tracker.startDependencyTrack();
    lastResult = sideEffect(dep);
    dep.endDependencyTrack();
    subscription = dep.subscribe(effectDependencyChanged);
  }
  return { dispose: effectDispose };
}
var nodeCleanups = /* @__PURE__ */ new WeakMap();
function registerCleanup(node, subscription) {
  const cleanups = nodeCleanups.get(node);
  if (cleanups) {
    cleanups.push(subscription);
  } else {
    nodeCleanups.set(node, [subscription]);
  }
}
function cleanup(node) {
  const cleanups = nodeCleanups.get(node);
  cleanups?.forEach((s) => s.dispose());
  if (node instanceof Element) {
    node.childNodes.forEach((child2) => cleanup(child2));
  }
}
var suppress = { suppressUntrackedWarning: true };
function isNodeModifier(obj) {
  return obj != null && typeof obj === "object" && "$muType" in obj && typeof obj.$muType === "string";
}
function doApply(el, mod) {
  if (Array.isArray(mod)) {
    mod.forEach((mod2) => doApply(el, mod2));
    return;
  }
  if (!isNodeModifier(mod))
    throw Error("Expected a node modifier for 'mu:apply', but got " + typeof mod);
  switch (mod.$muType) {
    case "attribute":
      el.setAttribute(mod.name, mod.value);
      break;
    default:
      throw Error("Unknown node modifier type: " + mod.$muType);
  }
}
function element(name, staticAttrs, dynamicAttrs, ...children) {
  const el = document.createElement(name);
  el.append(...children);
  let syncEvents;
  for (let [name2, value] of Object.entries(staticAttrs)) {
    switch (name2) {
      case "mu:syncEvent":
        syncEvents = value;
        break;
      case "mu:apply":
        doApply(el, value);
        break;
      default:
        el[name2] = value;
        break;
    }
  }
  const syncedProps = syncEvents ? [] : void 0;
  for (let [name2, getter] of Object.entries(dynamicAttrs)) {
    if (syncedProps && name2 in el) {
      const propRef = defaultTracker.getPropRefTolerant(getter);
      if (propRef) {
        syncedProps.push([name2, propRef]);
      }
    }
    switch (name2) {
      case "style": {
        const sub = effect(() => {
          Object.assign(el.style, getter());
        }, suppress);
        registerCleanup(el, sub);
        break;
      }
      case "classList": {
        const sub = effect(() => {
          const classMap = getter();
          for (const [name3, on] of Object.entries(classMap))
            el.classList.toggle(name3, !!on);
        }, suppress);
        registerCleanup(el, sub);
        break;
      }
      default: {
        const sub = effect(() => {
          el[name2] = getter();
        }, suppress);
        registerCleanup(el, sub);
        break;
      }
    }
  }
  if (syncEvents && syncedProps?.length) {
    for (const e of syncEvents.matchAll(/\S+/g)) {
      el.addEventListener(e[0], () => {
        for (const [name2, propRef] of syncedProps)
          propRef.current = el[name2];
      });
    }
  }
  return el;
}
function child(getter) {
  let node = document.createTextNode("");
  let sub = void 0;
  sub = effect((dl) => {
    const val = getter();
    if (val instanceof Node) {
      dl.untrackAll();
      node = val;
    } else {
      const newNode = document.createTextNode(String(val ?? ""));
      if (sub)
        registerCleanup(newNode, sub);
      node.replaceWith(newNode);
      node = newNode;
    }
  }, suppress);
  registerCleanup(node, sub);
  return node;
}
var ElementSpan = class {
  static id = 0;
  startMarker = document.createTextNode("");
  endMarker = document.createTextNode("");
  constructor(...node) {
    const frag = document.createDocumentFragment();
    frag.append(this.startMarker, ...node, this.endMarker);
  }
  /** extracts the entire span as a fragment */
  removeAsFragment() {
    if (this.startMarker.parentNode instanceof DocumentFragment) {
      return this.startMarker.parentNode;
    }
    const nodes = [];
    for (let walk = this.startMarker; ; walk = walk?.nextSibling) {
      if (walk == null)
        throw Error("End marker not found as subsequent document sibling as start marker");
      nodes.push(walk);
      if (Object.is(walk, this.endMarker))
        break;
    }
    const result = document.createDocumentFragment();
    result.append(...nodes);
    return result;
  }
  /** extracts the interior of the span into a fragment, leaving the span container empty */
  emptyAsFragment() {
    const nodes = [];
    for (let walk = this.startMarker.nextSibling; ; walk = walk?.nextSibling) {
      if (walk == null)
        throw Error("End marker not found as subsequent document sibling as start marker");
      if (Object.is(walk, this.endMarker))
        break;
      nodes.push(walk);
    }
    const result = document.createDocumentFragment();
    result.append(...nodes);
    return result;
  }
  /** replaces the interior contents of the span */
  replaceWith(...nodes) {
    this.emptyAsFragment();
    this.append(...nodes);
  }
  append(...nodes) {
    const frag = document.createDocumentFragment();
    frag.append(...nodes);
    if (!this.endMarker.parentNode)
      throw Error("End marker of ElementSpan has no parent");
    this.endMarker.parentNode.insertBefore(frag, this.endMarker);
  }
  registerCleanup(subscription) {
    registerCleanup(this.startMarker, subscription);
  }
  /** empties the contents of the span, and invokes cleanup on each child node */
  cleanup() {
    cleanup(this.startMarker);
    for (const node of this.emptyAsFragment().childNodes) {
      cleanup(node);
    }
  }
};
function isNodeOptions(arg) {
  return arg != null && typeof arg === "object" && "node" in arg && arg.node instanceof Node;
}
function Swapper(nodeFactory) {
  const span = new ElementSpan();
  let cleanup2;
  const swapperSubscription = effect(function swapperEffect(dep) {
    cleanup2?.();
    cleanup2 = void 0;
    span.cleanup();
    const output = nodeFactory();
    if (isNodeOptions(output)) {
      span.replaceWith(output.node);
      cleanup2 = output.cleanup;
    } else if (output != null) {
      span.replaceWith(output);
    }
  });
  span.registerCleanup(swapperSubscription);
  return span.removeAsFragment();
}
var suppress2 = { suppressUntrackedWarning: true };
function ForEach(array, map) {
  if (typeof array === "function")
    return Swapper(() => ForEach(array(), map));
  const result = new ElementSpan();
  const outputs = [];
  const arrayDefined = array ?? [];
  effect(function forEachLengthEffect(lengthDep) {
    for (let i = outputs.length; i < arrayDefined.length; i++) {
      const output = { container: new ElementSpan() };
      outputs.push(output);
      effect(function forEachItemEffect(dep) {
        output.cleanup?.();
        const item = arrayDefined[i];
        const projection = item !== void 0 ? map(item, i, arrayDefined) : document.createTextNode("");
        if (isNodeOptions(projection)) {
          output.container.replaceWith(projection.node);
          output.cleanup = projection.cleanup;
        } else if (projection != null) {
          output.container.replaceWith(projection);
          output.cleanup = void 0;
        }
      }, suppress2);
      result.append(output.container.removeAsFragment());
    }
    while (outputs.length > arrayDefined.length) {
      const { cleanup: cleanup2, container } = outputs.pop();
      cleanup2?.();
      container.cleanup;
    }
  }, suppress2);
  return result.removeAsFragment();
}
var suppress3 = { suppressUntrackedWarning: true };
function getEmptyText() {
  return document.createTextNode("");
}
function choose(...choices) {
  let current = getEmptyText();
  let currentNodeGetter = getEmptyText;
  effect(function chooseEffect() {
    let newNodeGetter;
    for (const { nodeGetter, conditionGetter } of choices) {
      if (!conditionGetter || conditionGetter()) {
        newNodeGetter = nodeGetter;
        break;
      }
    }
    newNodeGetter ??= getEmptyText;
    if (newNodeGetter !== currentNodeGetter) {
      cleanup(current);
      currentNodeGetter = newNodeGetter;
      const newNode = currentNodeGetter();
      current.replaceWith(newNode);
      current = newNode;
    }
  }, suppress3);
  return current;
}
var instanceId = String(Math.random() * 1e6 | 0);

// out2/data.js
var MassUnits;
(function(MassUnits2) {
  MassUnits2["Da"] = "Da";
  MassUnits2["ng"] = "ng";
  MassUnits2["Kg"] = "Kg";
  MassUnits2["Eg"] = "Eg";
  MassUnits2["MO"] = "M\u2609";
})(MassUnits || (MassUnits = {}));
var saQ_Up = {
  n: "Up",
  m: 0.3,
  u: MassUnits.Da,
  c: []
};
var saQ_Down = {
  n: "Down",
  m: 0.4,
  u: MassUnits.Da,
  c: []
};
var saL_Electron = {
  n: "Electron",
  m: 0,
  u: MassUnits.Da,
  c: []
};
var saB_Proton = {
  n: "Proton",
  m: 1,
  u: MassUnits.Da,
  c: [{
    f: saQ_Up,
    a: 2
  }, {
    f: saQ_Down,
    a: 1
  }]
};
var saB_Neutron = {
  n: "Neutron",
  m: 1,
  u: MassUnits.Da,
  c: [{
    f: saQ_Up,
    a: 1
  }, {
    f: saQ_Down,
    a: 2
  }]
};
var aH_Protium = {
  n: "Protium",
  m: 1,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 1
  }, {
    f: saL_Electron,
    a: 1
  }]
};
var aH_Deuterium = {
  n: "Deuterium",
  m: 2,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 1
  }, {
    f: saB_Neutron,
    a: 1
  }, {
    f: saL_Electron,
    a: 1
  }]
};
var aH_Tritium = {
  n: "Tritium",
  m: 3,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 1
  }, {
    f: saB_Neutron,
    a: 2
  }, {
    f: saL_Electron,
    a: 1
  }]
};
var aHe_3 = {
  n: "Helium-3",
  m: 3,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 2
  }, {
    f: saB_Neutron,
    a: 1
  }, {
    f: saL_Electron,
    a: 2
  }]
};
var aHe_4 = {
  n: "Helium-4",
  m: 4,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 2
  }, {
    f: saB_Neutron,
    a: 3
  }, {
    f: saL_Electron,
    a: 2
  }]
};
var aLi_6 = {
  n: "Lithium-6",
  m: 6,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 3
  }, {
    f: saB_Neutron,
    a: 3
  }, {
    f: saL_Electron,
    a: 3
  }]
};
var aLi_7 = {
  n: "Lithium-7",
  m: 7,
  u: MassUnits.Da,
  c: [{
    f: saB_Proton,
    a: 3
  }, {
    f: saB_Neutron,
    a: 4
  }, {
    f: saL_Electron,
    a: 3
  }]
};
var sa_Quark = {
  n: "Quark",
  u: true,
  g: 1,
  info: "Quarks are some of the most basic building block. They come in 6 types: Up, Down, Charm, Strange, Top, and Bottom. In this game we are only using Up and Down.",
  c: [saQ_Up, saQ_Down]
};
var sa_Lepton = {
  n: "Lepton",
  u: true,
  g: 1,
  info: "Leptons are some of the most basic building block. They come in 6 types: Electron, Muon, Tau, Electron Neutrino, Muon Neutrino, and Tau Neutrino. In this game we are only using Electrons.",
  c: [saL_Electron]
};
var sa_Baryon = {
  n: "Baryon",
  u: false,
  g: 1,
  info: "Baryons are made of 3 Quarks. There are a few dozen different types of Baryons. In this game we are only using Protons and Neutrons.",
  c: [saB_Proton, saB_Neutron]
};
var a_H = {
  n: "Hydrogen",
  u: false,
  g: 2,
  info: "Hydrogen is the most common element in the universe, made with only a single proton. There are two stable isotopes and a third with a halflife of ~12 years.",
  c: [aH_Protium, aH_Deuterium, aH_Tritium]
};
var a_He = {
  n: "Helium",
  u: false,
  g: 2,
  info: "Helium has two stable isotopes. Helium-3 is much more rare than the normal Helium-4.",
  c: [aHe_3, aHe_4]
};
var a_Li = {
  n: "Lithium",
  u: false,
  g: 2,
  info: "Lithium has two stable isotopes. Lithium-6 is much more rare than the normal Lithium-7.",
  c: [aLi_6, aLi_7]
};
var sa = {
  n: "Subatomic",
  u: true,
  c: [sa_Quark, sa_Lepton, sa_Baryon]
};
var atomic = {
  n: "Atomic",
  u: false,
  c: [a_H, a_He, a_Li]
};
var data = [sa, atomic];
var FlavorMap = {};
var ItemMap = {};
var ComponentMap = {};
function buildMaps() {
  data.forEach((g) => {
    g.c.forEach((i) => {
      if (ItemMap[i.n]) {
        console.error("Item already exists: " + i.n);
      }
      ItemMap[i.n] = g;
      i.c.forEach((f) => {
        if (FlavorMap[f.n]) {
          console.error("Flavor already exists: " + f.n);
        }
        FlavorMap[f.n] = i;
        f.c.forEach((c) => {
          if (!ComponentMap[c.f.n]) {
            ComponentMap[c.f.n] = [];
          }
          ComponentMap[c.f.n].push(f);
        });
      });
    });
  });
}
function load() {
}
function save() {
}

// out2/index.js
var _frag2;
var Tabs;
(function(Tabs2) {
  Tabs2[Tabs2["Generate"] = 0] = "Generate";
  Tabs2[Tabs2["Discover"] = 1] = "Discover";
  Tabs2[Tabs2["Settings"] = 2] = "Settings";
  Tabs2[Tabs2["Help"] = 3] = "Help";
})(Tabs || (Tabs = {}));
var tabButtons = {};
var menu = document.getElementById("menu");
var saveRate = 10;
var tickRate = 100;
var updateRate = 1e3;
var model = track({
  data,
  activeTab: 0,
  activeGroup: void 0,
  activeItem: void 0,
  activeFlavor: void 0,
  activeInventoryItem: void 0,
  inventory: [],
  generators: [],
  recipeSearchResults: [],
  loadingStatus: "Loading",
  interval: 0,
  gameClock: 0,
  lastUpdate: 0,
  lastSave: 0
});
function generatorCost(input) {
  const item = FlavorMap[input.f.n];
  return (10 ** item.g) ** input.l;
}
function findInventoryItem(input) {
  const temp = model.inventory.find((x) => x.f === input);
  if (temp) {
    return temp;
  }
  const newInvItem = {
    f: input,
    a: 0
  };
  model.inventory.push(newInvItem);
  return findInventoryItem(input);
}
function findGenerator(input) {
  const temp = model.generators.find((x) => x.f === input);
  if (temp) {
    return temp;
  }
  const newGenerator = {
    f: input,
    l: 0,
    a: true
  };
  model.generators.push(newGenerator);
  return newGenerator;
}
function recipeSearch(input) {
  model.recipeSearchResults.length = 0;
  const c = ComponentMap[input.n];
  c.forEach((f) => {
    const i = FlavorMap[f.n];
    const g = ItemMap[i.n];
    model.recipeSearchResults.push({
      g,
      i,
      f
    });
  });
}
function hasComponents(input) {
  let output = true;
  input.c.forEach((c) => {
    const inv = findInventoryItem(c.f);
    if (inv.a < c.a) {
      output = false;
    }
  });
  return output;
}
function generate(input, adjustment = 0) {
  const gen = findGenerator(input.f);
  if (!gen) {
    return;
  }
  if (!hasComponents(input.f)) {
    return;
  }
  const i = FlavorMap[input.f.n];
  i.u = true;
  ItemMap[i.n].u = true;
  input.f.c.forEach((c) => {
    const inv = findInventoryItem(c.f);
    inv.a -= c.a;
  });
  input.a += gen.l + adjustment;
  return;
}
function upgradeGenrator(input) {
  const gen = findGenerator(input);
  const inv = findInventoryItem(input);
  const cost = generatorCost(gen);
  if (inv.a < cost) {
    return;
  }
  gen.l++;
  inv.a -= cost;
}
function setTab(input) {
  Object.values(tabButtons).forEach((x) => x.classList.remove("selected"));
  tabButtons[`tab_${input}`].classList.add("selected");
  model.activeTab = input;
  model.activeGroup = void 0;
  model.activeItem = void 0;
  model.activeFlavor = void 0;
  model.recipeSearchResults.length = 0;
}
function setGroup(input) {
  model.activeGroup = input;
  model.activeItem = void 0;
  model.activeFlavor = void 0;
  model.recipeSearchResults.length = 0;
}
function setItem(input) {
  model.activeItem = input;
  model.activeFlavor = void 0;
  model.recipeSearchResults.length = 0;
}
function setFlavor(input) {
  model.activeFlavor = input;
  model.recipeSearchResults.length = 0;
  model.activeInventoryItem = findInventoryItem(model.activeFlavor);
}
function gotoFlavor(input) {
  const i = FlavorMap[input.n];
  const g = ItemMap[i.n];
  setTab(Tabs.Generate);
  setGroup(g);
  setItem(i);
  setFlavor(input);
}
function gotoItem(input) {
  const g = ItemMap[input.n];
  setTab(Tabs.Generate);
  setGroup(g);
  setItem(input);
}
function renderItemGroups() {
  return ForEach(model.data, (x) => element("button", {}, {
    className: () => `itemGroup${!x.u ? " hide" : ""}${x === model.activeGroup ? " selected" : ""}`,
    onclick: () => () => setGroup(x)
  }, child(() => x.n)));
}
function renderItems() {
  return ForEach(() => model.activeGroup?.c ?? [], (x) => element("button", {}, {
    className: () => `item${!x.u ? " hide" : ""}${x === model.activeItem ? " selected" : ""}`,
    onclick: () => () => setItem(x)
  }, child(() => x.n)));
}
function renderFlavors() {
  return ForEach(() => model.activeItem?.c ?? [], (x) => element("button", {}, {
    className: () => `flavor${!x.u ? " hide" : ""}${x === model.activeFlavor ? " selected" : ""}`,
    onclick: () => () => setFlavor(x)
  }, child(() => x.n)));
}
function renderGenerateButton(input) {
  const i = FlavorMap[input.f.n];
  const canDo = hasComponents(input.f);
  const className = `generateButton${!canDo ? " disabled" : ""}`;
  return element("button", {}, {
    className: () => className,
    onclick: () => () => generate(input, 1)
  }, "Generate");
}
function renderActiveFlavor() {
  return Swapper(() => renderFlavor(model.activeFlavor));
}
function renderFlavor(input) {
  var _frag;
  const inv = findInventoryItem(input);
  const i = FlavorMap[input.n];
  const g = ItemMap[i.n];
  return _frag = document.createDocumentFragment(), _frag.append(element("div", {
    className: "row"
  }, {}, element("div", {
    className: "cell block"
  }, {}, element("div", {
    className: "title"
  }, {}, "Inventory"), element("div", {}, {
    style: () => ({
      display: "flex"
    })
  }, element("div", {}, {}, child(() => renderGenerateButton(inv)), element("div", {
    className: "ownedItem"
  }, {}, "Owned: ", child(() => inv?.a ?? 0))))), element("div", {
    className: "cell block"
  }, {}, element("div", {
    className: "title"
  }, {}, "Generator"), child(() => renderGenerator(input))), element("div", {
    className: "cell block"
  }, {}, element("div", {
    className: "title"
  }, {}, "Components"), element("div", {}, {}, element("div", {}, {}, child(() => model.activeFlavor?.c?.length ? ForEach(() => model.activeFlavor?.c ?? [], (x) => renderComponentItem(x)) : element("span", {}, {}, "This is an elementary particle, it does not have components.")))))), element("div", {}, {}, element("div", {
    className: "block"
  }, {}, element("div", {
    className: "title"
  }, {}, "Used in"), choose({
    nodeGetter: () => element("div", {}, {}, element("p", {}, {}, " Spoiler Alert: This will show all items this item is a component for; including ones you have not unlocked yet. If you want to find everything the hard way then don't click. "), element("button", {}, {
      onclick: () => () => recipeSearch(input)
    }, "Search")),
    conditionGetter: () => !model.recipeSearchResults.length
  }), choose({
    nodeGetter: () => element("div", {}, {}, child(() => Swapper(() => renderSearchResults()))),
    conditionGetter: () => !!model.recipeSearchResults.length
  })))), _frag;
}
function renderComponentItem(input) {
  const inv = findInventoryItem(input.f);
  const i = FlavorMap[input.f.n];
  const g = ItemMap[i.n];
  if (!g || !i) {
    return element("li", {}, {}, "component not found");
  }
  return element("div", {
    className: "row"
  }, {}, element("div", {
    className: "cell"
  }, {}, child(() => g.n), ".", child(() => i.n), ".", child(() => input.f.n)), element("div", {
    className: "cell"
  }, {}, element("button", {}, {
    onclick: () => () => gotoFlavor(input.f)
  }, "\u2192")), element("div", {
    className: "cell"
  }, {}, " Owned:", child(() => inv.a), " / Need:", child(() => input.a)), element("div", {
    className: "cell"
  }, {}, child(() => renderGenerateButton(inv))));
}
function renderInventoryItem(input) {
  const inv = findInventoryItem(input.f);
  return element("div", {
    className: "inventoryItem"
  }, {}, "`$", child(() => input.f.n), " Owned: $", child(() => inv?.a ?? 0), "`");
}
function renderGenerator(input) {
  if (!input) {
    return element("div", {
      className: "hide"
    }, {});
  }
  const gen = findGenerator(input);
  if (!gen) {
    return element("div", {
      className: "generator"
    }, {}, "Empty");
  }
  return element("div", {}, {}, element("div", {
    className: "generator"
  }, {}, element("div", {}, {}, element("button", {}, {
    onclick: () => () => upgradeGenrator(input)
  }, "Upgrade", element("br", {}, {}), "(", child(() => generatorCost(gen)), ")")), element("div", {}, {}, element("div", {
    className: "nowrap"
  }, {}, element("label", {}, {
    htmlFor: () => `chkGen${input.n}`
  }, "Enabled:"), element("input", {
    type: "checkbox"
  }, {
    id: () => `chkGen${input.n}`,
    checked: () => gen.a,
    onchange: () => () => gen.a = !gen.a
  })), element("div", {
    className: "nowrap"
  }, {}, "Level: ", child(() => gen.l)))), element("div", {}, {}, "This will generate up to ", child(() => gen.l), " items every tick."));
}
function renderSearchResults() {
  return ForEach(() => model.recipeSearchResults, (x) => {
    const inv = findInventoryItem(x.f);
    return element("p", {}, {}, element("div", {
      className: "row"
    }, {}, element("div", {
      className: "cell"
    }, {}, child(() => x.g.n), ".", child(() => x.i.n), ".", child(() => x.f.n)), choose({
      nodeGetter: () => element("div", {
        className: "cell"
      }, {}, element("button", {}, {
        onclick: () => () => gotoItem(x.i)
      }, "\u2192")),
      conditionGetter: () => x.i.u
    }), element("div", {
      className: "cell"
    }, {}, child(() => renderGenerateButton(inv)))), element("ul", {
      className: "componentList"
    }, {}, child(() => ForEach(() => x.f.c, (y) => renderComponentItem(y)))));
  });
}
function mainLoop() {
  const now = performance.now();
  model.gameClock += now - model.lastUpdate;
  model.lastUpdate = now;
  let maxCycles = 100;
  while (model.gameClock > updateRate && maxCycles--) {
    model.gameClock -= updateRate;
    model.generators.forEach((x) => {
      if (!x.a) {
        return;
      }
      const inv = findInventoryItem(x.f);
      generate(inv);
    });
    if (--model.lastSave <= 0) {
      save();
      model.lastSave = saveRate;
    }
  }
}
function init() {
  model.loadingStatus = "Loading Game Data";
  buildMaps();
  model.loadingStatus = "Loading Save Data";
  load();
  model.loadingStatus = "Starting Game";
  model.lastUpdate = performance.now();
  model.interval = setInterval(mainLoop, tickRate);
  menu = document.getElementById("menu");
  for (const tab in Tabs) {
    const t = `tab_${tab}`;
    const e = document.getElementById(t);
    if (!e) {
      continue;
    }
    tabButtons[t] = e;
  }
}
var app = (_frag2 = document.createDocumentFragment(), _frag2.append(choose({
  nodeGetter: () => element("div", {
    className: "loading"
  }, {}, child(() => model.loadingStatus)),
  conditionGetter: () => !model.interval
}, {
  nodeGetter: () => element("div", {}, {}, element("h1", {}, {}, "Quarks"), element("div", {
    id: "menu"
  }, {}, element("button", {
    className: "selected"
  }, {
    id: () => `tab_${Tabs.Generate}`,
    onclick: () => () => setTab(Tabs.Generate)
  }, "Generate"), element("button", {}, {
    id: () => `tab_${Tabs.Discover}`,
    onclick: () => () => setTab(Tabs.Discover)
  }, "Discover"), element("button", {}, {
    id: () => `tab_${Tabs.Settings}`,
    onclick: () => () => setTab(Tabs.Settings)
  }, "Settings"), element("button", {}, {
    id: () => `tab_${Tabs.Help}`,
    onclick: () => () => setTab(Tabs.Help)
  }, "Help")), choose({
    nodeGetter: () => element("div", {
      className: "generate"
    }, {}, element("div", {
      className: "itemGroups"
    }, {}, child(() => renderItemGroups())), element("div", {
      className: "items"
    }, {}, child(() => renderItems()), choose({
      nodeGetter: () => element("p", {}, {}, child(() => model.activeItem?.info)),
      conditionGetter: () => !!model.activeItem
    })), element("div", {
      className: "flavors"
    }, {}, child(() => renderFlavors())), choose({
      nodeGetter: () => element("div", {
        className: "activeFlavor"
      }, {}, child(() => renderActiveFlavor())),
      conditionGetter: () => !!model.activeFlavor
    })),
    conditionGetter: () => model.activeTab === Tabs.Generate
  }), choose({
    nodeGetter: () => element("div", {
      className: "discover"
    }, {}, "Discover : unlock new items in the generate tab.", element("ul", {}, {}, element("li", {}, {}, "filter items?"), element("li", {}, {}, "add items to 'crafting table'?"), element("li", {}, {}, "test create? (no penalty)")), element("div", {}, {}, element("h3", {}, {}, "Inventory"), element("div", {}, {}, child(() => ForEach(model.inventory, (x) => renderInventoryItem(x))))), element("div", {}, {})),
    conditionGetter: () => model.activeTab === Tabs.Discover
  }), choose({
    nodeGetter: () => element("div", {
      className: "settings"
    }, {}, "Settings", element("ul", {}, {}, element("li", {}, {}, "show/hide info"), element("li", {}, {}, "save/load"), element("li", {}, {}, "hard reset game"), element("li", {}, {}, "infinite mode (all unlocked, infinite of g0-g3? items)"), element("li", {}, {}, "auto search on flavor click"), element("li", {}, {}), element("li", {}, {}))),
    conditionGetter: () => model.activeTab === Tabs.Settings
  }), choose({
    nodeGetter: () => element("div", {
      className: "help"
    }, {}, "Help", element("ul", {}, {}, element("li", {}, {}, "Buttons"), element("li", {}, {}, "Generating"), element("li", {}, {}, "Discovery"), element("li", {}, {}, "about"))),
    conditionGetter: () => model.activeTab === Tabs.Help
  }), element("br", {}, {}), element("div", {
    className: "mutraction"
  }, {}, "Made with ", element("a", {
    href: "https://mutraction.dev/",
    target: "_blank"
  }, {}, "\u03BCtraction")))
})), _frag2);
document.body.append(app);
init();
