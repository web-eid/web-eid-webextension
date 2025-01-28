/*
 * Copyright (c) 2024-2025 Estonian Information System Authority
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
