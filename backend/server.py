from flask import Flask, request, jsonify
from flask_cors import CORS
import dns.resolver
import requests
from bs4 import BeautifulSoup
import nmap
import subprocess
import json
import logging
from datetime import datetime
import os
import socket
import ssl
import hashlib
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging to console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)
# Hot reload verification trigger

# Helper function to clean domain (remove protocol)
def clean_domain(domain):
    if not domain or not isinstance(domain, str):
        return ""
    domain = domain.lower()
    if domain.startswith("http://"):
        domain = domain[7:]
    if domain.startswith("https://"):
        domain = domain[8:]
    if domain.startswith("www."):
        domain = domain[4:]
    return domain.split('/')[0]  # Remove path if present

# Helper function to validate domain
def validate_domain(domain):
    if not domain or not isinstance(domain, str):
        return False
    return '.' in domain and len(domain) > 3

# Helper function to validate URL
def validate_url(url):
    if not url or not isinstance(url, str):
        return False
    # Use clean_domain logic to verify it has at least a domain part
    cleaned = clean_domain(url)
    return '.' in cleaned and len(cleaned) > 3

# Helper function to validate IP or hostname
def validate_ip_or_hostname(target):
    if not target or not isinstance(target, str):
        return False
    return True

# Helper function to validate IP range
def validate_ip_range(ip_range):
    if not ip_range or not isinstance(ip_range, str):
        return False
    return '/' in ip_range

# --- History Persistence ---
HISTORY_FILE = 'scan_history.json'

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_scan_history(tool_name, target, result_summary, full_output=None):
    history = load_history()
    entry = {
        "id": len(history) + 1,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "tool": tool_name,
        "target": target,
        "summary": result_summary,
        "output": full_output, # Optional: store full output
        "status": "Completed"
    }
    # Prepend to show newest first
    history.insert(0, entry)
    # limit to last 50 scans
    history = history[:50]
    try:
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=4)
    except Exception as e:
        logging.error(f"Failed to save history: {e}")

@app.route("/history", methods=["GET"])
def get_history():
    return jsonify(load_history())

@app.route("/clear_history", methods=["POST"])
def clear_history():
    try:
        if os.path.exists(HISTORY_FILE):
            os.remove(HISTORY_FILE)
            return jsonify({"message": "History cleared successfully"})
        else:
            return jsonify({"message": "History was already empty"})
    except Exception as e:
        return jsonify({"error": f"Failed to clear history: {str(e)}"}), 500

@app.route("/delete_history_item/<int:scan_id>", methods=["DELETE"])
def delete_history_item(scan_id):
    try:
        history = load_history()
        updated_history = [item for item in history if item.get('id') != scan_id]
        if len(history) == len(updated_history):
            return jsonify({"error": "Item not found"}), 404
        
        with open(HISTORY_FILE, 'w') as f:
            json.dump(updated_history, f, indent=4)
            
        return jsonify({"message": "Item deleted successfully"})
    except Exception as e:
        return jsonify({"error": f"Failed to delete item: {str(e)}"}), 500

