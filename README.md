# Arya Offices — Em Breve

Página de pré-lançamento do empreendimento **Arya Offices**, no Polo Tecnológico Sul de Uberlândia/MG.

🌐 **Produção**: https://aryaoffices.com.br
📱 **Instagram**: [@aryaoffices](https://www.instagram.com/aryaoffices/)
💬 **WhatsApp**: [+55 34 99971-4474](https://wa.me/5534999714474)

## Stack

- HTML5 + CSS3 + JavaScript vanilla (sem framework)
- Fonts: Fraunces (display) + Archivo (corpo)
- Deploy: Vercel
- Domínio: aryaoffices.com.br (Registro.br)

## Estrutura

```
.
├── index.html       # Página principal
├── style.css        # Estilos completos
├── script.js        # Slider, reveals, form
├── assets/
│   ├── logo.svg     # Logo da marca
│   └── fotos/       # Galeria do edifício
└── vercel.json      # Config de deploy
```

## Desenvolvimento local

Como é HTML puro, basta abrir `index.html` no navegador.
Ou rodar um servidor estático:

```bash
npx serve .
# ou
python -m http.server 3000
```

## Deploy

Push para `main` faz deploy automático no Vercel.

## TODO pós-lançamento

- [ ] Integrar formulário com Formspree ou Web3Forms
- [ ] Adicionar GA4 (substituir `GA_MEASUREMENT_ID` no index.html)
- [ ] Adicionar Meta Pixel (substituir `PIXEL_ID` no index.html)
- [ ] Otimizar fotos PNG → WebP
- [ ] Gerar OG image dedicada

---

© Arya Offices · Desenvolvido por [Laércio Oliveira Design](https://github.com/laerciooliveiradesign)
