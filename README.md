# Junaid Paracha · AI and automation portfolio

Run `Start-portfolio.bat` or `node serve.cjs`, then open http://127.0.0.1:4173. The local server is required for the browser to load the image models and inference runtime.

Vercel serves `dist/` as a static site. The portfolio requires no build dependencies, API keys, or environment variables. Each project has a shareable fragment link, such as `#crm-automation`.

Movie Recommendation, Airtable, Document Q&A, and CRM use sample data processed in the browser. The stage inspector shows inputs, decisions, intermediate data, and results. GitHub links point to available n8n exports. Connecting those workflows live would require a configured n8n instance and demo credentials.

The crop and PPE demos run third-party models through ONNX Runtime Web. Images stay in the visitor's browser. Wall segmentation uses a room schematic, and reinforcement learning uses a grid exercise and a CartPole simulation.

See [third-party notices](dist/third-party-notices.html) for model, runtime, and sample image credits.
