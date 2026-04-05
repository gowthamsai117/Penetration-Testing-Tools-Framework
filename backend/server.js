const express = require('express');
const app = express();
const port = 5000;
const cors = require('cors');
const bodyParser = require('body-parser');
const sudo = require('sudo-prompt');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns').promises;
const fs = require('fs');

// Use dynamic import for 'open'
async function openBrowser(url) {
    const open = (await import('open')).default;
    open(url);
}

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// Serve static files (if needed)
app.use(express.static(path.join(__dirname, 'dist')));

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Pentest Tools Backend API', status: 'Online', tools: 13 });
});

// Sudo authentication flag
let sudoAuthenticated = false;

// Helper function to execute commands with sudo
function executeWithSudo(command, res, toolName, target) {
    if (!sudoAuthenticated) {
        sudo.exec('echo "sudo password prompt"', { name: toolName }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error prompting for sudo password: ${stderr}`);
                return res.status(500).send({ error: 'Failed to authenticate with sudo' });
            }
            sudoAuthenticated = true;
            executeCommand(command, res, toolName, target);
        });
    } else {
        executeCommand(command, res, toolName, target);
    }
}

// Helper function to execute commands
function executeCommand(command, res, toolName, target) {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing ${toolName} command: ${stderr}`);
            return res.status(500).send({ error: stderr });
        }
        console.log(`${toolName} output: ${stdout}`);

        // Save to history
        if (target) {
            saveScanHistory(toolName, target, 'Command Executed', stdout);
        }

        res.send({ output: stdout });
    });
}

// History persistence
const HISTORY_FILE = 'scan_history.json';

function loadHistory() {
    if (!fs.existsSync(HISTORY_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error loading history:', err);
        return [];
    }
}

function saveScanHistory(toolName, target, resultSummary, fullOutput) {
    const history = loadHistory();
    const entry = {
        id: history.length + 1,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        tool: toolName,
        target: target,
        summary: resultSummary,
        output: fullOutput,
        status: 'Completed'
    };

    // Prepend new entry
    history.unshift(entry);

    // Limit to last 50 entries
    if (history.length > 50) {
        history.length = 50;
    }

    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 4));
    } catch (err) {
        console.error('Error saving history:', err);
    }
}

// 1. Dig Tool
app.post('/dig', async (req, res) => {
    const { domain } = req.body;

    if (!domain) {
        return res.status(400).send({ error: 'Domain name is required' });
    }

    try {
        const records = {};

        // A Record
        try {
            const aRecords = await dns.resolve4(domain);
            records.A_Record = aRecords;
        } catch {
            records.A_Record = "No A record found";
        }

        // MX Records
        try {
            const mxRecords = await dns.resolveMx(domain);
            records.MX_Records = mxRecords.map(record => `${record.priority} ${record.exchange}`);
        } catch {
            records.MX_Records = "No MX record found";
        }

        // TXT Records
        try {
            const txtRecords = await dns.resolveTxt(domain);
            records.TXT_Records = txtRecords.flat();
        } catch {
            records.TXT_Records = "No TXT record found";
        }

        // NS Records
        try {
            const nsRecords = await dns.resolveNs(domain);
            records.NS_Records = nsRecords;
        } catch {
            records.NS_Records = "No NS record found";
        }

        // CNAME Records
        try {
            const cnameRecords = await dns.resolveCname(domain);
            records.CNAME_Records = cnameRecords;
        } catch {
            records.CNAME_Records = "No CNAME record found";
        }

        saveScanHistory('Dig', domain, 'DNS Records Retrieved', records);
        res.send(records);
    } catch (error) {
        console.error(`Error in Dig: ${error.message}`);
        res.status(500).send({ error: `Failed to run Dig: ${error.message}` });
    }
});

