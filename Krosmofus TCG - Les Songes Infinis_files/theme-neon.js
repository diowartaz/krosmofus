// Thème Néon : actif par défaut, bascule Néon / Classique mémorisée dans le navigateur
(function () {
    var CLE = 'krz_theme';
    var racine = document.documentElement;
    function lire() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }
    function ecrire(v) { try { localStorage.setItem(CLE, v); } catch (e) {} }

    // appliqué tout de suite (script dans <head>) pour éviter un flash du thème bois
    racine.classList.toggle('neon', lire() !== 'classique');

    function bouton() {
        var b = document.createElement('button');
        b.id = 'theme-toggle';
        b.type = 'button';
        function maj() {
            var neon = racine.classList.contains('neon');
            b.textContent = neon ? 'Néon' : 'Classique';
            b.title = neon ? 'Revenir au thème classique' : 'Passer au thème néon';
            b.setAttribute('aria-pressed', String(neon));
        }
        b.onclick = function () {
            var neon = racine.classList.toggle('neon');
            ecrire(neon ? 'neon' : 'classique');
            maj();
        };
        maj();
        // dans la barre de menu si elle existe, sinon flottant en bas à gauche
        var menu = document.getElementById('nav-menu');
        (menu || document.body).appendChild(b);
    }
    if (document.body) bouton(); else document.addEventListener('DOMContentLoaded', bouton);
})();
