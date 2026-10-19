// Version locale de Krosmofus pour les tests : sert la page avec clear.js (non brouillé) sur http://localhost
// et relaie /api et /ws vers le vrai serveur. Aucune dépendance à installer.
// Utilisation : node dev/serveur-local.js   puis ouvrir http://localhost:8080
// clear.js et la page sont relus à chaque modification : il suffit de recharger la page (Ctrl + F5).
// En ligne (Render, ou EN_LIGNE=1) : écoute sur toutes les interfaces, garde les protections du jeu
// (F12, clic droit) et n'affiche pas le badge LOCAL.
const http = require('http');
const https = require('https');
const tls = require('tls');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SERVEUR = process.env.SERVEUR || 'krosmofus-tcg.com';
const PORT = +process.env.PORT || 8080;
const EN_LIGNE = !!process.env.RENDER || process.env.EN_LIGNE === '1';
const RACINE = path.join(__dirname, '..');
const PAGE = path.join(RACINE, 'Krosmofus TCG - Les Songes Infinis.html');
const JEU = path.join(RACINE, process.argv[2] || 'clear.js');

// Fichier relu seulement quand il a changé sur le disque ; garde aussi sa version gzip et son ETag
// (clear.js pèse 13 Mo : compressé et mis en cache par le navigateur, il ne repasse pas à chaque visite)
function enCache(fichier, transformer) {
    let mtime = 0, valeur = null;
    return () => {
        const m = fs.statSync(fichier).mtimeMs;
        if (m !== mtime) {
            const texte = transformer(fs.readFileSync(fichier, 'utf8'));
            valeur = { texte, gzip: zlib.gzipSync(texte), etag: `"${Math.round(m).toString(36)}"` };
            mtime = m;
        }
        return valeur;
    };
}

// Page enregistrée depuis le navigateur : on retire les scripts du jeu (version brouillée + version décodée
// injectée par le décodeur) et on charge /jeu.js à la place
const page = enCache(PAGE, html => {
    let place = false;
    html = html.replace(/<script>[\s\S]*?<\/script>/g, () => {
        if (place) return '';
        place = true;
        return '<script src="/jeu.js"></script>';
    });
    if (!place) throw new Error('Aucun script du jeu trouvé dans la page');
    return html.replace(/<!-- saved from url=[^>]*-->\s*/, '');
});