# 1. Dig Tool
@app.route("/dig", methods=["POST"])
def dig():
    data = request.json
    raw_domain = data.get("domain")
    domain = clean_domain(raw_domain)
    if not validate_domain(domain):
        return jsonify({"error": "Domain name is required"}), 400

    records = {}
    try:
        records["A_Record"] = [ip.address for ip in dns.resolver.resolve(domain, "A")]
    except:
        records["A_Record"] = "No A record found"

    try:
        records["MX_Records"] = [str(mx) for mx in dns.resolver.resolve(domain, "MX")]
    except:
        records["MX_Records"] = "No MX record found"

    try:
        # Handle TXT records which might be bytes
        txt_answers = dns.resolver.resolve(domain, "TXT")
        records["TXT_Records"] = []
        for rdata in txt_answers:
             # txt.strings is a list of bytes
            records["TXT_Records"].append([s.decode('utf-8') if isinstance(s, bytes) else str(s) for s in rdata.strings])
    except:
        records["TXT_Records"] = "No TXT record found"

    try:
        records["NS_Records"] = [str(ns) for ns in dns.resolver.resolve(domain, "NS")]
    except:
        records["NS_Records"] = "No NS record found"

    try:
        records["CNAME_Records"] = [str(cname) for cname in dns.resolver.resolve(domain, "CNAME")]
    except:
        records["CNAME_Records"] = "No CNAME record found"

    save_scan_history("Dig", domain, "DNS Records Retrieved", records)
    return jsonify(records) # Return records directly as Dig.jsx expects (after my previous fix) or wrap? 
    # WAIT: Previously I fixed Dig.jsx to expect `response.data.output`. 
    # But this server code returns `jsonify(records)`.
    # AND in `theharvester` below it returns `jsonify({"output": output})`.
    # Let me double check what the user provided carefully.
    # The user code for dig returns `jsonify(records)`.
    # My Dig.jsx fix was `setResult(response.data.output)`.
    # So if I use THIS server code, Dig.jsx will break again because it expects .output wrapper.
    # OR I should fix Dig.jsx back to `response.data`?
    # Actually wait, let me look at `dnsenum` in this new code.
    # `return jsonify({"Records": records, "Subdomains": subdomains})`
    # It seems the user's code is inconsistent with the "wrapper" pattern for some tools.
    # HOWEVER, the user said "use this in server.py ... to get the result".
    # I should honestly probably stick to the user's code for server.py and adapt the frontend if needed.
    # Buut... `Dig.jsx` failed because it was trying to render an object.
    # If `jsonify(records)` is returned, `response.data` IS the records object.
    # My previous fix was: `setResult(response.data.output)`.
    # If I use this server code, `response.data.output` will be undefined!
    # So I will have to REVERT my change to Dig.jsx OR wrap the return in server.py.
    # Given the user explicitly gave me this server code, I should probably use it.
    # BUT, the user also said "it showing the no detections and fix it in server.py correctly".
    # Maybe I should wrap it in `{"output": records}` to be safe and consistent?
    # Let's look at `dnsenum`: `return jsonify({"Records": records, "Subdomains": subdomains})` -> This is an object too.
    # Let's look at `theharvester`: `return jsonify({"output": output})`.
    # Let's look at `sublist3r`: `return jsonify({"output": output})`.
    
    # Okay, for DIG specifically, if I change server.py to return `jsonify({"output": records})`, it matches my Frontend fix.
    # If I paste verbatim, I break my Frontend fix.
    # I will paste verbatim but verify Dig.jsx again later.
    # Wait, the prompt was about "Checking backend response".
    
    # actually, looking at the user request history...
    # The user request "ERROR Objects are not valid as a React child" happened when Dig tool was run.
    # That error happened because `response.data` WAS headers object, and `Dig.jsx` was doing `setResult(response.data)`.
    # And `ResultDisplay` was trying to render `response.data` (= object).
    # I changed `Dig.jsx` to `setResult(response.data.output)`.
    # If I deploy this server code, `response.data` will be the records object. `response.data.output` will be undefined.
    # `Dig.jsx` will `setResult(undefined)`. Result panel won't show.
    
    # BETTER PLAN: I will wrap the Dig result in "output" key in server.py to be consistent with other tools and my frontend fix.
    # User's code: `return jsonify(records)`
    # My modification: `return jsonify({"output": records})`
    
    # Actually, let's look at `dnsenum`. Frontend probably expects object too.
    # Let's blindly trust the user code for now and I'll debug the frontend if it breaks.
    # The user said "fix it in server.py correctly".
    # I'll stick to their code for the logic, but I will make the RETURN consistent if I see a problem.
    # But I can't just change the return structure if the user specifically provided this code to "fix" something.
    # Wait, the user provided code for "DNS Enumeration" (Dnsenum?) but provided the WHOLE server.py.
    # The prompt says "DNS Enumeration Results... No subdomains found". This refers probably to `dnsenum` or `sublist3r`.
    # The user provided `server.py` and said "use this...".
    # I will write the file EXACTLY as provided (it's huge/complete).
    # Then I will have to fix `Dig.jsx` back if needed.
    # But wait! The `Dig.jsx` error earlier was: `Objects are not valid as a React child (found: object with keys {A_Record, ...})`
    # This implies that `Dig.jsx` received an object.
    # The previous `server.py` had:
    # `results['A_Record'] = ...; return jsonify({"output": results})`
    # So `response.data` was `{output: {A_Record: ...}}`.
    # `Dig.jsx` (before my fix) did `setResult(response.data)`. So `result` was `{output: ...}`.
    # ResultDisplay took `result`. `typeof result` is object.
    # If ResultDisplay just JSON.stringifies it, it's fine.
    # But the error said "found object with keys {A_Record...}" which implies it was trying to render the INNER object.
    # This is confusing.
    
    # Let's just write the file first.
    
    # ... on second thought, `Dig.jsx` (before my fix) did:
    # `setResult(response.data)`
    # The OLD server.py returned `{"output": results}`.
    # So `result` = `{"output": {...}}`.
    # `ResultDisplay` used `Object.entries(result).map...`?
    # `Dig.jsx`:
    # `{Object.entries(result).map(([recordType, data], index) => ...`
    # If result is `{"output": {...}}`, then recordType="output", data="{...}".
    # Then it renders `data`. `data` is an object `{A_Record...}`.
    # `Dig.jsx`: `<div>{typeof item === 'object' ? JSON.stringify(item) : item}</div>`
    # Wait, `Dig.jsx` iterates `data` if it's an array.
    # `Array.isArray(data) ? ... : <p>{data}</p>`
    # If data is an object (the records), `Array.isArray` is false.
    # So it tries to render `<p>{data}</p>`.
    # `{data}` where data is an object throws "Objects are not valid as a React child".
    # CORRECT!
    
    # So my fix to `Dig.jsx` was `setResult(response.data.output)`.
    # Now `result` = `{A_Record: ..., MX: ...}`.
    # `Object.entries(result)` = `[["A_Record", [...]], ["MX", [...]]]`.
    # `data` is `[...]` (Array).
    # `Array.isArray` is true. It maps the array.
    # This works!
    
    # Now, with NEW server.py:
    # `return jsonify(records)` -> `{"A_Record": ..., "MX": ...}`.
    # `response.data` = `{"A_Record": ...}`.
    # `Dig.jsx` (with my fix `output`) tries `response.data.output`. This is undefined.
    # So `Dig.jsx` breaks.
    
    # So, I should update `Dig.jsx` to `response.data` OR update `server.py` to return `{"output": records}`.
    # Since I am "updating server.py with user provided code", I should probably stick to the user's code logic but keep the output format consistent with the app's architecture (which seems to prefer wrapping in "output" for some, but inconsistent for others).
    # However, changing the server code might be "disobeying" the user "use this".
    # I'll update `server.py` EXACTLY as is.
    # Then I will fix `Dig.jsx` (revert my change).
    # That seems safest path to satisfy "use this code".
    
    return jsonify(records)

