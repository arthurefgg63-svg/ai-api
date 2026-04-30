const express = require("express");
const helmet = require("helmet");
const fetch = require("node-fetch");

const app = express();
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

// 🔑 ENV
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_KEY = process.env.API_KEY;

// 🧠 Rate limit por IP
const ipHits = {};
const LIMIT = 10;          // máx 10 req
const WINDOW = 60 * 1000; // por minuto

// 🧠 Rate limit por "user-id" (vindo do Roblox)
const userHits = {};
const USER_LIMIT = 5; // 5 req/min por jogador

function isLimited(store, key, limit) {
  const now = Date.now();
  if (!store[key]) store[key] = [];
  store[key] = store[key].filter(t => now - t < WINDOW);
  if (store[key].length >= limit) return true;
  store[key].push(now);
  return false;
}

// 🔒 Middleware segurança
app.use((req, res, next) => {
  // libera página inicial
  if (req.path === "/") return next();

  const token = req.headers["x-api-key"];
  if (!token || token !== API_KEY) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (isLimited(ipHits, ip, LIMIT)) {
    return res.status(429).json({ error: "Rate limit IP" });
  }

  const userId = req.headers["x-user-id"] || "anon";
  if (isLimited(userHits, userId, USER_LIMIT)) {
    return res.status(429).json({ error: "Rate limit user" });
  }

  next();
});

// 🌈 Página bonita
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI API</title>
<style>
body{
  margin:0;
  height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  background: linear-gradient(270deg,#ff0000,#00ffcc,#0066ff,#ff00ff);
  background-size:800% 800%;
  animation:rgb 10s infinite;
  font-family:sans-serif;
  color:white;
}
@keyframes rgb{
  0%{background-position:0% 50%}
  50%{background-position:100% 50%}
  100%{background-position:0% 50%}
}
.box{
  background:rgba(0,0,0,0.4);
  padding:40px;
  border-radius:20px;
  backdrop-filter:blur(10px);
  text-align:center;
  box-shadow:0 0 40px rgba(0,0,0,0.6);
}
h1{font-size:50px}
p{opacity:.8}
</style>
</head>
<body>
<div class="box">
  <h1>🤖 AI API ONLINE</h1>
  <p>Proteção ativa • Rate limit ativo</p>
</div>
</body>
</html>
  `);
});

// 🤖 IA
app.post("/ai", async (req, res) => {
  try {
    let msg = req.body.message;

    if (typeof msg !== "string") {
      return res.status(400).json({ error: "Mensagem inválida" });
    }

    msg = msg.replace(/[<>]/g, "").slice(0, 300);

    if (msg.length < 2) {
      return res.status(400).json({ error: "Mensagem curta" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: msg }] }]
        }),
        timeout: 8000
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: "Erro IA" });
    }

    const data = await response.json();

    let reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sem resposta";

    reply = reply.slice(0, 800);

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta", PORT));
