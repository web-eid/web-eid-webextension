const ui = {
  eventTemplate: document.querySelector("#event-template"),
  eventList:     document.querySelector("section[data-page='events'] #event-list"),
  eventDetails:  document.querySelector("section[data-page='events'] #event-details"),
  clearButton:   document.querySelector("section[data-page='events'] #clear-events"),
};

function createEventElement(layer1, layer2, type, time, name, data) {
  const root = ui.eventTemplate.content.cloneNode(true);

  const el = {
    event:     root.querySelector(".event"),
    input:     root.querySelector("input"),
    label:     root.querySelector("label"),
    layer1:    root.querySelector(".layer-1"),
    layer2:    root.querySelector(".layer-2"),
    direction: root.querySelector(".direction"),
    time:      root.querySelector(".time"),
    name:      root.querySelector(".name"),
  };

  el.label.dataset.indent = ({
    "Extension (content)":    1,
    "Extension (background)": 2,
    "Native app":             3,
  })[layer1] ?? 0;

  el.input.id      = "event-" + Math.random().toString(36).substring(2);
  el.label.htmlFor = el.input.id;

  el.layer1.textContent = layer1;
  el.layer2.textContent = layer2;
  el.time.textContent   = time;
  el.name.textContent   = name;
  
  el.direction.textContent = (
    type === "request"
      ? "—►"
      : type === "response"
        ? "◄—"
        : ""
  );

  if (type === "response") {
    el.label.dataset.responseType = name.split(/-|:/g).at(-1);
  }

  el.direction.dataset.type = type;

  el.input.addEventListener("change", () => {
    ui.eventDetails.textContent = JSON.stringify(data, null, "  ");
  });
  
  return el.event;
}

export default {
  append({ layer1, layer2, type, time, data }) {
    const name         = data.action ?? data.command ?? data.type ?? data.result ?? type;
    const eventElement = createEventElement(layer1, layer2, type, time, name, data);

    ui.eventList.appendChild(eventElement);
  },
};
