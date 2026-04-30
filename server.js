const express = require("express");
const helmet = require("helmet");
const fetch = require("node-fetch");

const app = express();

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

// 🔑 ENV
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_KEY = process.env.API_KEY;

// 🚫 RATE LIMIT (simples e eficiente)
const requests = {};
const LIMIT = 15;
const WINDOW = 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();

  if (!requests[ip]) requests[ip] = [];

  requests[ip] = requests[ip].filter(t => now - t < WINDOW);

  if (requests[ip].length >= LIMIT) return true;

  requests[ip].push(now);
  return false;
}

// 🔒 MIDDLEWARE SEGURANÇA
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Muitas requisições" });
  }

  const token = req.headers["x-api-key"];
  if (!token || token !== API_KEY) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  next();
});

// 🧠 IA
app.post("/ai", async (req, res) => {
  try {
    let msg = req.body.message;

    // validação
    if (typeof msg !== "string") {
      return res.status(400).json({ error: "Mensagem inválida" });
    }

    msg = msg.replace(/[<>]/g, "").slice(0, 500);

    if (msg.length < 2) {
      return res.status(400).json({ error: "Mensagem muito curta" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: msg }] }]
        }),
        timeout: 10000
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: "Erro na IA" });
    }

    const data = await response.json();

    let reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sem resposta";

    reply = reply.slice(0, 1000);

    res.json({ reply });

  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// 🩺 HEALTH CHECK
app.get("/", (req, res) => {
  res.send("API ONLINE 🔥");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Rodando na porta", PORT);
});
