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
function visibleGroups() {
  return data.filter((x) => x.u);
}
function visibleItems(groupId) {
  const group = visibleGroups().find((x) => x.i === groupId);
  if (!group) {
    return [];
  }
  return group.l.filter((x) => x.u);
}
function visibleFlavors(groupId, itemId) {
  const item = visibleItems(groupId).find((x) => x.i === itemId);
  if (!item) {
    return [];
  }
  return item.f;
}
var data = [{
  i: 0,
  n: "Subatomic",
  u: true,
  l: [{
    i: 0,
    n: "Quark",
    u: true,
    g: 1,
    info: "Quarks are some of the most basic building block. They come in 6 types: Up, Down, Charm, Strange, Top, and Bottom. In this game we are only using Up and Down.",
    f: [{
      i: 0,
      n: "Up",
      m: 0.3,
      u: MassUnits.Da,
      c: []
    }, {
      i: 1,
      n: "Down",
      m: 0.4,
      u: MassUnits.Da,
      c: []
    }]
  }, {
    i: 1,
    n: "Lepton",
    u: true,
    g: 1,
    info: "Leptons are some of the most basic building block. They come in 6 types: Electron, Muon, Tau, Electron Neutrino, Muon Neutrino, and Tau Neutrino. In this game we are only using Electrons.",
    f: [{
      i: 0,
      n: "Electron",
      m: 0,
      u: MassUnits.Da,
      c: []
    }]
  }, {
    i: 2,
    n: "Baryons",
    u: false,
    g: 2,
    info: "Baryons are made of 3 Quarks. There are a few dozen different types of Baryons. In this game we are only using Protons and Neutrons.",
    f: [{
      i: 0,
      n: "Proton",
      m: 1,
      u: MassUnits.Da,
      c: [{
        g: 0,
        i: 0,
        f: 0,
        a: 2
      }, {
        g: 0,
        i: 0,
        f: 2,
        a: 1
      }]
    }, {
      i: 1,
      n: "Neutron",
      m: 1,
      u: MassUnits.Da,
      c: [{
        g: 0,
        i: 0,
        f: 0,
        a: 1
      }, {
        g: 0,
        i: 0,
        f: 2,
        a: 2
      }]
    }]
  }]
}, {
  i: 1,
  n: "Atomic",
  u: false,
  l: [{
    i: 0,
    n: "Hydrogen",
    u: false,
    g: 3,
    info: "Hydrogen is the most common element in the universe, made with only a single proton. There are two stable isotopes.",
    f: [{
      i: 0,
      n: "1-H",
      m: 1,
      u: MassUnits.Da,
      c: [{
        g: 0,
        i: 2,
        f: 0,
        a: 1
      }, {
        g: 0,
        i: 1,
        f: 0,
        a: 1
      }]
    }, {
      i: 1,
      n: "2-H",
      m: 1,
      u: MassUnits.Da,
      c: [{
        g: 0,
        i: 2,
        f: 0,
        a: 1
      }, {
        g: 0,
        i: 2,
        f: 1,
        a: 1
      }, {
        g: 0,
        i: 1,
        f: 0,
        a: 1
      }]
    }]
  }, {
    i: 1,
    n: "Helium",
    u: false,
    g: 3,
    info: "Helium has two stable isotopes. Helium-3 is much more rare than the normal Helium-4.",
    f: [{
      i: 0,
      n: "3-He",
      m: 1,
      u: MassUnits.Da,
      c: [{
        g: 0,
        i: 2,
        f: 0,
        a: 2
      }, {
        g: 0,
        i: 2,
        f: 1,
        a: 1
      }, {
        g: 0,
        i: 1,
        f: 0,
        a: 2
      }]
    }, {
      i: 1,
      n: "4-He",
      m: 1,
      u: MassUnits.Da,
      c: [{
        g: 0,
        i: 2,
        f: 0,
        a: 2
      }, {
        g: 0,
        i: 2,
        f: 1,
        a: 2
      }, {
        g: 0,
        i: 1,
        f: 0,
        a: 2
      }]
    }]
  }]
}];

// out2/index.js
var _frag;
var model = track({
  activeTab: 0,
  activeGroup: -1,
  activeItem: -1,
  activeFlavor: -1,
  inventory: [],
  generators: []
});
function currentFlavor() {
  return data.find((x) => x.i === model.activeGroup)?.l.find((x) => x.i === model.activeItem)?.f.find((x) => x.i === model.activeFlavor);
}
function setTab(input) {
  model.activeTab = input;
  model.activeGroup = -1;
  model.activeItem = -1;
  model.activeFlavor = -1;
}
function setGroup(input) {
  model.activeGroup = input;
  model.activeItem = -1;
  model.activeFlavor = -1;
  console.log("Group", input, visibleItems(model.activeGroup));
}
function setItem(input) {
  model.activeItem = input;
  model.activeFlavor = -1;
  console.log("Item", input, visibleFlavors(model.activeGroup, model.activeItem));
}
function setFlavor(input) {
  model.activeFlavor = input;
  const flavor = currentFlavor();
  if (!flavor) {
    return;
  }
  alert(`flavor town ${flavor.n}!`);
}
function renderItemGroup(input) {
  return element("button", {
    className: "itemGroup"
  }, {
    onclick: () => () => setGroup(input.i)
  }, child(() => input.n));
}
function renderItemGroups() {
  return ForEach(visibleGroups(), (x) => renderItemGroup(x));
}
function renderItem(input) {
  return element("button", {
    className: "item"
  }, {
    onclick: () => () => setItem(input.i)
  }, child(() => input.n));
}
function renderItems() {
  return ForEach(visibleItems(model.activeGroup), (x) => renderItem(x));
}
function renderFlavor(input) {
  return element("button", {
    className: "flavor"
  }, {
    onclick: () => () => setFlavor(input.i)
  }, child(() => input.n));
}
function renderFlavors() {
  return ForEach(visibleFlavors(model.activeGroup, model.activeItem), (x) => renderFlavor(x));
}
var app = (_frag = document.createDocumentFragment(), _frag.append(element("h1", {}, {}, "Quarks"), element("div", {}, {}, element("button", {}, {
  onclick: () => () => setTab(0)
}, "Generate"), element("button", {}, {
  onclick: () => () => setTab(1)
}, "Discover"), element("button", {}, {
  onclick: () => () => setTab(2)
}, "Settings")), choose({
  nodeGetter: () => element("div", {
    className: "generate"
  }, {}, element("div", {
    className: "itemGroups"
  }, {}, child(() => renderItemGroups())), element("div", {
    className: "items"
  }, {}, child(() => renderItems())), element("div", {
    className: "flavors"
  }, {}, child(() => renderFlavors()))),
  conditionGetter: () => model.activeTab === 0
}), choose({
  nodeGetter: () => element("div", {
    className: "discover"
  }, {}, "Discover"),
  conditionGetter: () => model.activeTab === 1
}), choose({
  nodeGetter: () => element("div", {
    className: "settings"
  }, {}, "Settings"),
  conditionGetter: () => model.activeTab === 2
})), _frag);
document.body.append(app);
