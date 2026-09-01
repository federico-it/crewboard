import http from "node:http";

function getPages() {
  return new Promise((resolve, reject) => {
    http
      .get("http://127.0.0.1:9222/json/list", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(JSON.parse(data)));
        res.on("error", reject);
      })
      .on("error", reject);
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

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
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
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  return result.result?.value;
}

const pages = await getPages();
const page =
  pages.find((entry) => entry.type === "page" && entry.url.includes("/attendance")) ??
  pages.find((entry) => entry.type === "page" && entry.url.includes("crewboard"));
if (!page) {
  console.error("No Crewboard page on :9222");
  process.exit(1);
}
console.log("Page:", page.url);

const { ws, send } = await connectCdp(page.webSocketDebuggerUrl);
try {
  await send("Runtime.enable");
  const apiCheck = JSON.parse(
    await evaluate(
      send,
      "JSON.stringify({ hasModelContext: !!document.modelContext, status: document.querySelector('[role=status]')?.textContent, url: location.pathname, employee: document.body.innerText.match(/Signed in as ([^\\n]+)/)?.[1], ua: navigator.userAgent })",
    ),
  );
  console.log("API:", apiCheck);

  const result = await evaluate(
    send,
    `(() => {
      const run = async () => {
        try {
          const list = await document.modelContext.getTools();
          const tool = list.find((entry) => entry.name === "get_attendance_summary");
          if (!tool) return JSON.stringify({ error: "tool not found", tools: list.map((entry) => entry.name) });
          const output = await document.modelContext.executeTool(tool, '{"month":"2026-08"}');
          const counter = document.body.innerText.match(/WebMCP calls: (\\d+)/)?.[1]
            || document.body.innerText.match(/Successful tool calls: (\\d+)/)?.[1]
            || "0";
          return JSON.stringify({
            outputType: typeof output,
            output,
            counter,
            status: document.querySelector('[role=status]')?.textContent,
          });
        } catch (error) {
          return JSON.stringify({ error: error.message });
        }
      };
      return run();
    })()`,
    true,
  );
  console.log("Invocation:", result);
} finally {
  ws.close();
}
