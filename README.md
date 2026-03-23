# Minhas Tarefas Android

Aplicativo Expo + React Native para consumir o backend Rails em `../backend`.

## Funcionalidades

- Login JWT.
- Dashboard com card monitorado e ações rápidas.
- Sincronização do snapshot do Trello.
- CRUD de configurações.
- Consulta de logs de uso.

## Setup

1. Copie `.env.example` para `.env`.
2. Ajuste `EXPO_PUBLIC_API_BASE_URL`.
3. Rode:

```bash
npm install
npm run android
```

Para emulador Android, o padrão já usa `http://10.0.2.2:3000/api/v1`.
