const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// 🔑 ENV
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_KEY = process.env.API_KEY;

// 🔒 proteção simples
app.use((req, res, next) => {
  if (req.path === "/") return next();

  const token = req.headers["x-api-key"];
  if (!token || token !== API_KEY) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  next();
});

// 🌐 página simples (pra testar)
app.get("/", (req, res) => {
  res.send("API ONLINE 🔥");
});

// 🤖 IA
app.post("/ai", async (req, res) => {
  try {
    const msg = req.body.message;

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
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando"));
