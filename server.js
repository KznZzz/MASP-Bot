require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// Rota principal do chat
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Chave de API não configurada no servidor." });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Formato de mensagem inválido." });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          { role: "system", content: system || "Você é um assistente útil." },
          ...messages
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || "Erro na API do Groq.";
      return res.status(response.status).json({ error: errMsg });
    }

    // Devolve no mesmo formato que o frontend espera
    const text = data.choices?.[0]?.message?.content || "Sem resposta.";
    res.json({
      content: [{ type: "text", text }]
    });

  } catch (err) {
    console.error("Erro ao chamar Groq:", err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ MASP Bot (Groq) rodando em http://localhost:${PORT}`);
});
