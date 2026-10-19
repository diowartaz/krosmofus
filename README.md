# Krosmofus en local

Cette version du jeu tourne sur ton propre PC, à l'adresse http://localhost:8080/.
Elle reste connectée au vrai serveur krosmofus-tcg.com : ton compte, ta sauvegarde en ligne, le tchat et l'hôtel de vente sont les vrais.

> **Attention :** tout ce que tu fais en local compte pour de vrai sur ton compte (cartes gagnées, Kamas, ventes, messages).

## 1. Ce qu'il faut installer (une seule fois)

Seulement **Node.js**, rien d'autre :

1. Va sur https://nodejs.org et télécharge la version **LTS**.
2. Lance l'installateur et garde les choix par défaut (Suivant → Suivant → Installer).

Pour vérifier : ouvre le menu Démarrer, tape `cmd`, ouvre l'**Invite de commandes** et tape `node -v`. Un numéro de version doit s'afficher, par exemple `v24.x.x`.

## 2. Les fichiers du jeu

Tu as reçu un dossier (ou un `.zip` à extraire). Il doit contenir :

```
krosmofus/
├── lancer.bat
├── clear.js
├── Krosmofus TCG - Les Songes Infinis.html
├── Krosmofus TCG - Les Songes Infinis_files/   (polices + thème néon)
└── dev/
    └── serveur-local.js
```

Si c'est un `.zip`, clic droit → **Extraire tout** avant de continuer : le jeu ne se lance pas depuis l'intérieur du zip.

## 3. Lancer le jeu

1. Double-clique sur **`lancer.bat`**.
2. Une fenêtre noire s'ouvre et affiche `Krosmofus local : http://localhost:8080`. **Laisse-la ouverte** pendant que tu joues : c'est le serveur. La fermer arrête le jeu.
3. Le navigateur s'ouvre tout seul sur http://localhost:8080/. Sinon, tape cette adresse toi-même.

Un badge rouge **« LOCAL → krosmofus-tcg.com »** en bas à gauche confirme que tu es sur la version locale.

Le jeu s'affiche avec le **thème Néon**. Le bouton **« Néon »** au bout de la barre de menu permet de revenir au thème **Classique** (et inversement) ; le choix est mémorisé par le navigateur.

Si Windows affiche « Windows a protégé votre ordinateur », clique sur **Informations complémentaires** → **Exécuter quand même**.
Si le pare-feu demande l'accès réseau pour Node.js, tu peux accepter.

Pour arrêter : ferme la fenêtre noire (ou appuie sur Ctrl + C dedans).

## 4. Récupérer ton compte Discord

La connexion Discord ne fonctionne que sur le vrai site. Elle ne revient pas sur localhost. On se connecte donc là-bas, puis on recopie la session en local. C'est à faire **une seule fois** : ensuite, le navigateur se souvient de toi sur localhost.

1. Le serveur lancé, ouvre http://localhost:8080/transfert.
2. **Crée le favori « Copier session Krosmofus » :**
   - Affiche la barre de favoris (Ctrl + Maj + B dans Chrome ou Edge).
   - Glisse le bouton bleu **Copier session Krosmofus** de la page jusque dans cette barre.
   - Si le glisser ne marche pas : clique sur **Copier le code du favori**, ouvre le gestionnaire de favoris (Ctrl + Maj + O), choisis **Ajouter un favori**, nomme-le « Copier session Krosmofus » et colle le code (Ctrl + V) dans l'adresse.
3. Va sur https://krosmofus-tcg.com/ et **connecte-toi avec Discord** comme d'habitude.
4. Toujours sur krosmofus-tcg.com, **clique sur le favori**. Un message confirme « Session Krosmofus copiée ».
5. **Ferme l'onglet krosmofus-tcg.com.** Sinon le jeu affiche « Partie ouverte ailleurs ».
6. Reviens sur http://localhost:8080/transfert, colle dans la grande case (Ctrl + V) et clique sur **Importer et ouvrir le jeu**.

Le jeu s'ouvre avec ton compte.

Ne joue pas en même temps sur le vrai site et en local : les deux utilisent la même sauvegarde.

## 5. Problèmes fréquents

| Ce que tu vois | Solution |
| --- | --- |
| `Node.js n'est pas installé` | Installe Node.js (étape 1), puis relance `lancer.bat`. |
| La page ne s'ouvre pas / « Impossible d'accéder au site » | Vérifie que la fenêtre noire est toujours ouverte, puis recharge la page. |
| `EADDRINUSE` dans la fenêtre noire | Le serveur tourne déjà, dans une autre fenêtre noire. Ferme-la ou utilise celle-là. |
| `ENOENT ... clear.js` | Le fichier `clear.js` manque à côté de `lancer.bat`. |
| `unable to get local issuer certificate` ou `bad option: --use-system-ca` | Mets Node.js à jour avec la dernière version LTS. |
| « Partie ouverte ailleurs » | Ferme les autres onglets du jeu (vrai site compris) et recharge. |
| « Texte invalide » au transfert | Reprends l'étape 4 : clique bien sur le favori **sur krosmofus-tcg.com**, après t'être connecté. |
| Après une mise à jour des fichiers, rien ne change | Recharge la page avec **Ctrl + F5**. |