// Adaptations de clear.js pour tourner sur http://localhost (le fichier d'origine n'est pas modifié)
const ADAPTATIONS = [
    // le jeu n'active le réseau qu'en https : localhost compte comme le site en ligne
    [/location\.protocol !== 'https:'/g, "(location.protocol !== 'https:' && location.hostname !== 'localhost')"],
    [/location\.protocol === 'https:'/g, "(location.protocol === 'https:' || location.hostname === 'localhost')"],
    [/`wss:\/\/\$\{location\.host\}`/g, "`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`"],
];
// outils de développement autorisés en local seulement : pas de blocage de F12, du clic droit ni de la partie
if (!EN_LIGNE) ADAPTATIONS.push(
    [/(document\.addEventListener\('keydown', e => \{\s*)if \(isFounder\(\)\) return;/, '$1return;'],
    [/if \(!isFounder\(\) && !\/\^\(INPUT\|TEXTAREA\)\$\/\.test/, 'if (false && !/^(INPUT|TEXTAREA)$/.test'],
    [/^;\(function\(\)\{function lock\(\)\{.*$/m, ''],
);
const BADGE = `
;(function(){var d=document.createElement('div');d.textContent='LOCAL → ${SERVEUR}';d.title='Version locale (${path.basename(JEU)}) connectée au vrai serveur';
d.style.cssText='position:fixed;left:8px;bottom:8px;z-index:2147483647;padding:4px 8px;border-radius:6px;background:#c53030;color:#fff;font:700 12px sans-serif;pointer-events:none;opacity:.85';
(document.body||document.documentElement).appendChild(d);})();
`;
const jeu = enCache(JEU, code => {
    for (const [motif, remplacement] of ADAPTATIONS) {
        const avant = code;
        code = code.replace(motif, remplacement);
        if (code === avant) console.warn(`Attention : adaptation non appliquée (${motif}) — clear.js a peut-être changé`);
    }
    return EN_LIGNE ? code : code + BADGE;
});

// Relais HTTP vers le vrai serveur (Host et Origin réécrits pour qu'il accepte la requête)
function enTetesDistants(req) {
    const h = { ...req.headers, host: SERVEUR };
    if (h.origin) h.origin = `https://${SERVEUR}`;
    if (h.referer) h.referer = `https://${SERVEUR}/`;
    delete h['accept-encoding'];
    return h;
}
function relayer(req, res) {
    const distant = https.request({ host: SERVEUR, port: 443, path: req.url, method: req.method, headers: enTetesDistants(req) }, r => {
        res.writeHead(r.statusCode, r.headers);
        r.pipe(res);
    });
    distant.on('error', e => { res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Serveur injoignable : ' + e.message); });
    req.pipe(distant);
}

// Transfert de session : la connexion Discord ne revient que sur le vrai site (seule adresse déclarée chez Discord).
// On se connecte donc là-bas, un favori copie les données du jeu, et cette page les recopie sur localhost.
// Les signatures des données ne dépendent pas de l'adresse du site : elles restent valides.
const favori = adresse => `javascript:(function(){var o={};Object.keys(localStorage).forEach(function(k){if(/^(krosmofus_|krz_)/.test(k)&&k!=='krosmofus_tab')o[k]=localStorage.getItem(k);});var t=document.createElement('textarea');t.value=JSON.stringify(o);document.body.appendChild(t);t.select();var ok=document.execCommand('copy');t.remove();alert(ok?'Session Krosmofus copi\\u00e9e ('+Object.keys(o).length+' donn\\u00e9es). Colle-la sur ${adresse}/transfert':'Copie impossible');})();`;
const pageTransfert = adresse => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Transfert de session</title><style>
body{font:15px/1.5 system-ui,sans-serif;max-width:720px;margin:32px auto;padding:0 16px;background:#17121f;color:#eee}
a.favori{display:inline-block;padding:8px 14px;background:#5865f2;color:#fff;border-radius:6px;text-decoration:none;font-weight:700}
textarea{width:100%;height:140px;background:#0d0a14;color:#eee;border:1px solid #444;border-radius:6px}
button{padding:8px 16px;font-weight:700;border:0;border-radius:6px;background:#48bb78;color:#fff;cursor:pointer}
#msg{margin-top:10px;font-weight:700}</style></head><body>
<h1>Se connecter en local avec Discord</h1>
<ol>
<li>Glisse ce bouton dans ta barre de favoris : <a class="favori" href="${favori(adresse).replace(/"/g, '&quot;')}">Copier session Krosmofus</a>
<br>Si tu n'y arrives pas : <button type="button" id="cf" style="background:#5865f2">Copier le code du favori</button>
puis Ctrl + Maj + O (gestionnaire de favoris) → <i>Ajouter un favori</i> : nom « Copier session Krosmofus », adresse : colle le code (Ctrl + V).
<span id="cfm" style="color:#48bb78"></span></li>
<li>Va sur <a href="https://${SERVEUR}/" target="_blank" style="color:#9ab">https://${SERVEUR}/</a> et connecte-toi avec Discord.</li>
<li>Toujours sur ce site, clique sur le favori : la session est copiée. Puis <b>ferme l'onglet du vrai site</b> (sinon « Partie ouverte ailleurs »).</li>
<li>Colle ici (Ctrl + V) et clique sur Importer.</li>
</ol>
<textarea id="t" placeholder="Colle la session ici"></textarea>
<p><button id="b">Importer et ouvrir le jeu</button></p><div id="msg"></div>
<script>
document.getElementById('cf').onclick = function () {
    var t = document.createElement('textarea'); t.value = document.querySelector('a.favori').getAttribute('href');
    document.body.appendChild(t); t.select(); var ok = document.execCommand('copy'); t.remove();
    document.getElementById('cfm').textContent = ok ? ' Code copié !' : ' Copie impossible';
};
document.getElementById('b').onclick = function () {
    var m = document.getElementById('msg');
    try {
        var o = JSON.parse(document.getElementById('t').value), n = 0;
        if (!o || !o.krosmofus_profiles) throw new Error('aucun compte dans ce texte');
        Object.keys(o).forEach(function (k) { if (/^(krosmofus_|krz_)/.test(k) && k !== 'krosmofus_tab') { localStorage.setItem(k, o[k]); n++; } });
        m.textContent = n + ' données importées, ouverture du jeu…'; m.style.color = '#48bb78';
        setTimeout(function () { location.href = '/'; }, 800);
    } catch (e) { m.textContent = 'Texte invalide : ' + e.message; m.style.color = '#f56565'; }
};
</script></body></html>`;

function envoyer(res, type, contenu) {
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(contenu);
}
// Contenu en cache : 304 si le navigateur l'a déjà, sinon gzip quand il l'accepte
function envoyerCache(req, res, type, { texte, gzip, etag }) {
    const h = { 'Content-Type': type, 'Cache-Control': 'no-cache', 'ETag': etag, 'Vary': 'Accept-Encoding' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
    if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) { h['Content-Encoding'] = 'gzip'; res.writeHead(200, h); return res.end(gzip); }
    res.writeHead(200, h);
    res.end(texte);
}
// Adresse publique de la page (http://localhost:8080 en local, https://….onrender.com en ligne)
function adressePublique(req) {
    const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() || 'http';
    return `${proto}://${req.headers.host || `localhost:${PORT}`}`;
}

const serveur = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    try {
        if (url === '/' || url === '/index.html') return envoyerCache(req, res, 'text/html; charset=utf-8', page());
        if (url === '/transfert') return envoyer(res, 'text/html; charset=utf-8', pageTransfert(adressePublique(req)));
        if (url === '/jeu.js') return envoyerCache(req, res, 'text/javascript; charset=utf-8', jeu());
        if (url.startsWith('/api/')) return relayer(req, res);
        // fichiers enregistrés avec la page (polices, thème néon…)
        const fichier = path.join(RACINE, url);
        if (fichier.startsWith(path.join(RACINE, 'Krosmofus TCG - Les Songes Infinis_files')) && fs.existsSync(fichier))
            return envoyer(res, (fichier.endsWith('.js') ? 'text/javascript' : 'text/css') + '; charset=utf-8', fs.readFileSync(fichier));
        // le reste (images, favicon…) vient du vrai site
        return relayer(req, res);
    } catch (e) {
        console.error(e);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(String(e.stack || e));
    }
});

// Relais WebSocket (/ws) : on ouvre la connexion chez le vrai serveur et on fait passer les données dans les deux sens
serveur.on('upgrade', (req, client, debut) => {
    if (!req.url.startsWith('/ws')) return client.destroy();
    const distant = tls.connect({ host: SERVEUR, port: 443, servername: SERVEUR }, () => {
        const h = enTetesDistants(req);
        let entete = `GET ${req.url} HTTP/1.1\r\n`;
        for (const [k, v] of Object.entries(h)) for (const val of [].concat(v)) entete += `${k}: ${val}\r\n`;
        distant.write(entete + '\r\n');
        if (debut && debut.length) distant.write(debut);
        distant.pipe(client).pipe(distant);
    });
    const fermer = () => { client.destroy(); distant.destroy(); };
    distant.on('error', fermer); client.on('error', fermer);
    distant.on('close', fermer); client.on('close', fermer);
});

// en local, seul ce PC y a accès ; en ligne, l'hébergeur doit pouvoir joindre le serveur
serveur.listen(PORT, EN_LIGNE ? '0.0.0.0' : '127.0.0.1', () => {
    if (EN_LIGNE) return console.log(`Krosmofus en ligne sur le port ${PORT} (jeu : ${path.basename(JEU)}, serveur : ${SERVEUR})`);
    console.log(`Krosmofus local : http://localhost:${PORT}  (jeu : ${path.basename(JEU)}, serveur : ${SERVEUR})`);
    console.log(`Connexion Discord : http://localhost:${PORT}/transfert`);
    console.log('Attention : tout ce que tu fais est envoyé au vrai serveur (sauvegarde en ligne, tchat, HDV…).');
});
