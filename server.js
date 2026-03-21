require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// Rota principal do chat
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Chave de API não configurada no servidor." });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Formato de mensagem inválido." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: system || "Você é um assistente útil.",
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Erro na API." });
    }

    res.json(data);
  } catch (err) {
    console.error("Erro ao chamar Anthropic:", err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ MASP Bot rodando em http://localhost:${PORT}`);
});