// 2. theHarvester Tool (Real Tool or Enhanced)
app.post('/theharvester', async (req, res) => {
    const { domain } = req.body;

    if (!domain) {
        return res.status(400).send({ error: 'Domain name is required' });
    }

    // Try to execute real theHarvester tool
    const command = `theHarvester -d ${domain} -b google,bing,duckduckgo -l 100`;
    exec(command, async (error, stdout, stderr) => {
        if (!error && stdout) {
            // Real tool executed successfully
            console.log('theHarvester executed successfully');
            saveScanHistory('theHarvester', domain, 'Emails/Hosts Found', stdout);
            return res.send({ output: stdout });
        }

        // Fallback to enhanced implementation
        console.log('theHarvester not found, using enhanced fallback');
        const result = { Emails: new Set(), Hosts: new Set(), IPs: [] };

        try {
            // Enhanced email regex pattern
            const escapedDomain = domain.replace(/\./g, '\\.');
            const emailRegex = new RegExp(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*${escapedDomain}`, 'gi');

            // Multiple search sources
            const sources = [
                `https://www.google.com/search?q=site:${domain}+email+OR+@${domain}`,
                `https://www.bing.com/search?q=site:${domain}+contact`,
                `https://${domain}/about`,
                `https://${domain}/contact`
            ];

            for (const url of sources) {
                try {
                    const response = await axios.get(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                        timeout: 5000
                    });

                    // Extract emails
                    const emails = response.data.match(emailRegex);
                    if (emails) emails.forEach(e => result.Emails.add(e.toLowerCase()));

                    // Extract hosts/subdomains
                    const hostRegex = new RegExp(`https?://([a-zA-Z0-9.-]*\\.?${escapedDomain})`, 'gi');
                    const hosts = response.data.match(hostRegex);
                    if (hosts) {
                        hosts.forEach(h => {
                            const subdomain = h.match(/https?:\/\/([^/]+)/)[1];
                            if (subdomain !== domain) result.Hosts.add(subdomain);
                        });
                    }
                } catch (e) {
                    // Continue with other sources
                }
            }

            // Get IPs
            try {
                const ips = await dns.resolve4(domain);
                result.IPs = ips;
            } catch {
                result.IPs = [];
            }

            const output = `\n[*] Target: ${domain}\n\n` +
                `[+] Emails found: ${result.Emails.size}\n` +
                Array.from(result.Emails).map(e => `    ${e}`).join('\n') + '\n\n' +
                `[+] Hosts found: ${result.Hosts.size}\n` +
                Array.from(result.Hosts).map(h => `    ${h}`).join('\n') + '\n\n' +
                `[+] IPs found: ${result.IPs.length}\n` +
                result.IPs.map(ip => `    ${ip}`).join('\n');

            saveScanHistory('theHarvester', domain, `Emails: ${result.Emails.size}, Hosts: ${result.Hosts.size}`, output);
            res.send({ output });
        } catch (error) {
            console.error(`Error in theHarvester: ${error.message}`);
            res.status(500).send({ error: `Failed to run theHarvester: ${error.message}` });
        }
    });
});

// 3. Recon-ng Tool (Real Tool or Enhanced)
app.post('/reconng', async (req, res) => {
    const { target } = req.body;

    if (!target) {
        return res.status(400).send({ error: 'Target is required' });
    }

    // Try to execute real recon-ng
    const command = `recon-ng -m recon/domains-hosts/bing_domain_web -o SOURCE=${target} -x`;
    exec(command, async (error, stdout, stderr) => {
        if (!error && stdout) {
            saveScanHistory('Recon-ng', target, 'Reconnaissance Completed', stdout);
            return res.send({ output: stdout });
        }

        // Fallback to enhanced implementation
        console.log('Recon-ng not found, using enhanced fallback');
        const result = { Hosts: new Set() };

        try {
            // Use crt.sh for certificate transparency logs
            try {
                const crtResponse = await axios.get(`https://crt.sh/?q=%.${target}&output=json`, {
                    timeout: 10000
                });
                if (crtResponse.data) {
                    crtResponse.data.forEach(cert => {
                        if (cert.name_value) {
                            cert.name_value.split('\n').forEach(name => {
                                if (name.endsWith(target) && name !== target) {
                                    result.Hosts.add(name.replace('*.', ''));
                                }
                            });
                        }
                    });
                }
            } catch (e) {
                console.log('crt.sh failed, trying search engines');
            }

            // Search engines as fallback
            const query = `site:*.${target} -inurl:(signup | login)`;
            const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 5000
            });
            const $ = cheerio.load(response.data);

            $('a').each((i, link) => {
                const href = $(link).attr('href');
                if (href && href.includes(target)) {
                    const subdomain = href.split('/')[2] || href.split('/')[0];
                    if (subdomain.endsWith(target) && subdomain !== target) {
                        result.Hosts.add(subdomain);
                    }
                }
            });

            const output = `\n[*] Target: ${target}\n\n` +
                `[+] Hosts found: ${result.Hosts.size}\n` +
                Array.from(result.Hosts).map(h => `    ${h}`).join('\n');

            saveScanHistory('Recon-ng', target, `Hosts Found: ${result.Hosts.size}`, output);
            res.send({ output });
        } catch (error) {
            console.error(`Error in Recon-ng: ${error.message}`);
            res.status(500).send({ error: `Failed to run Recon-ng: ${error.message}` });
        }
    });
});

