interface Env {
  GEMINI_API_KEY?: string;
  API_KEY?: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const apiKey = context.env.GEMINI_API_KEY || context.env.API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY environment variable is not configured on Cloudflare Pages Functions.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await context.request.json()) as any;
    const { token, metrics, prompt: customPrompt } = body;

    let prompt = customPrompt;
    if (!prompt && token && metrics) {
      prompt = `
        Você é um analista financeiro de criptomoedas experiente na blockchain Hive.
        Analise os seguintes dados do token ${token.symbol} (${token.name}):
        
        Preço Atual: ${metrics.lastPrice} HIVE
        Variação 24h: ${metrics.priceChangePercent}%
        Volume 24h: ${metrics.volume} HIVE
        Oferta em Circulação: ${token.circulatingSupply} ${token.symbol}
        Oferta Total: ${token.supply} ${token.symbol}
        Maior Lance de Compra (Bid): ${metrics.highestBid}
        Menor Oferta de Venda (Ask): ${metrics.lowestAsk}

        Forneça um resumo curto (máximo 3 parágrafos) em Português sobre a saúde do token, sentimento do mercado (baseado na variação e volume) e uma recomendação cautelosa de "Manter", "Comprar" ou "Vender" baseada apenas nos dados técnicos fornecidos. Seja profissional mas acessível. Use Markdown para formatação.
      `;
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing token/metrics data or prompt.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.status}`, details: errText }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = (await response.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Server error processing Gemini request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};
