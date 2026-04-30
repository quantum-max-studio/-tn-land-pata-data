const https = require('https');

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, X-APP-NAME',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: ''
        };
    }

    return new Promise((resolve) => {
        let targetPath = '';
        
        // Custom mapping for different TNGIS services
        if (event.path.startsWith('/api/wms')) {
            targetPath = event.path.replace(/^\/api\/wms/, '/app/wms');
        } else if (event.path.startsWith('/api/nominatim')) {
            targetPath = event.path.replace(/^\/api\/nominatim/, '/nominatim');
        } else {
            // Default mapping: /api/... -> /apps/...
            targetPath = event.path.replace(/^\/api/, '/apps');
        }

        // Add query parameters back if they exist
        const queryString = Object.keys(event.queryStringParameters).length > 0 
            ? '?' + new URLSearchParams(event.queryStringParameters).toString()
            : '';
        
        targetPath += queryString;

        const options = {
            hostname: 'tngis.tn.gov.in',
            path: targetPath,
            method: event.httpMethod,
            headers: {
                ...event.headers, // Pass through all headers (CORS, x-app-key, etc.)
                'Host': 'tngis.tn.gov.in',
                'Referer': 'https://tngis.tn.gov.in/apps/gi_viewer/',
                'Origin': 'https://tngis.tn.gov.in',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'X-APP-NAME': 'NOC' // Force 'NOC' as it's more reliable than 'demo'
            }
        };
        
        // Remove Netlify-specific headers that might confuse the target server
        delete options.headers['x-nf-client-connection-ip'];
        delete options.headers['x-forwarded-for'];
        delete options.headers['host'];

        // Handle POST body
        let body = event.body || '';
        if (event.isBase64Encoded) {
            body = Buffer.from(body, 'base64');
        }

        if (body && body.length > 0) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const proxyReq = https.request(options, proxyRes => {
            let chunks = [];
            proxyRes.on('data', chunk => chunks.push(chunk));
            proxyRes.on('end', () => {
                const buffer = Buffer.concat(chunks);
                
                // Copy original headers but allow CORS
                const responseHeaders = {
                    ...proxyRes.headers,
                    'Access-Control-Allow-Origin': '*'
                };
                
                // Remove headers that might cause issues with Netlify's response
                delete responseHeaders['content-encoding'];
                delete responseHeaders['transfer-encoding'];
                delete responseHeaders['connection'];

                resolve({
                    statusCode: proxyRes.statusCode,
                    headers: responseHeaders,
                    body: buffer.toString('base64'),
                    isBase64Encoded: true
                });
            });
        });

        proxyReq.on('error', err => {
            console.error('Proxy error:', err);
            resolve({
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: err.message })
            });
        });

        if (body && body.length > 0) {
            proxyReq.write(body);
        }
        proxyReq.end();
    });
};