// 4. Dnsenum Tool
app.post('/dnsenum', async (req, res) => {
    const { domain } = req.body;

    if (!domain) {
        return res.status(400).send({ error: 'Domain name is required' });
    }

    const records = {};
    const subdomains = [];
    try {
        // DNS Records
        for (const recordType of ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA']) {
            try {
                let result;
                if (recordType === 'A') result = await dns.resolve4(domain);
                else if (recordType === 'AAAA') result = await dns.resolve6(domain);
                else if (recordType === 'MX') result = (await dns.resolveMx(domain)).map(r => `${r.priority} ${r.exchange}`);
                else if (recordType === 'NS') result = await dns.resolveNs(domain);
                else if (recordType === 'TXT') result = (await dns.resolveTxt(domain)).flat();
                else if (recordType === 'SOA') result = [(await dns.resolveSoa(domain)).nsname];
                records[`${recordType}_Records`] = result;
            } catch {
                records[`${recordType}_Records`] = `No ${recordType} record found`;
            }
        }

        // Subdomains (basic brute-force)
        const commonSubdomains = ['www', 'mail', 'ftp', 'blog', 'dev', 'api'];
        for (const sub of commonSubdomains) {
            try {
                const subdomain = `${sub}.${domain}`;
                await dns.resolve4(subdomain);
                subdomains.push(subdomain);
            } catch {
                continue;
            }
        }

        saveScanHistory('Dnsenum', domain, 'DNS Enumeration Completed', { Records: records, Subdomains: subdomains });
        res.send({ Records: records, Subdomains: subdomains });
    } catch (error) {
        console.error(`Error in Dnsenum: ${error.message}`);
        res.status(500).send({ error: `Failed to run Dnsenum: ${error.message}` });
    }
});

// 5. Sublist3r Tool (Real Tool or Enhanced with crt.sh)
app.post('/sublist3r', async (req, res) => {
    const { domain } = req.body;

    if (!domain) {
        return res.status(400).send({ error: 'Domain name is required' });
    }

    // Try to execute real Sublist3r
    const command = `sublist3r -d ${domain} -n`;
    exec(command, async (error, stdout, stderr) => {
        if (!error && stdout) {
            saveScanHistory('Sublist3r', domain, 'Subdomains Found', stdout);
            return res.send({ output: stdout });
        }

        // Fallback to enhanced implementation
        console.log('Sublist3r not found, using enhanced fallback with crt.sh');
        const subdomains = new Set();

        try {
            // Use crt.sh certificate transparency logs (most reliable)
            try {
                const crtResponse = await axios.get(`https://crt.sh/?q=%.${domain}&output=json`, {
                    timeout: 15000
                });

                if (crtResponse.data && Array.isArray(crtResponse.data)) {
                    crtResponse.data.forEach(cert => {
                        if (cert.name_value) {
                            cert.name_value.split('\n').forEach(name => {
                                const cleanName = name.replace('*.', '').trim();
                                if (cleanName.endsWith(domain) && cleanName !== domain) {
                                    subdomains.add(cleanName);
                                }
                            });
                        }
                    });
                }
            } catch (e) {
                console.log('crt.sh query failed:', e.message);
            }

            // Additional sources: DNS dumpster API alternative
            const searchEngineQueries = [
                `site:*.${domain}`,
                `*.${domain}`
            ];

            for (const query of searchEngineQueries) {
                try {
                    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
                    const response = await axios.get(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                        timeout: 5000
                    });
                    const $ = cheerio.load(response.data);

                    $('a').each((i, link) => {
                        const href = $(link).attr('href');
                        if (href) {
                            const match = href.match(new RegExp(`([a-zA-Z0-9.-]+\\.${domain.replace(/\./g, '\\.')})`, 'i'));
                            if (match && match[1] !== domain) {
                                subdomains.add(match[1]);
                            }
                        }
                    });
                } catch (e) {
                    // Continue with next source
                }
            }

            const output = `\n[-] Enumerating subdomains for ${domain}\n\n` +
                `[-] Total Unique Subdomains Found: ${subdomains.size}\n\n` +
                Array.from(subdomains).sort().map(s => `    ${s}`).join('\n');

            saveScanHistory('Sublist3r', domain, `Subdomains Found: ${subdomains.size}`, output);
            res.send({ output });
        } catch (error) {
            console.error(`Error in Sublist3r: ${error.message}`);
            res.status(500).send({ error: `Failed to run Sublist3r: ${error.message}` });
        }
    });
});

