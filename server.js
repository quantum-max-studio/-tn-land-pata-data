const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');

const PORT = 8000;

http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-APP-NAME, Content-Type, Accept, Accept-Language');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Generic API Proxy
    if (req.url.startsWith('/api/')) {
        let body = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', () => {
            const bodyBuffer = Buffer.concat(body);
            let targetPath = '';

            // Map internal paths to TNGIS paths
            if (req.url.startsWith('/api/wms')) {
                targetPath = req.url.replace(/^\/api\/wms/, '/app/wms');
            } else if (req.url.startsWith('/api/nominatim')) {
                targetPath = req.url.replace(/^\/api\/nominatim/, '/nominatim');
            } else {
                targetPath = req.url.replace(/^\/api/, '/apps');
            }

            console.log(`[${new Date().toLocaleTimeString()}] 🛰️ PROXY: ${req.method} ${targetPath}`);

            const options = {
                hostname: 'tngis.tn.gov.in',
                path: targetPath,
                method: req.method,
                headers: {
                    'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
                    'X-APP-NAME': req.headers['x-app-name'] || 'NOC',
                    'Referer': 'https://tngis.tn.gov.in/apps/gi_viewer/',
                    'Origin': 'https://tngis.tn.gov.in',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            };

            if (bodyBuffer.length > 0) {
                options.headers['Content-Length'] = bodyBuffer.length;
            }

            const proxyReq = https.request(options, proxyRes => {
                const headers = { ...proxyRes.headers };
                delete headers['content-encoding'];
                delete headers['transfer-encoding'];
                delete headers['content-security-policy'];
                
                res.writeHead(proxyRes.statusCode, {
                    ...headers,
                    'Access-Control-Allow-Origin': '*'
                });
                proxyRes.pipe(res, { end: true });
            });

            proxyReq.on('error', err => {
                console.error('❌ Proxy Error:', err.message);
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            });

            if (bodyBuffer.length > 0) {
                proxyReq.write(bodyBuffer);
            }
            proxyReq.end();
        });
        return;
    }

    // Serve static files
    let filePath = '.' + req.url.split('?')[0];
    if (filePath === './') filePath = './index.html';

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.svg': contentType = 'image/svg+xml'; break;
        case '.ico': contentType = 'image/x-icon'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found: ' + filePath);
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}).listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 LOCAL SERVER: http://localhost:${PORT}`);
    console.log(`📡 PROXY: Active (Spoofing TNGIS Browser)`);
    console.log(`=========================================\n`);
});
