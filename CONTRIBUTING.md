# Contribuer à Secured Whisker

Merci de votre intérêt pour contribuer à Secured Whisker ! Ce document explique comment contribuer de façon efficace et respectueuse.

## Règles générales

- Ouvrez d'abord une issue pour discuter d'une nouvelle fonctionnalité importante ou d'un changement d'architecture.
- Respectez la `CODE_OF_CONDUCT` du projet (si présente) et restez courtois.

## Workflow

1. Forkez le dépôt et créez une branche sur votre fork : `feature/ma-fonctionnalite` ou `fix/description`.
2. Travaillez localement et écrivez des commits clairs et atomiques.
3. Ouvrez une Pull Request (PR) vers la branche `dev` du dépôt principal.
4. Attendez les revues : un mainteneur peut demander des changements.

## Qualité du code

- Respectez les règles de style du sous‑projet (PHP-CS-Fixer / ESLint etc.).
- Ajoutez des tests pour les nouvelles fonctionnalités (unit / integration) quand c'est possible.
- Documentez les changements importants dans le README ou `docs/`.

## Exécution des tests & lint

- Front (Next.js) : `cd front && npm install && npm run lint`.
- Backend PHP (Symfony) : exécutez les tests PHPUnit et fixez les warnings.

## Sécurité

Si vous découvrez une faille de sécurité, ne publiez pas les détails publiquement. Reportez‑la selon `SECURITY.md`.

Merci ! Vos contributions font avancer le projet.