// 6. Nmap Tool
app.post('/nmap', (req, res) => {
    const { target } = req.body;

    if (!target) {
        return res.status(400).send({ error: 'Target is required' });
    }

    const command = `nmap -sS -A ${target}`;
    console.log(`Received Nmap command: ${command}`);

    if (!sudoAuthenticated) {
        sudo.exec('echo "sudo password prompt"', { name: 'Nmap' }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error prompting for sudo password: ${stderr}`);
                return res.status(500).send({ error: 'Failed to authenticate with sudo' });
            }
            sudoAuthenticated = true;
            executeCommand(command, res, 'Nmap', target);
        });
    } else {
        executeCommand(command, res, 'Nmap', target);
    }
});

// 7. Zmap Tool
app.post('/zmap', (req, res) => {
    const { ip_range } = req.body;

    if (!ip_range) {
        return res.status(400).send({ error: 'IP range is required' });
    }

    const command = `zmap -p 80 ${ip_range}`;
    console.log(`Received Zmap command: ${command}`);

    if (!sudoAuthenticated) {
        sudo.exec('echo "sudo password prompt"', { name: 'Zmap' }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error prompting for sudo password: ${stderr}`);
                return res.status(500).send({ error: 'Failed to authenticate with sudo' });
            }
            sudoAuthenticated = true;
            executeCommand(command, res, 'Zmap', ip_range);
        });
    } else {
        executeCommand(command, res, 'Zmap', ip_range);
    }
});

