// Génère une version obfusquée de krosmofus.js (code brouillé par XOR puis encodé en base64).
// Utilisation : node obfusquer.js [entrée] [sortie]
// Par défaut : krosmofus.js -> krosmofus.obf.js
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const entree = path.resolve(process.argv[2] || 'krosmofus.js');
const sortie = path.resolve(process.argv[3] || 'krosmofus.obf.js');
if (entree === sortie) { console.error('Le fichier de sortie doit être différent du fichier d’entrée.'); process.exit(1); }

const source = fs.readFileSync(entree);
const cle = Buffer.from(crypto.randomBytes(16).toString('hex'));   // nouvelle clé à chaque génération
const brouille = Buffer.alloc(source.length);
for (let i = 0; i < source.length; i++) brouille[i] = source[i] ^ cle[i % cle.length];

const d = brouille.toString('base64');
const k = cle.toString('base64');
// Décodeur exécuté dans le navigateur : base64 -> XOR -> UTF-8 -> exécution
const sortieJs = `(function(){var d="${d}",k=atob("${k}"),b=atob(d),n=b.length,u=new Uint8Array(n),m=k.length;for(var i=0;i<n;i++)u[i]=b.charCodeAt(i)^k.charCodeAt(i%m);Function(new TextDecoder().decode(u))();})();\n`;

fs.writeFileSync(sortie, sortieJs);
console.log(`${path.basename(entree)} -> ${path.basename(sortie)} (${(sortieJs.length / 1048576).toFixed(1)} Mo)`);
