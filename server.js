const express = require("express");
const helmet = require("helmet");

const app = express();
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

// 🔑 ENV
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_KEY = process.env.API_KEY;

// 🧠 Rate limit simples (memória)
const hits = {};
const WINDOW = 60 * 1000; // 1 min
const LIMIT = 8;

function isLimited(key) {
  const now = Date.now();
  if (!hits[key]) hits[key] = [];
  hits[key] = hits[key].filter(t => now - t < WINDOW);
  if (hits[key].length >= LIMIT) return true;
  hits[key].push(now);
  return false;
}

// 🔒 Middleware de segurança
app.use((req, res, next) => {
  if (req.path === "/") return next();

  const token = req.headers["x-api-key"];
  if (!token || token !== API_KEY) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (isLimited(ip)) {
    return res.status(429).json({ error: "Muitas requisições" });
  }

  next();
});

// 🌐 Página bonita simples (sem JS pesado pra não crashar)
app.get("/", (req, res) => {
  res.send(`
  <html>
  <body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(270deg,#ff0000,#00ffcc,#0066ff,#ff00ff);
  background-size:800% 800%;animation:rgb 10s infinite;color:white;font-family:sans-serif;">
  
  <div style="background:rgba(0,0,0,0.4);padding:40px;border-radius:20px;text-align:center;">
    <h1>🤖 AI API ONLINE</h1>
    <p>Segurança ativa • Anti-spam ativo</p>
  </div>

  <style>
  @keyframes rgb{
    0%{background-position:0% 50%}
    50%{background-position:100% 50%}
    100%{background-position:0% 50%}
  }
  </style>
  </body>
  </html>
  `);
});

// 🤖 IA (sem node-fetch → evita crash)
app.post("/ai", async (req, res) => {
  try {
    let msg = req.body.message;

    if (typeof msg !== "string") {
      return res.status(400).json({ error: "Mensagem inválida" });
    }

    msg = msg.slice(0, 300);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: msg }] }]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sem resposta";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 Rodando na porta", PORT));2