// 8. WhatWeb Tool (Real Tool or Enhanced)
app.post('/whatweb', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.startsWith('http')) {
        return res.status(400).send({ error: 'Valid URL is required' });
    }

    // Try to execute real WhatWeb
    const command = `whatweb "${url}" --color=never`;
    exec(command, async (error, stdout, stderr) => {
        if (!error && stdout) {
            saveScanHistory('WhatWeb', url, 'Technology Detection Completed', stdout);
            return res.send({ output: stdout });
        }

        // Fallback to enhanced implementation
        console.log('WhatWeb not found, using enhanced fallback');
        const technologies = [];

        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                timeout: 10000,
                maxRedirects: 5
            });

            // Analyze headers
            const headers = response.headers;
            if (headers['server']) technologies.push({ Name: 'Server', Value: headers['server'] });
            if (headers['x-powered-by']) technologies.push({ Name: 'X-Powered-By', Value: headers['x-powered-by'] });
            if (headers['x-aspnet-version']) technologies.push({ Name: 'ASP.NET', Value: headers['x-aspnet-version'] });
            if (headers['x-drupal-cache']) technologies.push({ Name: 'CMS', Value: 'Drupal' });
            if (headers['x-generator']) technologies.push({ Name: 'Generator', Value: headers['x-generator'] });

            // Analyze HTML
            const $ = cheerio.load(response.data);
            const generator = $('meta[name="generator"]').attr('content');
            if (generator) technologies.push({ Name: 'Generator', Value: generator });

            // Framework detection
            const html = response.data.toLowerCase();
            if (html.includes('wp-content') || html.includes('wordpress')) technologies.push({ Name: 'CMS', Value: 'WordPress' });
            if (html.includes('/sites/default/') || html.includes('drupal')) technologies.push({ Name: 'CMS', Value: 'Drupal' });
            if (html.includes('joomla')) technologies.push({ Name: 'CMS', Value: 'Joomla' });
            if (html.includes('_next') || $('script[src*="_next"]').length) technologies.push({ Name: 'Framework', Value: 'Next.js' });
            if ($('div[data-reactroot]').length || $('div[data-reactid]').length) technologies.push({ Name: 'Library', Value: 'React' });
            if ($('script[src*="vue"]').length || html.includes('vue.js')) technologies.push({ Name: 'Framework', Value: 'Vue.js' });
            if ($('script[src*="angular"]').length) technologies.push({ Name: 'Framework', Value: 'Angular' });

            // JavaScript libraries
            if ($('script[src*="jquery"]').length) technologies.push({ Name: 'Library', Value: 'jQuery' });
            if ($('script[src*="bootstrap"]').length || $('link[href*="bootstrap"]').length) technologies.push({ Name: 'Framework', Value: 'Bootstrap' });

            const output = `\n[+] Technology Detection for ${url}\n\n` +
                technologies.map(t => `[+] ${t.Name}: ${t.Value}`).join('\n');

            saveScanHistory('WhatWeb', url, `Technologies Detected: ${technologies.length}`, output);
            res.send({ output: output || '[!] No technologies detected' });
        } catch (error) {
            console.error(`Error in WhatWeb: ${error.message}`);
            res.status(500).send({ error: `Failed to run WhatWeb: ${error.message}` });
        }
    });
});