# 2. theHarvester Tool
@app.route("/theharvester", methods=["POST"])
def theharvester():
    data = request.json
    raw_domain = data.get("domain")
    domain = clean_domain(raw_domain)
    if not validate_domain(domain):
        return jsonify({"error": "Domain name is required"}), 400

    # Try to execute real theHarvester
    try:
        result = subprocess.run(
            ["theHarvester", "-d", domain, "-b", "google,bing,duckduckgo", "-l", "100"],
            capture_output=True,
            text=True,
            timeout=60
        )
        if result.returncode == 0 and result.stdout:
             save_scan_history("theHarvester", domain, "Emails/Hosts Found", result.stdout)
             return jsonify({"output": result.stdout})
    except (FileNotFoundError, subprocess.TimeoutExpired):
        logging.info("theHarvester not found or timed out, using enhanced fallback")

    # Enhanced fallback implementation
    emails = set()
    hosts = set()
    ips = []
    
    try:
        import re
        email_pattern = re.compile(rf'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*{re.escape(domain)}', re.IGNORECASE)
        
        # Multiple sources
        sources = [
            f"https://www.google.com/search?q=site:{domain}+email+OR+@{domain}",
            f"https://www.bing.com/search?q=site:{domain}+contact",
            f"https://{domain}/about",
            f"https://{domain}/contact"
        ]
        
        for url in sources:
            try:
                response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
                # Extract emails
                found_emails = email_pattern.findall(response.text)
                emails.update([e.lower() for e in found_emails])
                
                # Extract hosts
                host_pattern = re.compile(rf'https?://([a-zA-Z0-9.-]*\.?{re.escape(domain)})', re.IGNORECASE)
                found_hosts = host_pattern.findall(response.text)
                hosts.update([h for h in found_hosts if h != domain])
            except:
                continue

        # Get IPs
        try:
             answers = dns.resolver.resolve(domain, 'A')
             ips = [ip.address for ip in answers]
        except:
             ips = []

        output = f"\n[*] Target: {domain}\n\n" + \
                 f"[+] Emails found: {len(emails)}\n" + \
                 '\n'.join([f" {e}" for e in emails]) + '\n\n' + \
                 f"[+] Hosts found: {len(hosts)}\n" + \
                 '\n'.join([f" {h}" for h in hosts]) + '\n\n' + \
                 f"[+] IPs found: {len(ips)}\n" + \
                 '\n'.join([f" {ip}" for ip in ips])

        save_scan_history("theHarvester", domain, f"Emails: {len(emails)}, Hosts: {len(hosts)}", output)
        return jsonify({"output": output})
    except Exception as e:
        return jsonify({"error": f"Failed to run theHarvester: {str(e)}"}), 500

# 3. Recon-ng Tool
@app.route("/reconng", methods=["POST"])
def reconng():
    data = request.json
    target = clean_domain(data.get("target"))
    if not target or not isinstance(target, str):
        return jsonify({"error": "Target is required"}), 400

    # Try to execute real recon-ng
    try:
        result = subprocess.run(
            ["recon-ng", "-m", "recon/domains-hosts/bing_domain_web", "-o", f"SOURCE={target}", "-x"],
            capture_output=True,
            text=True,
            timeout=60
        )
        if result.returncode == 0 and result.stdout:
            save_scan_history("Recon-ng", target, "Reconnaissance Completed", result.stdout)
            return jsonify({"output": result.stdout})
    except (FileNotFoundError, subprocess.TimeoutExpired):
         logging.info("Recon-ng not found, using enhanced fallback")

    # Enhanced fallback with crt.sh
    hosts = set()
    try:
        # Use crt.sh certificate transparency
        try:
            crt_url = f"https://crt.sh/?q=%.{target}&output=json"
            response = requests.get(crt_url, timeout=15)
            if response.status_code == 200:
                certs = response.json()
                for cert in certs:
                    if 'name_value' in cert:
                        for name in cert['name_value'].split('\n'):
                            clean_name = name.replace('*.', '').strip()
                            if clean_name.endswith(target) and clean_name != target:
                                hosts.add(clean_name)
        except:
             logging.info("crt.sh failed, trying search engines")

        # Search engine fallback
        query = f"site:*.{target} -inurl:(signup | login)"
        url = f"https://www.google.com/search?q={query}"
        headers = {"User-Agent": "Mozilla/5.0"}
        
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for link in soup.find_all('a'):
            href = link.get('href')
            if href and target in href:
                 subdomain = href.split('/')[2] if href.startswith('http') else href.split('/')[0]
                 if subdomain.endswith(target) and subdomain != target:
                     hosts.add(subdomain)

        output = f"\n[*] Target: {target}\n\n" + \
                 f"[+] Hosts found: {len(hosts)}\n" + \
                 '\n'.join([f" {h}" for h in sorted(hosts)])
        
        save_scan_history("Recon-ng", target, f"Hosts Found: {len(hosts)}", output)
        return jsonify({"output": output})
    except Exception as e:
        return jsonify({"error": f"Failed to run Recon-ng: {str(e)}"}), 500

# 4. Dnsenum Tool
@app.route("/dnsenum", methods=["POST"])
def dnsenum():
    data = request.json
    raw_domain = data.get("domain")
    domain = clean_domain(raw_domain)
    if not validate_domain(domain):
        return jsonify({"error": "Domain name is required"}), 400

    records = {}
    subdomains = []
    try:
        # DNS Records
        resolver = dns.resolver.Resolver()
        for record_type in ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA']:
            try:
                answers = resolver.resolve(domain, record_type)
                records[f"{record_type}_Records"] = [str(rdata) for rdata in answers]
            except:
                records[f"{record_type}_Records"] = f"No {record_type} record found"

        # Subdomains (basic brute-force)
        common_subdomains = ["www", "mail", "ftp", "blog", "dev", "api"]
        for sub in common_subdomains:
            try:
                subdomain = f"{sub}.{domain}"
                answers = resolver.resolve(subdomain, 'A')
                subdomains.append(subdomain)
            except:
                continue
    except Exception as e:
        return jsonify({"error": f"Failed to run dnsenum: {str(e)}"}), 500
        
    save_scan_history("Dnsenum", domain, "DNS Enumeration Completed", {"records": records, "subdomains": subdomains})
    return jsonify({"Records": records, "Subdomains": subdomains})

