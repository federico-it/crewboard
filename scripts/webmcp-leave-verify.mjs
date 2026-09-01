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

const pages = await getPages();
const page = pages.find((entry) => entry.type === "page" && entry.url.includes("crewboard.srvly.it"));
if (!page) {
  console.error("No Crewboard tab on :9222");
  process.exit(1);
}

const { ws, send } = await connectCdp(page.webSocketDebuggerUrl);
try {
  await send("Runtime.enable");
  const result = await send("Runtime.evaluate", {
    expression: `(() => {
      const run = async () => {
        const list = await document.modelContext.getTools();
        const tool = list.find((entry) => entry.name === "get_leave_requests");
        if (!tool) return JSON.stringify({ error: "get_leave_requests not found", url: location.pathname });
        const raw = await document.modelContext.executeTool(tool, "{}");
        const text = document.body.innerText;
        const requests = JSON.parse(raw);
        const match = requests.find((item) => item.startDate === "2026-09-06" && item.endDate === "2026-09-12" && item.type === "annual");
        return JSON.stringify({
          url: location.pathname,
          successMessage: document.querySelector(".success-message")?.textContent || null,
          totalRequests: requests.length,
          confirmedRequest: match || null,
          allRequests: requests,
        });
      };
      return run();
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  console.log(result.result?.value);
} finally {
  ws.close();
}
