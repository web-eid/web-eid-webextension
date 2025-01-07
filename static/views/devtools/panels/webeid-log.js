const ui = {
  logEntryTemplate: document.querySelector("#log-entry-template"),
  logContainer:     document.querySelector("section[data-page='log'] #log-messages"),
  clearButton:      document.querySelector("section[data-page='log'] #clear-log"),
};

function createLogEntryElement(type, time, message, source) {
  const root = ui.logEntryTemplate.content.cloneNode(true);

  const el = {
    entry:   root.querySelector(".entry"),
    time:    root.querySelector(".time"),
    message: root.querySelector(".message"),
    source:  root.querySelector(".source" ),
  };

  el.entry.classList.add(`type-${type}`);
  
  el.time.textContent    = time;
  el.message.textContent = message;
  el.source.textContent  = source;
  
  return el.entry;
}

function stringifyError(error) {
  const {
    fileName,
    lineNumber,
    columnNumber,
    message,
    name,
    code,
    stack,
  } = error;

  const prettyStack = (
    stack
      .trim()
      .split("\n")
      .map((part) => "\t" + part)
      .join("\n")
  );

  return `${name}: ${message}\n${prettyStack}`;
}

function stringifyMessageArray(message) {
  return (
    message
      .map((obj) => {
        if (typeof obj == "undefined") {
          return "(undefined)";
        } else if (obj == null) {
          return "(null)";
        } else if (obj instanceof Error || obj.stack != null) {
          return stringifyError(obj);
        } else if (obj instanceof Object) {
          return JSON.stringify(obj, null, "  ");
        } else {
          return String(obj);
        }
      })
      .join(", ")
  );
}

ui.clearButton.addEventListener("click", () => {
  [...ui.logContainer.children].forEach((child) => child.remove());
});

export default {
  append({ time, type, message, source }) {
    const { clientHeight, scrollHeight, scrollTop } = ui.logContainer;
  
    const isScrolledToBottom = (scrollHeight - scrollTop) === clientHeight;
    const messageString      = stringifyMessageArray(message);
    const logEntryElement    = createLogEntryElement(type, time, messageString, source);
  
    ui.logContainer.appendChild(logEntryElement);
  
    if (isScrolledToBottom) {
      ui.logContainer.scrollTo(0, ui.logContainer.scrollHeight);
    }
  },
};