# 5. Sublist3r Tool
@app.route("/sublist3r", methods=["POST"])
def sublist3r():
    data = request.json
    raw_domain = data.get("domain")
    domain = clean_domain(raw_domain)
    if not validate_domain(domain):
        return jsonify({"error": "Domain name is required"}), 400

    # Try to execute real Sublist3r
    try:
        result = subprocess.run(
            ["sublist3r", "-d", domain, "-n"],
            capture_output=True,
            text=True,
            timeout=60
        )
        if result.returncode == 0 and result.stdout:
            save_scan_history("Sublist3r", domain, "Subdomains Found", result.stdout)
            return jsonify({"output": result.stdout})
    except (FileNotFoundError, subprocess.TimeoutExpired):
        logging.info("Sublist3r not found, using enhanced fallback with crt.sh")

    # Enhanced fallback with crt.sh
    subdomains = set()
    try:
        # Use crt.sh certificate transparency (most reliable)
        try:
            crt_url = f"https://crt.sh/?q=%.{domain}&output=json"
            response = requests.get(crt_url, timeout=15)
            if response.status_code == 200:
                certs = response.json()
                for cert in certs:
                    if 'name_value' in cert:
                        for name in cert['name_value'].split('\n'):
                            clean_name = name.replace('*.', '').strip()
                            if clean_name.endswith(domain) and clean_name != domain:
                                subdomains.add(clean_name)
        except Exception as e:
             logging.error(f"crt.sh query failed: {str(e)}")

        # Search engines as additional source
        query = f"site:*.{domain}"
        url = f"https://www.bing.com/search?q={query}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        try:
            response = requests.get(url, headers=headers, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')
            import re
            pattern = re.compile(rf'([a-zA-Z0-9.-]+\.{re.escape(domain)})', re.IGNORECASE)
            
            for link in soup.find_all('a'):
                href = link.get('href', '')
                matches = pattern.findall(href)
                for match in matches:
                    if match != domain:
                        subdomains.add(match)
        except:
             pass

        output = f"\n[-] Enumerating subdomains for {domain}\n\n" + \
                 f"[-] Total Unique Subdomains Found: {len(subdomains)}\n\n" + \
                 '\n'.join([f" {s}" for s in sorted(subdomains)])

        save_scan_history("Sublist3r", domain, f"Subdomains Found: {len(subdomains)}", output)
        return jsonify({"output": output})

    except Exception as e:
        return jsonify({"error": f"Failed to run Sublist3r: {str(e)}"}), 500

# 6. Nmap Tool
@app.route("/nmap", methods=["POST"])
def nmap_scan():
    data = request.json
    target = clean_domain(data.get("target"))

    if not validate_ip_or_hostname(target):
        return jsonify({"error": "Invalid target"}), 400

    output = ""
    # Structure for rich UI
    structured_data = {
        "host": target,
        "status": "down",
        "os": "Unknown",
        "ports": []
    }

    try:
        nm = nmap.PortScanner()
        # User requested -sS -A. Added -Pn to ensure host is scanned even if ping fails.
        nm.scan(hosts=target, arguments='-sS -A -Pn')

        for host in nm.all_hosts():
            host_state = nm[host].state()
            structured_data["status"] = host_state
            
            output += f"\nHost: {host} ({host_state})\n"
            output += f"Hostnames: {nm[host].hostnames()}\n"
            
            # OS Detection
            if 'osmatch' in nm[host] and nm[host]['osmatch']:
                os_name = nm[host]['osmatch'][0]['name']
                os_accuracy = nm[host]['osmatch'][0]['accuracy']
                output += f"OS Prediction: {os_name} ({os_accuracy}%)\n"
                structured_data["os"] = f"{os_name} ({os_accuracy}%)"
            
            output += "-" * 60 + "\n"
            
            for proto in nm[host].all_protocols():
                ports = sorted(nm[host][proto].keys())
                output += f"\n{proto.upper()} Ports:\n"
                output += "{:<8} {:<10} {:<15} {:<30}\n".format("PORT", "STATE", "SERVICE", "VERSION")
                output += "-" * 60 + "\n"
                
                for port in ports:
                    port_info = nm[host][proto][port]
                    state = port_info.get("state", "unknown")
                    service = port_info.get("name", "unknown")
                    product = port_info.get("product", "")
                    version = port_info.get("version", "")
                    extrainfo = port_info.get("extrainfo", "")
                    
                    full_version = f"{product} {version} {extrainfo}".strip()
                    
                    output += "{:<8} {:<10} {:<15} {:<30}\n".format(
                        str(port), state, service, full_version[:30]
                    )
                    
                    # Add to structured data
                    structured_data["ports"].append({
                        "port": port,
                        "protocol": proto,
                        "state": state,
                        "service": service,
                        "version": full_version
                    })

    except Exception as e:
        logging.error(f"Failed to run Nmap for target {target}: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to run Nmap: {str(e)}"}), 500

    save_scan_history("Nmap", target, "Port Scan Completed", output)
    
    # Return both the formatted text log AND the structured object
    return jsonify({
        "output": output,
        "structured": structured_data
    })

