import http from "node:http";

function getPages() {
  return new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json/list", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function connectCdp(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve({ ws, send }));
    ws.addEventListener("error", reject);
  });
}

async function evaluate(send, expression, awaitPromise = false) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  return result.result?.value;
}

const pages = await getPages();
const page = pages.find((entry) => entry.type === "page" && entry.url.includes("crewboard.srvly.it"));
if (!page) {
  console.error("No Crewboard tab on :9222");
  process.exit(1);
}

const { ws, send } = await connectCdp(page.webSocketDebuggerUrl);
try {
  await send("Page.enable");
  await send("Runtime.enable");
  if (!page.url.includes("/leave")) {
    await send("Page.navigate", { url: "https://crewboard.srvly.it/leave" });
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  const ready = await evaluate(send, `JSON.stringify({
    url: location.pathname,
    status: document.querySelector('[role=status]')?.textContent || document.body.innerText.slice(0, 200)
  })`);
  console.log("Page:", ready);

  const result = await evaluate(send, `(() => {
    const run = async () => {
      const list = await document.modelContext.getTools();
      const tool = list.find((entry) => entry.name === "request_leave");
      if (!tool) return JSON.stringify({ error: "request_leave not found", tools: list.map((entry) => entry.name), url: location.pathname });
      const output = await document.modelContext.executeTool(tool, '{"startDate":"2026-09-06","endDate":"2026-09-12","type":"annual"}');
      const draftVisible = document.body.innerText.includes("Confirm leave request");
      const counter = document.body.innerText.match(/Successful tool calls: (\\d+)/)?.[1] || "0";
      return JSON.stringify({ output, draftVisible, counter, panel: document.body.innerText.includes("2026-09-06") });
    };
    return run();
  })()`, true);
  console.log("request_leave:", result);
} finally {
  ws.close();
}
