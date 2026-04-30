  backdrop-filter:blur(10px);
  text-align:center;
  box-shadow:0 0 40px rgba
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