// 9. Wappalyzer Tool (Enhanced Pattern Matching)
app.post('/wappalyzer', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.startsWith('http')) {
        return res.status(400).send({ error: 'Valid URL is required' });
    }

    const technologies = new Set();
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 10000
        });
        const $ = cheerio.load(response.data);
        const html = response.data;
        const headers = response.headers;

        // CMS Detection
        if (html.includes('wp-content') || html.includes('wp-includes') || html.includes('wordpress')) technologies.add('WordPress');
        if (html.includes('/sites/default/') || html.includes('Drupal.') || headers['x-drupal-cache']) technologies.add('Drupal');
        if (html.includes('joomla') || html.includes('option=com_')) technologies.add('Joomla');
        if (html.includes('Wix.com') || headers['x-wix-request-id']) technologies.add('Wix');
        if (html.includes('shopify') || headers['x-shopify-stage']) technologies.add('Shopify');
        if (html.includes('squarespace')) technologies.add('Squarespace');
        if (html.includes('magento') || html.includes('Mage.')) technologies.add('Magento');

        // Server-side
        if (headers['server']) {
            const server = headers['server'].toLowerCase();
            if (server.includes('nginx')) technologies.add('Nginx');
            if (server.includes('apache')) technologies.add('Apache');
            if (server.includes('microsoft-iis')) technologies.add('Microsoft IIS');
            if (server.includes('cloudflare')) technologies.add('Cloudflare');
        }
        if (headers['x-powered-by']) {
            const powered = headers['x-powered-by'].toLowerCase();
            if (powered.includes('php')) technologies.add('PHP');
            if (powered.includes('asp.net')) technologies.add('ASP.NET');
            if (powered.includes('express')) technologies.add('Express');
        }

        // JavaScript Frameworks
        if ($('div[data-reactroot]').length || $('div[data-reactid]').length || $('script[src*="react"]').length) technologies.add('React');
        if ($('script[src*="vue"]').length || html.includes('Vue.js')) technologies.add('Vue.js');
        if ($('script[src*="angular"]').length || html.includes('ng-app') || html.includes('ng-controller')) technologies.add('Angular');
        if ($('script[src*="_next"]').length || html.includes('__NEXT_DATA__')) technologies.add('Next.js');
        if (html.includes('nuxt') || html.includes('__NUXT__')) technologies.add('Nuxt.js');
        if ($('script[src*="svelte"]').length) technologies.add('Svelte');

        // JavaScript Libraries
        if ($('script[src*="jquery"]').length || html.includes('jQuery')) technologies.add('jQuery');
        if ($('script[src*="lodash"]').length) technologies.add('Lodash');
        if ($('script[src*="moment"]').length) technologies.add('Moment.js');

        // CSS Frameworks
        if ($('link[href*="bootstrap"]').length || html.includes('bootstrap')) technologies.add('Bootstrap');
        if ($('link[href*="tailwind"]').length || html.includes('tailwind')) technologies.add('Tailwind CSS');
        if ($('link[href*="bulma"]').length) technologies.add('Bulma');
        if (html.includes('foundation') && html.includes('zurb')) technologies.add('Foundation');

        // Analytics & Marketing
        if (html.includes('google-analytics.com') || html.includes('gtag')) technologies.add('Google Analytics');
        if (html.includes('googletagmanager.com')) technologies.add('Google Tag Manager');
        if (html.includes('hotjar')) technologies.add('Hotjar');
        if (html.includes('facebook.net/en_US/fbevents.js')) technologies.add('Facebook Pixel');

        // CDN
        if (headers['server']?.includes('cloudflare') || html.includes('cloudflare')) technologies.add('Cloudflare');
        if (html.includes('cdn.jsdelivr.net')) technologies.add('jsDelivr');
        if (html.includes('unpkg.com')) technologies.add('unpkg');

        // Web Servers & Technologies
        if (html.includes('webpack')) technologies.add('Webpack');
        if (html.includes('vite') || $('script[type="module"][src*="@vite"]').length) technologies.add('Vite');

        const output = `\nTechnologies:\n` +
            (technologies.size > 0 ? Array.from(technologies).sort().map(t => `  - ${t}`).join('\n') : '  No technologies detected');

        saveScanHistory('Wappalyzer', url, `Technologies Detected: ${technologies.size}`, output);
        res.send({ output });
    } catch (error) {
        console.error(`Error in Wappalyzer: ${error.message}`);
        res.status(500).send({ error: `Failed to run Wappalyzer: ${error.message}` });
    }
});

