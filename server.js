require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// Rota principal do chat
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Chave de API não configurada no servidor." });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Formato de mensagem inválido." });
  }

  // Converte histórico do formato Anthropic para o formato Gemini
  const geminiMessages = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: system || "Você é um assistente útil." }]
          },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || "Erro na API do Gemini.";
      return res.status(response.status).json({ error: errMsg });
    }

    // Extrai o texto da resposta do Gemini e devolve no mesmo formato que o frontend espera
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta.";
    res.json({
      content: [{ type: "text", text }]
    });

  } catch (err) {
    console.error("Erro ao chamar Gemini:", err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ MASP Bot (Gemini) rodando em http://localhost:${PORT}`);
});
