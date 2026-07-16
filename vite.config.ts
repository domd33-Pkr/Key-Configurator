import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { exec } from 'child_process';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sync-endpoint',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/sync' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                // Save JSON to Key Configurator/Archives/keyboard_layout_updated.json
                const jsonPath = '/home/dominic/Documents/Claviers/Key Configurator/Archives/keyboard_layout_updated.json';
                fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

                // Execute Sync Layout.sh
                const scriptPath = '/home/dominic/Documents/Claviers/Actions/Linux/Sync Layout.sh';
                exec(`"${scriptPath}"`, (error, stdout, stderr) => {
                  if (error) {
                    console.error('Error executing Sync Layout:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message, stderr }));
                    return;
                  }
                  console.log('Sync Layout stdout:', stdout);
                  console.error('Sync Layout stderr:', stderr);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, stdout, stderr }));
                });
              } catch (e: any) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
});