// 10. WPScan Tool (Real Tool or Enhanced)
app.post('/wpscan', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.startsWith('http')) {
        return res.status(400).send({ error: 'Valid URL is required' });
    }

    // Try to execute real WPScan
    const command = `wpscan --url "${url}" --no-banner --random-user-agent`;
    exec(command, async (error, stdout, stderr) => {
        if (!error && stdout) {
            saveScanHistory('WPScan', url, 'WordPress Scan Completed', stdout);
            return res.send({ output: stdout });
        }

        // Fallback to enhanced implementation
        console.log('WPScan not found, using enhanced fallback');

        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 10000
            });
            const $ = cheerio.load(response.data);

            let output = `\n[i] URL: ${url}\n`;

            // Check if it's WordPress
            if (!response.data.includes('wp-content')) {
                return res.send({ output: output + '[!] The site does not appear to be using WordPress' });
            }

            output += '[+] WordPress detected\n\n';

            // Get WordPress version
            const versionMeta = $('meta[name="generator"]').attr('content');
            if (versionMeta && versionMeta.includes('WordPress')) {
                const version = versionMeta.match(/WordPress\s+([\d.]+)/);
                if (version) output += `[+] WordPress version: ${version[1]}\n`;
            }

            // Try to get version from readme
            try {
                const readmeResponse = await axios.get(`${url}/readme.html`, { timeout: 3000 });
                const versionMatch = readmeResponse.data.match(/Version\s+([\d.]+)/);
                if (versionMatch) output += `[+] WordPress version (from readme): ${versionMatch[1]}\n`;
            } catch (e) { }

            output += '\n[+] Enumerating plugins:\n';
            const plugins = new Set();

            // Extract plugins from HTML
            $('link[href*="/wp-content/plugins/"], script[src*="/wp-content/plugins/"]').each((i, elem) => {
                const src = $(elem).attr('href') || $(elem).attr('src');
                const match = src.match(/\/wp-content\/plugins\/([^\/]+)/);
                if (match) plugins.add(match[1]);
            });

            // Try common plugin paths
            const commonPlugins = ['akismet', 'jetpack', 'contact-form-7', 'yoast-seo', 'wordfence', 'elementor'];
            for (const plugin of commonPlugins) {
                try {
                    await axios.head(`${url}/wp-content/plugins/${plugin}/`, { timeout: 2000 });
                    plugins.add(plugin);
                } catch (e) { }
            }

            if (plugins.size > 0) {
                Array.from(plugins).forEach(p => output += `  - ${p}\n`);
            } else {
                output += '  [!] No plugins found\n';
            }

            output += '\n[+] Enumerating themes:\n';
            const themes = new Set();

            $('link[href*="/wp-content/themes/"]').each((i, elem) => {
                const href = $(elem).attr('href');
                const match = href.match(/\/wp-content\/themes\/([^\/]+)/);
                if (match && match[1] !== 'twentytwentyone') themes.add(match[1]);
            });

            if (themes.size > 0) {
                Array.from(themes).forEach(t => output += `  - ${t}\n`);
            } else {
                output += '  [!] No custom themes found\n';
            }

            // Try to enumerate users via REST API
            try {
                const usersResponse = await axios.get(`${url}/wp-json/wp/v2/users`, { timeout: 3000 });
                if (usersResponse.data && Array.isArray(usersResponse.data)) {
                    output += '\n[+] Users (from REST API):\n';
                    usersResponse.data.forEach(user => {
                        output += `  - ${user.name} (ID: ${user.id}, Slug: ${user.slug})\n`;
                    });
                }
            } catch (e) {
                output += '\n[!] User enumeration via REST API failed\n';
            }

            saveScanHistory('WPScan', url, 'WordPress Scan Completed', output);
            res.send({ output });
        } catch (error) {
            console.error(`Error in WPScan: ${error.message}`);
            res.status(500).send({ error: `Failed to run WPScan: ${error.message}` });
        }
    });
});

// 11. Wafw00f Tool (Real Tool or Enhanced)
app.post('/wafw00f', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.startsWith('http')) {
        return res.status(400).send({ error: 'Valid URL is required' });
    }

    // Try to execute real Wafw00f
    const command = `wafw00f "${url}"`;
    exec(command, async (error, stdout, stderr) => {
        if (!error && stdout) {
            saveScanHistory('Wafw00f', url, 'WAF Detection Completed', stdout);
            return res.send({ output: stdout });
        }

        // Fallback to enhanced WAF detection
        console.log('Wafw00f not found, using enhanced fallback');

        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 10000,
                validateStatus: () => true // Accept all status codes
            });

            const headers = response.headers;
            const detectedWAFs = [];
            let output = `\n[*] Checking ${url}\n\n`;

            // Cloudflare
            if (headers['server']?.includes('cloudflare') ||
                headers['cf-ray'] ||
                response.data.includes('__cf_bm') ||
                response.data.includes('cloudflare')) {
                detectedWAFs.push('Cloudflare');
            }

            // Akamai
            if (headers['server']?.includes('AkamaiGHost') ||
                headers['x-akamai-transformed'] ||
                headers['akamai-origin-hop']) {
                detectedWAFs.push('Akamai');
            }

            // AWS WAF / CloudFront
            if (headers['x-amz-cf-id'] ||
                headers['x-amz-cf-pop'] ||
                headers['via']?.includes('CloudFront')) {
                detectedWAFs.push('AWS CloudFront/WAF');
            }

            // Sucuri
            if (headers['server']?.includes('Sucuri') ||
                headers['x-sucuri-id'] ||
                headers['x-sucuri-cache']) {
                detectedWAFs.push('Sucuri');
            }

            // Wordfence
            if (response.data.includes('wordfence') ||
                headers['x-wordfence-cache']) {
                detectedWAFs.push('Wordfence');
            }

            // ModSecurity
            if (headers['server']?.includes('Mod_Security') ||
                response.data.includes('ModSecurity')) {
                detectedWAFs.push('ModSecurity');
            }

            // Incapsula
            if (headers['x-cdn']?.includes('Incapsula') ||
                headers['x-iinfo'] ||
                response.data.includes('_Incapsula_Resource')) {
                detectedWAFs.push('Incapsula/Imperva');
            }

            // F5 BIG-IP
            if (headers['server']?.includes('BigIP') ||
                headers['x-wa-info']) {
                detectedWAFs.push('F5 BIG-IP');
            }

            // Barracuda
            if (headers['x-barracuda-url']) {
                detectedWAFs.push('Barracuda');
            }

            // DDoS-Guard
            if (headers['server']?.includes('ddos-guard')) {
                detectedWAFs.push('DDoS-Guard');
            }

            // StackPath
            if (headers['server']?.includes('StackPath')) {
                detectedWAFs.push('StackPath');
            }

            if (detectedWAFs.length > 0) {
                output += `[+] The site is behind a WAF:\n`;
                detectedWAFs.forEach(waf => output += `    ${waf}\n`);
            } else {
                output += `[!] No WAF detected\n`;
            }

            saveScanHistory('Wafw00f', url, 'WAF Detection Completed', output);
            res.send({ output });
        } catch (error) {
            console.error(`Error in Wafw00f: ${error.message}`);
            res.status(500).send({ error: `Failed to run Wafw00f: ${error.message}` });
        }
    });
});

