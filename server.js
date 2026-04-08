require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Chave da Groq não configurada." });
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
        model: "llaama3-70b-8192", // ou "llama3-70b-8192"
        max_tokens: 1000,
        messages: [
          { role: "system", content: system || "Você é um assistente útil." },
          ...messages
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Erro na API da Groq." });
    }

    const text = data.choices?.[0]?.message?.content || "Sem resposta.";
    res.json({ content: [{ type: "text", text }] });

  } catch (err) {
    console.error("Erro ao chamar Groq:", err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Bot (Groq) rodando em http://localhost:${PORT}`);
});