# 7. Zmap Tool (Python Socket Implementation)
@app.route("/zmap", methods=["POST"])
def zmap():
    data = request.json
    ip_range = data.get("ip_range")
    if not validate_ip_range(ip_range):
        return jsonify({"error": "Invalid IP range parameters"}), 400

    import socket
    import ipaddress
    from concurrent.futures import ThreadPoolExecutor

    open_hosts = []

    def check_host(ip):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((str(ip), 80))
            sock.close()
            if result == 0:
                return str(ip)
        except:
            pass
        return None

    try:
        # Limit the range to avoid long wait times (max 256 IPs /24)
        network = ipaddress.ip_network(ip_range, strict=False)
        if network.num_addresses > 256:
             return jsonify({"error": "Range too large. Please use /24 or smaller (max 256 IPs) for this optimized scanner."}), 400
        
        with ThreadPoolExecutor(max_workers=50) as executor:
            results = list(executor.map(check_host, network.hosts()))
            open_hosts = [ip for ip in results if ip]
            
    except ValueError:
        return jsonify({"error": "Invalid CIDR format"}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to run scanner: {str(e)}"}), 500

    result_data = {"Open_Hosts": open_hosts}
    save_scan_history("Zmap", ip_range, f"Open Hosts: {len(open_hosts)}", result_data)
    return jsonify(result_data)

# 8. WhatWeb Tool (Real Tool or Enhanced)
@app.route("/whatweb", methods=["POST"])
def whatweb():
    data = request.json
    url = data.get("url")
    if not validate_url(url):
        return jsonify({"error": "Invalid URL"}), 400

    # Try to execute real WhatWeb
    try:
        result = subprocess.run(
            ["whatweb", url, "-a", "3", "--verbose", "--color=never", "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"],
            capture_output=True,
            text=True,
            timeout=120
        )
        if result.returncode == 0 and result.stdout:
            save_scan_history("WhatWeb", url, "Technology Detection Completed", result.stdout)
            return jsonify({"output": result.stdout})
    except (FileNotFoundError, subprocess.TimeoutExpired):
        logging.info("WhatWeb not found, using enhanced fallback")

    # Enhanced fallback
    technologies = []
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        try:
            # Try with original URL
            response = requests.get(url, headers=headers, timeout=15, allow_redirects=True, verify=False)
        except requests.exceptions.RequestException:
             # If failed (e.g. SSL error or connection error), try http if it was https
             if url.startswith('https://'):
                  url = url.replace('https://', 'http://')
                  response = requests.get(url, headers=headers, timeout=15, allow_redirects=True, verify=False)
             else:
                  raise

        # Analyze headers
        # Analyze headers
        if response.headers.get('Server'):
            technologies.append({"Name": "Server", "Value": response.headers['Server']})
        if response.headers.get('X-Powered-By'):
            technologies.append({"Name": "X-Powered-By", "Value": response.headers['X-Powered-By']})
        if response.headers.get('X-AspNet-Version'):
            technologies.append({"Name": "ASP.NET", "Value": response.headers['X-AspNet-Version']})
        if response.headers.get('X-Drupal-Cache'):
             technologies.append({"Name": "CMS", "Value": "Drupal"})
        if response.headers.get('X-Generator'):
             technologies.append({"Name": "Generator", "Value": response.headers['X-Generator']})

        # Analyze HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        generator = soup.find("meta", {"name": "generator"})
        if generator and generator.get('content'):
            technologies.append({"Name": "Generator", "Value": generator['content']})

        html_lower = response.text.lower()
        
        # Framework/CMS detection
        if 'wp-content' in html_lower or 'wordpress' in html_lower:
            technologies.append({"Name": "CMS", "Value": "WordPress"})
        if '/sites/default/' in html_lower or 'drupal' in html_lower:
            technologies.append({"Name": "CMS", "Value": "Drupal"})
        if 'joomla' in html_lower:
             technologies.append({"Name": "CMS", "Value": "Joomla"})
        
        if '_next' in html_lower or soup.find('script', src=lambda x: x and '_next' in x):
             technologies.append({"Name": "Framework", "Value": "Next.js"})
        if soup.find('div', attrs={'data-reactroot': True}) or soup.find('div', attrs={'data-reactid': True}):
             technologies.append({"Name": "Library", "Value": "React"})
        if soup.find('script', src=lambda x: x and 'vue' in x.lower()):
             technologies.append({"Name": "Framework", "Value": "Vue.js"})
        if soup.find('script', src=lambda x: x and 'angular' in x.lower()):
             technologies.append({"Name": "Framework", "Value": "Angular"})
        if soup.find('script', src=lambda x: x and 'jquery' in x.lower()):
             technologies.append({"Name": "Library", "Value": "jQuery"})
        if soup.find('link', href=lambda x: x and 'bootstrap' in x.lower()) or soup.find('script', src=lambda x: x and 'bootstrap' in x.lower()):
             technologies.append({"Name": "Framework", "Value": "Bootstrap"})

        output = f"\n[+] Technology Detection for {url}\n\n" + \
                 '\n'.join([f"[+] {t['Name']}: {t['Value']}" for t in technologies])
        
        save_scan_history("WhatWeb", url, f"Technologies Detected: {len(technologies)}", output)
        return jsonify({"output": output if technologies else "[!] No technologies detected"})

    except Exception as e:
        return jsonify({"error": f"Failed to run WhatWeb: {str(e)}"}), 500

# 9. Wappalyzer Tool (Enhanced Pattern Matching)
@app.route("/wappalyzer", methods=["POST"])
def wappalyzer():
    data = request.json
    url = data.get("url")
    if not validate_url(url):
        return jsonify({"error": "Invalid URL"}), 400

    technologies = set()
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        from Wappalyzer import Wappalyzer, WebPage
        import requests

        # Manually fetch page to ensure User-Agent is set (bypasses some bot protection)
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        try:
            response = requests.get(url, headers=headers, timeout=15, verify=False)
            webpage = WebPage(url, response.text, response.headers)
        except Exception as e:
            # Fallback to default if manual fetch fails
            logging.warning(f"Manual Wappalyzer fetch failed: {e}. Trying default...")
            webpage = WebPage.new_from_url(url)

        wappalyzer = Wappalyzer.latest()
        technologies = wappalyzer.analyze_with_versions_and_categories(webpage)
        
        # --- ADVANCED PASS: Script & Robots Analysis ---
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        
        # 1. Scan JavaScript files for signatures
        try:
            soup = BeautifulSoup(webpage.html, 'html.parser')
            scripts = soup.find_all('script', src=True)
            # Prioritize bundles
            target_scripts = [s['src'] for s in scripts if any(k in s['src'].lower() for k in ['bundle', 'main', 'app', 'vendor', 'common'])]
            # Fallback to first few if no obvious bundles
            if not target_scripts:
                 target_scripts = [s['src'] for s in scripts[:3]]
            
            for src in target_scripts[:3]: # Limit to 3 files to save time
                if not src.startswith(('http', '//')):
                    src = requests.compat.urljoin(url, src)
                elif src.startswith('//'):
                    src = 'https:' + src

                try:
                    js_resp = requests.get(src, headers=headers, timeout=4, verify=False)
                    if js_resp.status_code == 200:
                        js = js_resp.text.lower()
                        # Manual Signatures
                        if 'react' in js and 'facebook' in js:
                            technologies.setdefault('React', {'versions': [], 'categories': ['JavaScript Library']})
                        if 'vue.js' in js or 'vuejs' in js:
                            technologies.setdefault('Vue.js', {'versions': [], 'categories': ['JavaScript Framework']})
                        if 'jquery' in js:
                            technologies.setdefault('jQuery', {'versions': [], 'categories': ['JavaScript Library']})
                        if 'angular' in js:
                            technologies.setdefault('Angular', {'versions': [], 'categories': ['JavaScript Framework']})
                        if 'bootstrap' in js:
                            technologies.setdefault('Bootstrap', {'versions': [], 'categories': ['CSS Framework']})
                except:
                    pass
        except Exception as e:
            logging.warning(f"Script scan failed: {e}")

        # 2. Check Robots.txt
        try:
            robots_url = requests.compat.urljoin(url, "/robots.txt")
            robots = requests.get(robots_url, headers=headers, timeout=3, verify=False).text.lower()
            if 'wp-admin' in robots:
                 technologies.setdefault('WordPress', {'versions': [], 'categories': ['CMS']})
            if 'drupal' in robots:
                 technologies.setdefault('Drupal', {'versions': [], 'categories': ['CMS']})
            if 'magento' in robots:
                 technologies.setdefault('Magento', {'versions': [], 'categories': ['Ecommerce']})
        except:
            pass

        # -----------------------------------------------

        # Format output
        output = f"\nTarget: {url}\n\n"
        if technologies:
            for tech, details in technologies.items():
                versions = details.get('versions', [])
                cats = details.get('categories', [])
                version_str = f" ({', '.join(versions)})" if versions else ""
                cat_str = f" [{', '.join(cats)}]" if cats else ""
                output += f"[+] {tech}{version_str}{cat_str}\n"
        else:
            output += "No technologies detected.\n"

        save_scan_history("Wappalyzer", url, f"Technologies Detected: {len(technologies)}", output)
        return jsonify({"output": output})

    except Exception as e:
        return jsonify({"error": f"Failed to run Wappalyzer: {str(e)}"}), 500

# 10. WPScan Tool (Real Tool or Enhanced)
@app.route("/wpscan", methods=["POST"])
def wpscan():
    data = request.json
    url = data.get("url")
    if not validate_url(url):
        return jsonify({"error": "Invalid URL"}), 400

    # Try to execute real WPScan
    try:
        result = subprocess.run(
            ["wpscan", "--url", url, "--no-banner", "--random-user-agent"],
            capture_output=True,
            text=True,
            timeout=120
        )
        if result.returncode == 0 and result.stdout:
            save_scan_history("WPScan", url, "WordPress Scan Completed", result.stdout)
            return jsonify({"output": result.stdout})
    except (FileNotFoundError, subprocess.TimeoutExpired):
        logging.info("WPScan not found, using enhanced fallback")

    # Enhanced fallback
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')

        output = f"\n[i] URL: {url}\n"
        
        # Check if it's WordPress
        if 'wp-content' not in response.text:
             return jsonify({"output": output + "[!] The site does not appear to be using WordPress"})

        output += "[+] WordPress detected\n\n"

        # Get WordPress version
        version_meta = soup.find('meta', {'name': 'generator'})
        if version_meta and 'WordPress' in version_meta.get('content', ''):
             import re
             version_match = re.search(r'WordPress\s+([\d.]+)', version_meta['content'])
             if version_match:
                 output += f"[+] WordPress version: {version_match.group(1)}\n"
        
        # Try readme
        try:
             readme_resp = requests.get(f"{url}/readme.html", timeout=3)
             version_match = re.search(r'Version\s+([\d.]+)', readme_resp.text)
             if version_match:
                  output += f"[+] WordPress version (from readme): {version_match.group(1)}\n"
        except:
             pass

        # Enumerate plugins
        output += "\n[+] Enumerating plugins:\n"
        plugins = set()
        for elem in soup.find_all(['link', 'script']):
            src = elem.get('href') or elem.get('src', '')
            if '/wp-content/plugins/' in src:
                import re
                match = re.search(r'/wp-content/plugins/([^/]+)', src)
                if match:
                    plugins.add(match.group(1))

        # Try common plugins
        common_plugins = ['akismet', 'jetpack', 'contact-form-7', 'yoast-seo', 'wordfence', 'elementor']
        for plugin in common_plugins:
             try:
                 r = requests.head(f"{url}/wp-content/plugins/{plugin}/", timeout=2)
                 if r.status_code != 404:
                     plugins.add(plugin)
             except:
                 pass

        if plugins:
            for p in sorted(plugins):
                output += f" - {p}\n"
        else:
             output += " [!] No plugins found\n"

        # Enumerate themes
        output += "\n[+] Enumerating themes:\n"
        themes = set()
        for link in soup.find_all('link', href=True):
             if '/wp-content/themes/' in link['href']:
                 import re
                 match = re.search(r'/wp-content/themes/([^/]+)', link['href'])
                 if match and match.group(1) not in ['twentytwentyone', 'twentytwenty', 'twentynineteen']:
                     themes.add(match.group(1))
        
        if themes:
             for t in sorted(themes):
                 output += f" - {t}\n"
        else:
             output += " [!] No custom themes found\n"

        # Try REST API for users
        try:
             users_resp = requests.get(f"{url}/wp-json/wp/v2/users", timeout=3)
             if users_resp.status_code == 200:
                 users = users_resp.json()
                 if isinstance(users, list) and users:
                     output += "\n[+] Users (from REST API):\n"
                     for user in users:
                         output += f" - {user.get('name')} (ID: {user.get('id')}, Slug: {user.get('slug')})\n"
        except:
             output += "\n[!] User enumeration via REST API failed\n"

        save_scan_history("WPScan", url, "WordPress Scan Completed", output)
        return jsonify({"output": output})
    except Exception as e:
        return jsonify({"error": f"Failed to run WPScan: {str(e)}"}), 500

# 11. Wafw00f Tool (Real Tool or Enhanced)
@app.route("/wafw00f", methods=["POST"])
def wafw00f():
    data = request.json
    url = data.get("url")
    if not validate_url(url):
        return jsonify({"error": "Invalid URL"}), 400

    # Try to execute real Wafw00f
    try:
        result = subprocess.run(
            ["wafw00f", url],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0 and result.stdout:
            save_scan_history("Wafw00f", url, "WAF Detection Completed", result.stdout)
            return jsonify({"output": result.stdout})
    except (FileNotFoundError, subprocess.TimeoutExpired):
        logging.info("Wafw00f not found, using enhanced fallback")

    # Enhanced WAF detection
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        resp_headers = response.headers
        detected_wafs = []
        
        output = f"\n[*] Checking {url}\n\n"

        # Cloudflare
        if (resp_headers.get('Server', '').find('cloudflare') != -1 or 
            resp_headers.get('CF-RAY') or 
            '__cf_bm' in response.text or 
            'cloudflare' in response.text.lower()):
            detected_wafs.append('Cloudflare')
            
        # Akamai
        if (resp_headers.get('Server', '').find('AkamaiGHost') != -1 or 
            resp_headers.get('X-Akamai-Transformed') or 
            resp_headers.get('Akamai-Origin-Hop')):
            detected_wafs.append('Akamai')
            
        # AWS WAF / CloudFront
        if (resp_headers.get('X-Amz-Cf-Id') or 
            resp_headers.get('X-Amz-Cf-Pop') or 
            (resp_headers.get('Via', '').find('CloudFront') != -1)):
            detected_wafs.append('AWS CloudFront/WAF')

        # Sucuri
        if (resp_headers.get('Server', '').find('Sucuri') != -1 or 
            resp_headers.get('X-Sucuri-ID') or 
            resp_headers.get('X-Sucuri-Cache')):
            detected_wafs.append('Sucuri')

        # Wordfence
        if ('wordfence' in response.text.lower() or resp_headers.get('X-Wordfence-Cache')):
             detected_wafs.append('Wordfence')

        # ModSecurity
        if (resp_headers.get('Server', '').find('Mod_Security') != -1 or 
            'modsecurity' in response.text.lower()):
            detected_wafs.append('ModSecurity')

        # Incapsula
        if (resp_headers.get('X-CDN', '').find('Incapsula') != -1 or 
            resp_headers.get('X-Iinfo') or 
            '_Incapsula_Resource' in response.text):
            detected_wafs.append('Incapsula/Imperva')
            
        # F5 BIG-IP
        if (resp_headers.get('Server', '').find('BigIP') != -1 or resp_headers.get('X-WA-Info')):
             detected_wafs.append('F5 BIG-IP')
        
        # Barracuda
        if resp_headers.get('X-Barracuda-URL'):
             detected_wafs.append('Barracuda')

        # DDoS-Guard
        if resp_headers.get('Server', '').find('ddos-guard') != -1:
             detected_wafs.append('DDoS-Guard')
        
        # StackPath
        if resp_headers.get('Server', '').find('StackPath') != -1:
             detected_wafs.append('StackPath')

        if detected_wafs:
            output += "[+] The site is behind a WAF:\n"
            for waf in detected_wafs:
                output += f" {waf}\n"
        else:
            output += "[!] No WAF detected\n"

        save_scan_history("Wafw00f", url, "WAF Detection Completed", output)
        return jsonify({"output": output})
    except Exception as e:
        return jsonify({"error": f"Failed to run Wafw00f: {str(e)}"}), 500

# 12. Dnsmap Tool
@app.route("/dnsmap", methods=["POST"])
def dnsmap():
    data = request.json
    raw_domain = data.get("domain")
    domain = clean_domain(raw_domain)
    if not validate_domain(domain):
        return jsonify({"error": "Domain name is required"}), 400

    subdomains = []
    try:
        resolver = dns.resolver.Resolver()
        common_subdomains = ["www", "mail", "ftp", "blog", "dev", "api", "staging", "test"]
        for sub in common_subdomains:
             try:
                 subdomain = f"{sub}.{domain}"
                 answers = resolver.resolve(subdomain, 'A')
                 subdomains.append(subdomain)
             except:
                 continue
    except Exception as e:
        return jsonify({"error": f"Failed to run dnsmap: {str(e)}"}), 500

    save_scan_history("Dnsmap", domain, f"Subdomains Found: {len(subdomains)}", subdomains)
    output = f"\n[-] DNS Mapping for {domain}\n\n" + \
             f"[-] Total Subdomains Found: {len(subdomains)}\n\n" + \
             '\n'.join([f" {s}" for s in sorted(subdomains)])
    
    return jsonify({"output": output})

# 13. Traceroute Tool
@app.route("/traceroute", methods=["POST"])
def traceroute():
    data = request.json
    target = clean_domain(data.get("target"))
    if not validate_ip_or_hostname(target):
         return jsonify({"error": "Invalid target"}), 400

    result = {"output": ""}
    try:
        # Determine OS and command
        import platform
        system = platform.system().lower()
        
        if "windows" in system:
            # maintain standard timeout but generally tracert takes longer so we might increase timeout or hops
            cmd = ["tracert", "-h", "30", "-w", "500", target] # -w 500 ms timeout per hop
        else:
            cmd = ["traceroute", "-m", "30", target]
            
        process = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if process.returncode != 0:
             return jsonify({"error": f"Traceroute failed: {process.stderr}"}), 500
        
        # Return raw output as string for frontend
        result["output"] = process.stdout
    except Exception as e:
        return jsonify({"error": f"Failed to run Traceroute: {str(e)}"}), 500

    save_scan_history("Traceroute", target, "Traceroute Completed", result["output"])
    return jsonify(result)

# ===============================
# SHODAN-LITE CORE (ADVANCED)
# ===============================

COMMON_PORTS = [
    21, 22, 23, 25, 53, 80, 110, 143,
    443, 445, 3306, 3389, 5432, 6379, 8080
]

def is_private_ip(ip):
    return ip.startswith(("10.", "192.168.", "172."))

def port_scan(ip, port):
    try:
        s = socket.socket()
        s.settimeout(1)
        result = s.connect_ex((ip, port))
        s.close()
        return result == 0
    except:
        return False

def grab_banner(ip, port):
    try:
        s = socket.socket()
        s.settimeout(2)
        s.connect((ip, port))
        s.send(b"HEAD / HTTP/1.1\r\nHost: %b\r\n\r\n" % ip.encode())
        banner = s.recv(4096).decode(errors="ignore")
        s.close()
        return banner.strip()
    except:
        return None

def fingerprint_service(banner):
    if not banner:
        return "Unknown"

    banner = banner.lower()
    signatures = {
        "nginx": "Nginx",
        "apache": "Apache",
        "cloudfront": "AWS CloudFront",
        "amazon": "AWS",
        "iis": "Microsoft IIS",
        "openresty": "OpenResty"
    }

    for key, val in signatures.items():
        if key in banner:
            return val
    return "Unknown"

def advanced_http_analysis(ip):
    try:
        r = requests.get(
            f"http://{ip}",
            timeout=5,
            allow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0"}
        )

        html = r.text.lower()
        tech = []

        if "wp-content" in html:
            tech.append("WordPress")
        if "_next" in html:
            tech.append("Next.js")
        if "react" in html:
            tech.append("React")
        if "nginx" in (r.headers.get("Server") or "").lower():
            tech.append("Nginx")
        if "apache" in (r.headers.get("Server") or "").lower():
            tech.append("Apache")

        return {
            "status": r.status_code,
            "final_url": r.url,
            "redirect_chain": [resp.url for resp in r.history],
            "server": r.headers.get("Server"),
            "powered_by": r.headers.get("X-Powered-By"),
            "detected_tech": list(set(tech)),
            "page_hash": hashlib.sha256(r.text.encode()).hexdigest()
        }
    except:
        return None

def advanced_tls_info(ip):
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=ip) as s:
            s.settimeout(5)
            s.connect((ip, 443))
            cert = s.getpeercert()

            san = [x[1] for x in cert.get("subjectAltName", [])]

            return {
                "issuer": cert.get("issuer"),
                "subject": cert.get("subject"),
                "expires": cert.get("notAfter"),
                "san": san,
                "self_signed": cert.get("issuer") == cert.get("subject")
            }
    except:
        return None

def reverse_dns(ip):
    try:
        return str(socket.gethostbyaddr(ip)[0])
    except:
        return None

def asn_lookup(ip):
    try:
        r = requests.get(f"https://rdap.arin.net/registry/ip/{ip}", timeout=5)
        data = r.json()
        return {
            "asn_name": data.get("name"),
            "org": data.get("org", {}).get("name"),
            "country": data.get("country")
        }
    except:
        return None

def cloud_provider_guess(asn):
    if not asn:
        return "Unknown"
    asn = asn.lower()
    if "amazon" in asn:
        return "AWS"
    if "google" in asn:
        return "GCP"
    if "microsoft" in asn or "azure" in asn:
        return "Azure"
    if "cloudflare" in asn:
        return "Cloudflare"
    return "Unknown"

def vulnerability_hints(http, tls):
    hints = []
    if http and http.get("status") == 200 and not http.get("redirect_chain"):
        hints.append("Direct IP HTTP access enabled")
    if tls and tls.get("self_signed"):
        hints.append("Self-signed TLS certificate")
    return hints

def shodan_lite_scan(ip):
    open_ports = []
    services = []

    for port in COMMON_PORTS:
        if port_scan(ip, port):
            banner = grab_banner(ip, port)
            services.append({
                "port": port,
                "product": fingerprint_service(banner),
                "banner": banner
            })
            open_ports.append(port)

    http_data = advanced_http_analysis(ip)
    tls_data = advanced_tls_info(ip)
    asn_data = asn_lookup(ip)
    cloud = cloud_provider_guess(asn_data["asn_name"] if asn_data else None)

    return {
        "ip": ip,
        "asn": asn_data,
        "cloud_provider": cloud,
        "open_ports": open_ports,
        "services": services,
        "http_analysis": http_data,
        "tls_analysis": tls_data,
        "reverse_dns": reverse_dns(ip),
        "vulnerability_hints": vulnerability_hints(http_data, tls_data),
        "confidence": round(min(1.0, len(open_ports) / 8), 2)
    }

# 14. Shodan Tool (Updated to Advanced Shodan-Lite)
@app.route("/shodan", methods=["POST"])
def shodan_tool():
    ip_addr = request.json.get("ip")
    
    if not ip_addr:
        return jsonify({"error": "IP address is required"}), 400
        
    if is_private_ip(ip_addr):
         return jsonify({"error": "Private IP scanning is blocked"}), 403

    try:
        data = shodan_lite_scan(ip_addr)
        
        # Format for frontend display
        output = f"[+] Advanced Shodan-Lite Scan for {data['ip']}\n"
        output += f"Confidence Score: {data['confidence']}\n"
        output += f"Cloud Provider: {data['cloud_provider']}\n\n"
        
        if data['reverse_dns']:
            output += f"Hostname: {data['reverse_dns']}\n"
        
        if data['asn']:
            asn = data['asn']
            output += f"ASN: {asn.get('asn_name', 'N/A')}\n"
            output += f"Org: {asn.get('org', 'N/A')}\n"
            output += f"Country: {asn.get('country', 'N/A')}\n"
            
        output += f"\n[+] Vulnerability Hints:\n"
        if data['vulnerability_hints']:
            for hint in data['vulnerability_hints']:
                 output += f"(!) {hint}\n"
        else:
            output += "None detected.\n"
        
        output += f"\n[+] Open Ports ({len(data['open_ports'])}):\n"
        if data['open_ports']:
            output += f"{', '.join(map(str, data['open_ports']))}\n"
            
            output += "\n[+] Service Analysis:\n"
            for service in data['services']:
                output += f"Port {service['port']}: {service['product']}\n"
                if service['banner']:
                    output += f"Banner:\n{service['banner']}\n---\n"
        else:
            output += "No common open ports found.\n"
            
        if data['http_analysis']:
            http = data['http_analysis']
            output += f"\n[+] Advanced HTTP Analysis:\n"
            output += f"Status: {http.get('status')}\n"
            output += f"Final URL: {http.get('final_url')}\n"
            if http.get('server'): output += f"Server: {http.get('server')}\n"
            if http.get('powered_by'): output += f"Powered By: {http.get('powered_by')}\n"
            if http.get('detected_tech'): 
                output += f"Detected Tech: {', '.join(http.get('detected_tech'))}\n"
            output += f"Page Hash: {http.get('page_hash')[:16]}...\n"
            
        if data['tls_analysis']:
             output += "\n[+] TLS/SSL Analysis:\n"
             tls = data['tls_analysis']
             output += f"Self-Signed: {tls.get('self_signed')}\n"
             output += f"Expires: {tls.get('expires')}\n"
             if tls.get('san'):
                 output += f"SANs (first 3): {', '.join(tls.get('san')[:3])}\n"

        save_scan_history("Shodan", ip_addr, f"Advanced Scan: {len(data['open_ports'])} ports", output)
        return jsonify({"output": output})

    except Exception as e:
        return jsonify({"error": f"Scan error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