// 12. Dnsmap Tool
app.post('/dnsmap', async (req, res) => {
    const { domain } = req.body;

    if (!domain) {
        return res.status(400).send({ error: 'Domain name is required' });
    }

    const subdomains = [];
    try {
        const commonSubdomains = ['www', 'mail', 'ftp', 'blog', 'dev', 'api', 'staging', 'test'];
        for (const sub of commonSubdomains) {
            try {
                const subdomain = `${sub}.${domain}`;
                await dns.resolve4(subdomain);
                subdomains.push(subdomain);
            } catch {
                continue;
            }
        }

        saveScanHistory('Dnsmap', domain, `Subdomains Found: ${subdomains.length}`, subdomains);
        res.send({ Subdomains: subdomains });
    } catch (error) {
        console.error(`Error in Dnsmap: ${error.message}`);
        res.status(500).send({ error: `Failed to run Dnsmap: ${error.message}` });
    }
});

// 13. Traceroute Tool
app.post('/traceroute', (req, res) => {
    const { target } = req.body;

    if (!target) {
        return res.status(400).send({ error: 'Target is required' });
    }

    // Use 'tracert' on Windows
    const command = `tracert -w 2 ${target}`;
    console.log(`Received Traceroute command: ${command}`);

    executeCommand(command, res, 'Traceroute', target);
});

// Network Info (Optional)
app.get('/network-info', (req, res) => {
    exec('ipconfig', (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ error: stderr });
            return;
        }

        const ipRegex = /IPv4 Address[ .:]+([\d.]+)/g;
        const ips = [];
        let match;
        while ((match = ipRegex.exec(stdout)) !== null) {
            ips.push(match[1]);
        }

        res.json({ data: ips });
    });
});

// History Routes
app.get('/history', (req, res) => {
    res.json(loadHistory());
});

app.post('/clear_history', (req, res) => {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            fs.unlinkSync(HISTORY_FILE);
            res.json({ message: 'History cleared successfully' });
        } else {
            res.json({ message: 'History was already empty' });
        }
    } catch (err) {
        res.status(500).json({ error: `Failed to clear history: ${err.message}` });
    }
});

app.delete('/delete_history_item/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const history = loadHistory();
        const updatedHistory = history.filter(item => item.id !== id);

        if (history.length === updatedHistory.length) {
            return res.status(404).json({ error: 'Item not found' });
        }

        fs.writeFileSync(HISTORY_FILE, JSON.stringify(updatedHistory, null, 4));
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: `Failed to delete item: ${err.message}` });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    openBrowser(`http://localhost:${port}`);
});